window.WorkbookManager = (function($, WorkbookManager) {
    var wkbkKey;
    var activeWKBKKey;
    var activeWKBKId;
    var wkbkSet;
    var checkInterval = 2000; // progress bar check time
    var textTime = 1000; // progress text transition
    var progressTextCycle;
    var progressTimeout;

    // initial setup
    WorkbookManager.setup = function() {
        var deferred = jQuery.Deferred();
        initializeVariable();
        setupSessionCancel();

        WorkbookManager.getWKBKsAsync()
        .then(syncSessionInfo)
        .then(activateWorkbook)
        .then(function(wkbkId) {
            activeWKBKId = wkbkId;
            // retrieve key from username and wkbkId
            setupKVStore(wkbkId);
            deferred.resolve();
        })
        .fail(function(error) {
            if (error !== WKBKTStr.NoWkbk) {
                console.error("Setup Workbook fails!", error);
            }
            deferred.reject(error);
        })
        .always(function() {
            KVStore.logSave(true);
        });

        return deferred.promise();
    };

    WorkbookManager.upgrade = function(oldWkbks) {
        if (oldWkbks == null) {
            return null;
        }

        var newWkbks = {};
        for (var wkbkId in oldWkbks) {
            var wkbk = oldWkbks[wkbkId];
            newWkbks[wkbkId] = KVStore.upgrade(wkbk, "WKBK");
        }

        return newWkbks;
    };

    WorkbookManager.commit = function() {
        var deferred = jQuery.Deferred();
        // if activeWKBK is null, then it's creating a new WKBK
        if (activeWKBKId != null) {
            var wkbk = wkbkSet.get(activeWKBKId);
            if (wkbk != null) {
                wkbk.update();
            }
        }

        saveWorkbook()
        .then(deferred.resolve)
        .fail(deferred.reject);

        return deferred.promise();
    };

    WorkbookManager.getWorkbooks = function() {
        return wkbkSet.getAll();
    };

    WorkbookManager.getWorkbook = function(workbookId) {
        var allWorkbooks = wkbkSet.getAll();
        if (!allWorkbooks) {
            return null;
        }
        if (!(workbookId in allWorkbooks)) {
            return null;
        }

        return allWorkbooks[workbookId];
    };

    WorkbookManager.getWKBKsAsync = function() {
        var deferred = jQuery.Deferred();
        var sessionInfo;
        var wkbk;

        XcalarListWorkbooks("*")
        .then(function(sessionRes) {
            sessionInfo = sessionRes;
            return KVStore.getAndParse(wkbkKey, gKVScope.WKBK);
        })
        .then(function(wkbkRes) {
            wkbk = wkbkRes;
            return checkSessionWritable(sessionInfo);
        })
        .then(function(isWrongNode) {
            deferred.resolve(wkbk, sessionInfo, isWrongNode);
        })
        .fail(deferred.reject);

        return (deferred.promise());
    };
    // get current active workbook
    WorkbookManager.getActiveWKBK = function() {
        return (activeWKBKId);
    };

    WorkbookManager.updateWorksheet = function(numWorksheets) {
        var workbook = wkbkSet.get(activeWKBKId);
        workbook.numWorksheets = numWorksheets;
    };

    // make new workbook
    WorkbookManager.newWKBK = function(wkbkName, srcWKBKId) {
        if (!wkbkName) {
            return PromiseHelper.reject("Invalid name");
        }

        var wkbk;
        var isCopy = (srcWKBKId != null);
        var copySrc = null;

        if (isCopy) {
            copySrc = wkbkSet.get(srcWKBKId);
            if (copySrc == null) {
                // when the source workbook's meta not exist
                return PromiseHelper.reject("missing workbook meta");
            }
        }

        var deferred = jQuery.Deferred();
        var copySrcName = isCopy ? copySrc.name : null;
        var username = XcSupport.getUser();

        XcalarNewWorkbook(wkbkName, isCopy, copySrcName)
        .then(function() {
            // when create new wkbk, we always deactiveate it
            var options = {
                "id": getWKBKId(wkbkName),
                "name": wkbkName,
                "srcUser": username,
                "curUser": username,
                "resource": false
            };

            if (isCopy) {
                options.numWorksheets = copySrc.numWorksheets;
                options.modified = copySrc.modified;
            }

            wkbk = new WKBK(options);
            wkbkSet.put(wkbk.id, wkbk);

            return saveWorkbook();
        })
        .then(function() {
            // in case KVStore has some remants about wkbkId, clear it
            var def = delWKBKHelper(wkbk.id);
            return PromiseHelper.alwaysResolve(def);
        })
        .then(function() {
            // If workbook is active, make it inactive so that our UX is linear
            return XcalarListWorkbooks(wkbkName);
        })
        .then(function(retStruct) {
            if (retStruct.numSessions !== 1) {
                var error = "More than one workbook with same name/No workbook";
                console.error(error);
                deferred.reject(error);
            } else {
                if (retStruct.sessions[0].state === "Active") {
                    // This happens when there are no active sessions. The
                    // first one we create gets auto activated
                    xcAssert(!WorkbookManager.getActiveWKBK());
                    XcalarDeactivateWorkbook(retStruct.sessions[0].name)
                    .always(function() {
                        deferred.resolve(wkbk.id);
                        // XXX Handle failure here separately! It should never
                        // happen...
                    });
                } else {
                    deferred.resolve(wkbk.id);
                }
            }
        })
        .fail(function(error) {
            console.error("Create workbook failed!", error);
            deferred.reject(error);
        });

        return deferred.promise();
    };

    // switch to another workbook
    WorkbookManager.switchWKBK = function(wkbkId) {
        // validation
        if (wkbkId == null) {
            return PromiseHelper.reject({"error": "Invalid workbook Id!"});
        }

        if (wkbkId === activeWKBKId) {
            return PromiseHelper.reject({"error": "Cannot switch to same " +
                                                  "workbook"});
        }

        var deferred = jQuery.Deferred();
        var fromWkbkName;
        var toWkbkName;

        if (activeWKBKId == null) {
            // case 1: create a totally new workbook
            // case 2: continue a worbook that has no meta
            // (in this case, when reload, will check the workbook is inactive
            // and will active it)
            KVStore.put(activeWKBKKey, wkbkId, true, gKVScope.WKBK)
            .then(function() {
                // The action below is a no-op to backend if already active.
                $("#initialLoadScreen").show();
                return switchWorkBookHelper(wkbkSet.get(wkbkId).name, null);
            })
            .then(function() {
                activeWKBKId = wkbkId;
                return switchWorkbookAnimation();
            })
            .then(function() {
                xcHelper.reload();
                deferred.resolve();
            })
            .fail(function(ret) {
                if (ret && ret.status === StatusT.StatusSessionNotInact) {
                    switchWorkbookAnimation(true)
                    .then(function() {
                        xcHelper.reload();
                        deferred.resolve();
                    });
                } else {
                    if (!ret) {
                        ret = {
                            error: "Error occurred while switching workbooks"
                        };
                    }
                    $("#initialLoadScreen").hide();
                    $("#container").removeClass("switchingWkbk");
                    endProgressCycle();
                    deferred.reject(ret);
                }
            });
            return deferred.promise();
        }

        // check if the wkbkId is right
        var toWkbk = wkbkSet.get(wkbkId);
        if (toWkbk != null) {
            toWkbkName = toWkbk.name;

            fromWkbkName = (activeWKBKId == null) ?
                                    null :
                                    wkbkSet.get(activeWKBKId).name;
        } else {
            deferred.reject({"error": "No such workbook id!"});
            return deferred.promise();
        }

        // should stop check since session is released
        XcSupport.stopHeartbeatCheck();

        // to switch workbook, should release all ref count first
        $("#initialLoadScreen").show();

        commitActiveWkbk()
        .then(function() {
            return switchWorkBookHelper(toWkbkName, fromWkbkName);
        })
        .then(function() {
            return XcalarKeyPut(activeWKBKKey, wkbkId, true, gKVScope.WKBK);
        })
        .then(function() {
            xcManager.removeUnloadPrompt();
            activeWKBKId = wkbkId;
            return switchWorkbookAnimation();
        })
        .then(function() {
            xcHelper.reload();
            deferred.resolve();
        })
        .fail(function(error) {
            console.error("Switch Workbook Fails", error);
            $("#initialLoadScreen").hide();
            $("#container").removeClass("switchingWkbk");
            endProgressCycle();
            deferred.reject(error);
        })
        .always(function() {
            XcSupport.restartHeartbeatCheck();
        });

        return deferred.promise();
    };

    function countdown() {
        if (!$("#monitorTopBar").find(".wkbkTitle").is(":visible")) {
            return PromiseHelper.resolve();
        }
        var deferred = jQuery.Deferred();
        var time = 3;
        var msg = xcHelper.replaceMsg(WKBKTStr.Refreshing, {
            time: time
        });
        $("#monitorTopBar").find(".wkbkTitle").text(msg);

        var interval = setInterval(function() {
            time--;
            if (time > 0) {
                var msg = xcHelper.replaceMsg(WKBKTStr.Refreshing, {
                    time: time
                });
                $("#monitorTopBar").find(".wkbkTitle").text(msg);
            } else {
                clearInterval(interval);
                deferred.resolve();
            }
        }, 1000);

        return deferred.promise();
    }

    function switchWorkBookHelper(toName, fromName) {
        var deferred = jQuery.Deferred();
        var queryName = XcSupport.getUser() + ":" + toName;
        progressCycle(queryName, checkInterval);
        $("#initialLoadScreen").data("curquery", queryName);
        $("#container").addClass("switchingWkbk");

        XcalarSwitchToWorkbook(toName, fromName)
        .then(deferred.resolve)
        .fail(function(error) {
            console.error(error);

            XcalarListWorkbooks(toName)
            .then(function(ret) {
                var sessionInfo = ret.sessions[0];
                if (sessionInfo.state === "Active") {
                    // when error but backend still active the session
                    showAlert();
                } else {
                    deferred.reject(error);
                }
            })
            .fail(deferred.reject);
        })
        .always(function() {
            $("#initialLoadScreen").removeClass("canceling")
                                   .removeData("canceltime");
            $("#initialLoadScreen").find(".animatedEllipsisWrapper .text")
                                    .text(StatusMessageTStr.PleaseWait);
            $("#container").removeClass("switchingWkbk");
        });

        function showAlert() {
            $("#initialLoadScreen").hide();
            $("#container").removeClass("switchingWkbk");
            endProgressCycle();

            Alert.show({
                "title": WKBKTStr.SwitchErr,
                "msg": WKBKTStr.SwitchErrMsg,
                "onCancel": function() { deferred.reject(); },
                "buttons": [{
                    "name": CommonTxtTstr.Continue,
                    "className": "continue",
                    "func": function() {
                        $("#initialLoadScreen").show();
                        deferred.resolve();
                    }
                }]
            });
        }

        return deferred.promise();
    }

    // copy workbook
    WorkbookManager.copyWKBK = function(srcWKBKId, wkbkName) {
        var deferred = jQuery.Deferred();
        var newId;
        var promise;

        if (activeWKBKId == null) {
            // no active workbook
            promise = PromiseHelper.resolve();
        } else {
            promise = KVStore.commit();
        }

        promise
        .then(function() {
            return WorkbookManager.newWKBK(wkbkName, srcWKBKId);
        })
        .then(function(id) {
            newId = id;
            return copyHelper(srcWKBKId, newId);
        })
        .then(function() {
            deferred.resolve(newId);
        })
        .fail(function(error) {
            console.error("Copy Workbook fails!", error);
            deferred.reject(error);
        });

        return deferred.promise();
    };

    WorkbookManager.pause = function(workbookId) {
        xcAssert(workbookId === activeWKBKId, WKBKTStr.PauseErr);
        var wkbk = wkbkSet.get(workbookId);
        if (wkbk == null) {
            return PromiseHelper.reject(WKBKTStr.PauseErr);
        }

        // should stop check since seesion is released
        XcSupport.stopHeartbeatCheck();

        $("#initialLoadScreen").show();
        var deferred = jQuery.Deferred();

        commitActiveWkbk()
        .then(function() {
            var keepResource = true;
            return XcalarDeactivateWorkbook(wkbk.getName(), keepResource);
        })
        .then(function() {
            // pass in true to always resolve the promise
            var promise = removeActiveWKBKKey();
            return PromiseHelper.alwaysResolve(promise);
        })
        .then(deferred.resolve)
        .fail(deferred.reject)
        .always(function() {
            $("#initialLoadScreen").hide();
            endProgressCycle();
            XcSupport.restartHeartbeatCheck();
        });

        return deferred.promise();
    };

    WorkbookManager.deactivate = function(workbookId) {
        var wkbk = wkbkSet.get(workbookId);
        if (wkbk == null) {
            return PromiseHelper.reject(WKBKTStr.DeactivateErr);
        }

        // should stop check since seesion is released
        XcSupport.stopHeartbeatCheck();

        $("#initialLoadScreen").show();
        var deferred = jQuery.Deferred();

        XcalarDeactivateWorkbook(wkbk.getName())
        .then(function() {
            wkbk.setResource(false);
            var promise = saveWorkbook();
            return PromiseHelper.alwaysResolve(promise);
        })
        .then(deferred.resolve)
        .fail(deferred.reject)
        .always(function() {
            $("#initialLoadScreen").hide();
            endProgressCycle();
            XcSupport.restartHeartbeatCheck();
        });

        return deferred.promise();
    };

    WorkbookManager.inActiveAllWKBK = function() {
        var deferred = jQuery.Deferred();
        var promises = [];

        XcalarListWorkbooks("*")
        .then(function(output) {
            var numSessions = output.numSessions;
            var sessions = output.sessions;
            // console.log(sessionInfo);
            for (var i = 0; i < numSessions; i++) {
                var session = sessions[i];
                if (session.state === "Active") {
                    promises.push(XcalarDeactivateWorkbook.bind(this,
                                                                session.name));
                }
            }

            return PromiseHelper.chain(promises);
        })
        .then(function() {
            return removeActiveWKBKKey();
        })
        .then(function() {
            xcManager.removeUnloadPrompt();
            xcHelper.reload();
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    WorkbookManager.renameWKBK = function(srcWKBKId, newName) {
        var newWKBKId = getWKBKId(newName);

        if (wkbkSet.has(newWKBKId)) {
            var errStr = xcHelper.replaceMsg(ErrTStr.WorkbookExists,
                                             {'workbookName': newName});
            return PromiseHelper.reject(errStr);
        }

        var deferred = jQuery.Deferred();
        var isCurrentWKBK = (srcWKBKId === activeWKBKId);
        var srcWKBK = wkbkSet.get(srcWKBKId);

        // should follow theses order:
        // 1. stop heart beat check (in case key is changed)
        // 2. copy meta to new wkbkb,
        // 3. rename wkbk
        // 4. delete meta in current wkbk
        // 5. update wkbkSet meta
        // 6. reset KVStore and change active key if change current wkbk's name
        // 7. restart heart beat check
        var promise = null;
        if (activeWKBKId == null) {
            // when no active workbook
            promise = PromiseHelper.resolve();
        } else {
            promise = KVStore.commit();
        }

        XcSupport.stopHeartbeatCheck();

        promise
        .then(function() {
            return copyHelper(srcWKBKId, newWKBKId);
        })
        .then(function() {
            return XcalarRenameWorkbook(newName, srcWKBK.name);
        })
        .then(function() {
            var def = delWKBKHelper(srcWKBK.id);
            return PromiseHelper.alwaysResolve(def);
        })
        .then(function() {
            var options = {
                "id": newWKBKId,
                "name": newName,
                "created": srcWKBK.created,
                "srcUser": srcWKBK.srcUser,
                "curUser": srcWKBK.curUser,
                "numWorksheets": srcWKBK.numWorksheets
            };

            var newWkbk = new WKBK(options);
            wkbkSet.put(newWKBKId, newWkbk);
            wkbkSet.delete(srcWKBK.id);
            return saveWorkbook();
        })
        .then(function() {
            if (isCurrentWKBK) {
                /// Change workbookname in status bar
                $("#worksheetInfo .wkbkName").text(newName);
                return resetActiveWKBK(newWKBKId);
            }
        })
        .then(function() {
            deferred.resolve(newWKBKId);
        })
        .fail(deferred.reject)
        .always(function() {
            XcSupport.restartHeartbeatCheck();
        });

        return deferred.promise();
    };

    WorkbookManager.deleteWKBK = function(workbookId) {
        var workbook = wkbkSet.get(workbookId);

        if (workbook == null) {
            return PromiseHelper.reject(WKBKTStr.DelErr);
        }

        var deferred = jQuery.Deferred();
        var isCurrentWKBK = (workbookId === activeWKBKId);

        // 1. Stop heart beat check (Heartbeat key may change due to active
        //                           worksheet changing)
        // 2. Delete workbook form backend
        // 2. Delete the meta data for the current workbook
        // 3. Remove KV store key for active workbook if deleted workbook is
        //    previously the active one
        // 4. Restart heart beat check
        XcSupport.stopHeartbeatCheck();

        XcalarDeleteWorkbook(workbook.name)
        .then(function() {
            var def = delWKBKHelper(workbookId);
            return PromiseHelper.alwaysResolve(def);
        })
        .then(function() {
            if (isCurrentWKBK) {
                return XcalarKeyDelete(activeWKBKKey, gKVScope.WKBK);
            } else {
                PromiseHelper.resolve(null);
            }
        })
        .then(function() {
            wkbkSet.delete(workbook.id);

            // XXX may not need KVStore.commit(),
            // bring KVStore.commit() back if it's buggy
            return WorkbookManager.commit();

            // var innerDeferred = jQuery.Deferred();
            // KVStore.commit()
            // .then(innerDeferred.resolve)
            // .fail(function(error) {
            //     if (error.status === StatusT.StatusSessionNotFound) {
            //         // normal error when no any active seesion
            //         // and trigger deleting
            //         innerDeferred.resolve();
            //     } else {
            //         innerDeferred.reject(error);
            //     }
            // });

            // return innerDeferred.promise();
        })
        .then(deferred.resolve)
        .fail(deferred.reject)
        .always(function() {
            XcSupport.restartHeartbeatCheck();
        });

        return deferred.promise();
    };

    WorkbookManager.getGlobalScopeKeys = function(version) {
        return getGlobalScopeKeys(version);
    };

    function initializeVariable() {
        var username = XcSupport.getUser();
        // key that stores all workbook infos for the user
        wkbkKey = getWKbkKey(currentVersion);
        // key that stores the current active workbook Id
        activeWKBKKey = generateKey(username, "activeWorkbook");
        wkbkSet = new WKBKSet();
    }

    function setupSessionCancel() {
        var $loadScreen = $("#initialLoadScreen");
        $loadScreen.find(".cancel").click(function() {
            if ($loadScreen.hasClass("canceling")) {
                return;
            }
            $loadScreen.addClass("canceling");
            var time = Date.now();
            $loadScreen.data('canceltime', time);
            $loadScreen.addClass("alertOpen");

            Alert.show({
                "title": WKBKTStr.CancelTitle,
                "msg": WKBKTStr.CancelMsg,
                "hideButtons": ["cancel"],
                "buttons": [{
                    "name": AlertTStr.CLOSE,
                    "className": "btn-cancel",
                    func: function() {
                        $loadScreen.removeClass("canceling alertOpen");
                    }
                }, {
                    "name": AlertTStr.CONFIRM,
                    func: cancel
                }],
                "onCancel": function() {
                    $loadScreen.removeClass("canceling alertOpen");
                },
                "ultraHighZindex": true
            });

            function cancel() {
                $loadScreen.removeClass("alertOpen");
                if ($loadScreen.data("canceltime") !== time ||
                    !$loadScreen.hasClass("canceling")) {
                    return;
                }
                endProgressCycle();

                $loadScreen.find(".animatedEllipsisWrapper .text")
                           .text(StatusMessageTStr.Canceling);
                var queryName = $loadScreen.data("curquery");
                XcalarQueryCancel(queryName)
                .always(function() {
                    $loadScreen.removeClass("canceling")
                               .removeData("canceltime");
                    $loadScreen.find(".animatedEllipsisWrapper .text")
                               .text(StatusMessageTStr.PleaseWait);
                });
            }
        });
    }

    function getWKbkKey(version) {
        var username = XcSupport.getUser();
        return generateKey(username, "workbookInfos", version);
    }

    function setupKVStore(wkbkId) {
        var globlKeys = getGlobalScopeKeys(currentVersion);
        var userScopeKeys = getUserScopeKeys(currentVersion);
        var wkbkScopeKeys = getWkbkScopeKeys(wkbkId, currentVersion);

        var keys = $.extend({}, globlKeys, userScopeKeys, wkbkScopeKeys);

        KVStore.setup(keys);
    }

    function getGlobalScopeKeys(version) {
        var gEphInfoKey = generateKey("", "gEphInfo", version);
        var gSettingsKey = generateKey("", "gSettings", version);
        // gPendingUploadsKey don't need to versioning
        var gPendingUploadsKey = generateKey("", "gPUploads");

        return {
            "gEphStorageKey": gEphInfoKey,
            "gSettingsKey": gSettingsKey,
            "gPendingUploadsKey": gPendingUploadsKey
        };
    }

    function getUserScopeKeys(version) {
        var username = XcSupport.getUser();
        var gUserKey = generateKey(username, "gUser", version);
        var gAuthKey = generateKey(username, "authentication", version);

        return {
            "gUserKey": gUserKey,
            "gAuthKey": gAuthKey
        };
    }

    function getWkbkScopeKeys(wkbkId, version) {
        var gStorageKey = generateKey(wkbkId, "gInfo", version);
        var gLogKey = generateKey(wkbkId, "gLog", version);
        var gErrKey = generateKey(wkbkId, "gErr", version);

        return {
            "gStorageKey": gStorageKey,
            "gLogKey": gLogKey,
            "gErrKey": gErrKey
        };
    }

    // sync sessionInfo with wkbkInfo
    function syncSessionInfo(oldWorkbooks, sessionInfo, isWrongNode) {
        var deferred = jQuery.Deferred();

        try {
            var loseOldMeta = false;
            if (oldWorkbooks == null) {
                oldWorkbooks = {};
                loseOldMeta = true;
            }

            var promise = isWrongNode
                        ? PromiseHelper.resolve()
                        : syncWorkbookMeta(oldWorkbooks, sessionInfo);

            promise
            .then(function() {
                var activeWorkbooks = getActiveWorkbooks(sessionInfo);
                return checkActiveWorkbook(activeWorkbooks, loseOldMeta,
                                            isWrongNode);
            })
            .then(function(storedActiveId) {
                deferred.resolve(storedActiveId, sessionInfo);
            })
            .fail(deferred.reject);
        } catch (error) {
            console.error(error);
            deferred.reject(error);
        }

        return deferred.promise();
    }

    function getActiveWorkbooks(sessionInfo) {
        var numSessions = sessionInfo.numSessions;
        var sessions = sessionInfo.sessions;
        var activeWorkbooks = [];
        for (var i = 0; i < numSessions; i++) {
            if (sessions[i].state === "Active") {
                activeWorkbooks.push(sessions[i].name);
            }
        }
        return activeWorkbooks;
    }

    // resolve if it's wrong node or not
    function checkSessionWritable(sessionInfo) {
        var deferred = jQuery.Deferred();
        var activeWorkbooks = getActiveWorkbooks(sessionInfo);
        var shouldCheck = (activeWorkbooks.length === 1);

        if (shouldCheck) {
            // Test session kvstore write
            var scope = XcalarApiKeyScopeT.XcalarApiKeyScopeSession;
            KVStore.put("testKey", "unused", false, scope)
            .then(function() {
                deferred.resolve(false);
            })
            .fail(function() {
                deferred.resolve(true);
            });
        } else {
            deferred.resolve(false);
        }

        return deferred.promise();
    }

    function checkActiveWorkbook(activeWorkbooks, loseOldMeta, isWrongNode) {
        var deferred = jQuery.Deferred();
        var storedActiveId;

        getActiveWorkbookId(loseOldMeta)
        .then(function(activeId) {
            storedActiveId = activeId;
            // Handle case where there are 2 or more active workbooks or
            // where there is no active workbook but we think that there is
            if (activeWorkbooks.length === 0 && activeId) {
                // We think there's an active workbook but there actually
                // isn't. Remove active and set it to null. next step
                // resolves this
                storedActiveId = undefined;
                return KVStore.delete(activeWKBKKey, gKVScope.WKBK);
            } else if (activeWorkbooks.length > 1 || isWrongNode) {
                // This clause needs to be in front of the other 2
                // This is something that we do not support
                // We will inactivate all the sessions and force user to
                // reselect

                // XXX For wrong node case
                // This does not work yet because of a backend bug
                // where you are not able to deactivate a workbook from another
                // node.
                storedActiveId = undefined;
                var defArray = [];
                for (var i = 0; i < activeWorkbooks.length; i++) {
                    defArray.push(XcalarDeactivateWorkbook(activeWorkbooks[i]));
                }
                if (activeId) {
                    defArray.push(KVStore.delete(activeWKBKKey,
                                                 gKVScope.WKBK));
                }
                return PromiseHelper.when.apply(this, defArray);
            } else if (activeWorkbooks.length === 1 && !activeId) {
                // Backend has active, we don't. Set it and go
                storedActiveId = getWKBKId(activeWorkbooks[0]);
                return KVStore.put(activeWKBKKey, storedActiveId, true,
                                   gKVScope.WKBK);
            } else if (activeWorkbooks.length === 1 && activeId &&
                getWKBKId(activeWorkbooks[0]) !== activeId) {
                // Backend's version of active is different from us.
                // We listen to backend
                storedActiveId = getWKBKId(activeWorkbooks[0]);
                return KVStore.put(activeWKBKKey, storedActiveId, true,
                                   gKVScope.WKBK);
            } else {
                return;
            }
        })
        .then(function() {
            deferred.resolve(storedActiveId);
        })
        .fail(deferred.reject);


        return deferred.promise();
    }

    function getActiveWorkbookId(loseOldMeta) {
        if (loseOldMeta) {
            // If we fail to get our old meta data, set activeWorkbook
            // to null
            return PromiseHelper.resolve(null);
        } else {
            return KVStore.get(activeWKBKKey, gKVScope.WKBK);
        }
    }

    function checkResource(sessionInfo) {
        return (sessionInfo.toLowerCase() === "has resources");
    }

    function syncWorkbookMeta(oldWorkbooks, sessionInfo) {
        var numSessions = sessionInfo.numSessions;
        var sessions = sessionInfo.sessions;

        for (var i = 0; i < numSessions; i++) {
            var wkbkName = sessions[i].name;
            var hasResouce = checkResource(sessions[i].info);
            var wkbkId = getWKBKId(wkbkName);
            var wkbk;

            if (oldWorkbooks.hasOwnProperty(wkbkId)) {
                wkbk = new WKBK(oldWorkbooks[wkbkId]);
                delete oldWorkbooks[wkbkId];
            } else {
                console.warn("Error!", wkbkName, "has no meta.");
                wkbk = new WKBK({
                    "id": wkbkId,
                    "name": wkbkName,
                    "noMeta": true
                });
            }

            wkbk.setResource(hasResouce);
            wkbkSet.put(wkbkId, wkbk);
        }

        for (var oldWkbkId in oldWorkbooks) {
            console.warn("Error!", oldWkbkId, "is missing.");
        }

        // refresh workbook info
        return saveWorkbook();
    }

    WorkbookManager.getKeysForUpgrade = function(sessionInfo, version) {
        var globalKeys = getGlobalScopeKeys(version);
        var userKeys = getUserScopeKeysForUpgrade(version);
        var wkbkKeys = getWkbkScopeKeysForUpgrade(sessionInfo, version);

        return {
            "global": globalKeys,
            "user": userKeys,
            "wkbk": wkbkKeys
        };
    };

    function getUserScopeKeysForUpgrade(version) {
        var keys = getUserScopeKeys(version);
        var wkbkKeyOfVersion = getWKbkKey(version);

        keys = $.extend(keys, {
            "wkbkKey": wkbkKeyOfVersion
        });

        return keys;
    }

    function getWkbkScopeKeysForUpgrade(sessionInfo, version) {
        var wkbks = {};
        var numSessions = sessionInfo.numSessions;
        var sessions = sessionInfo.sessions;

        for (var i = 0; i < numSessions; i++) {
            var wkbkName = sessions[i].name;
            var wkbkId = getWKBKId(wkbkName);
            var keys = getWkbkScopeKeys(wkbkId, version);
            wkbks[wkbkId] = keys;
        }

        return wkbks;
    }

    function activateWorkbook(wkbkId, sessionInfo) {
        var deferred = jQuery.Deferred();

        try {
            var numSessions = sessionInfo.numSessions;
            // if no workbook, force displaying the workbook modal
            if (wkbkId == null || numSessions === 0 || !wkbkSet.has(wkbkId)) {
                if (wkbkId == null) {
                    deferred.reject(WKBKTStr.NoWkbk);
                } else {
                    KVStore.delete(activeWKBKKey, gKVScope.WKBK)
                    .always(function() {
                        deferred.reject(WKBKTStr.NoWkbk);
                    });
                }
            } else {
                var wkbkName = wkbkSet.get(wkbkId).name;
                var sessions = sessionInfo.sessions;
                var isInactive = false;

                for (var i = 0; i < numSessions; i++) {
                    var session = sessions[i];

                    if (session.name === wkbkName &&
                        session.state === "Inactive")
                    {
                        isInactive = true;
                        break;
                    }
                }

                if (isInactive) {
                    console.log("activating");
                    XcalarSwitchToWorkbook(wkbkName, null)
                    .then(function() {
                        deferred.resolve(wkbkId);
                    })
                    .fail(deferred.reject);
                } else {
                    deferred.resolve(wkbkId);
                }
            }
        } catch (error) {
            console.error(error);
            deferred.reject(error);
        }

        return deferred.promise();
    }

    function saveWorkbook() {
        return KVStore.put(wkbkKey, wkbkSet.getWithStringify(), true, gKVScope.WKBK);
    }

    function resetActiveWKBK(newWKBKId) {
        var deferred = jQuery.Deferred();

        setupKVStore(newWKBKId);
        // rehold the session as KVStore's key changed
        XcSupport.holdSession()
        .then(function() {
            activeWKBKId = newWKBKId;
            return KVStore.put(activeWKBKKey, activeWKBKId, true, gKVScope.WKBK);
        })
        .then(deferred.resolve)
        .fail(deferred.reject);

        return deferred.promise();
    }

    // helper for WorkbookManager.copyWKBK
    function copyHelper(srcId, newId) {
        var deferred = jQuery.Deferred();
        var oldWkbkScopeKeys = getWkbkScopeKeys(srcId, currentVersion);
        var newWkbkScopeKeys = getWkbkScopeKeys(newId, currentVersion);

        copyAction("gStorageKey", gKVScope.META)
        .then(function() {
            return copyAction("gLogKey", gKVScope.LOG);
        })
        .then(function() {
            return copyAction("gErrKey", gKVScope.ERR);
        })
        .then(deferred.resolve)
        .fail(deferred.reject);

        function copyAction(key, scope) {
            // copy all info to new key
            var innerDeferred = jQuery.Deferred();
            var oldKey = oldWkbkScopeKeys[key];
            var newKey = newWkbkScopeKeys[key];

            KVStore.get(oldKey, scope)
            .then(function(value) {
                return KVStore.put(newKey, value, true, scope);
            })
            .then(innerDeferred.resolve)
            .fail(innerDeferred.reject);

            return innerDeferred.promise();
        }

        return deferred.promise();
    }

    function delWKBKHelper(wkbkId) {
        var deferred = jQuery.Deferred();

        var wkbkScopeKeys = getWkbkScopeKeys(wkbkId, currentVersion);

        var storageKey = wkbkScopeKeys.gStorageKey;
        var logKey = wkbkScopeKeys.gLogKey;
        var errorKey = wkbkScopeKeys.gErrKey;

        var def1 = XcalarKeyDelete(storageKey, gKVScope.META);
        var def3 = XcalarKeyDelete(logKey, gKVScope.LOG);
        var def2 = XcalarKeyDelete(errorKey, gKVScope.ERR);

        PromiseHelper.when(def1, def2, def3)
        .then(deferred.resolve)
        .fail(function(error) {
            console.error("Delete workbook fails!", error);
            deferred.reject(error);
        });

        return deferred.promise();
    }

    function removeActiveWKBKKey() {
        var deferred = jQuery.Deferred();
        XcalarKeyDelete(activeWKBKKey, gKVScope.WKBK)
        .then(function() {
            activeWKBKId = null;
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    }

    function commitActiveWkbk() {
        var deferred = jQuery.Deferred();
        var promise = TblManager.freeAllResultSetsSync();

        PromiseHelper.alwaysResolve(promise)
        .then(function() {
            return KVStore.commit();
        })
        .then(deferred.resolve)
        .fail(deferred.reject);

        return deferred.promise();
    }

    // generate key for KVStore use
    function generateKey() {
        // currently just cat all arguments as a key
        var key;
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i]) {
                if (!key) {
                    key = arguments[i];
                } else {
                    key += "-" + arguments[i];
                }
            }
        }
        return (key);
    }

    function getWKBKId(wkbkName) {
        var username = XcSupport.getUser();
        return generateKey(username, "wkbk", wkbkName);
    }

    function switchWorkbookAnimation(failed) {
        var deferred = jQuery.Deferred();
        if (!failed) {
            progressComplete();
        }
        var $loadScreen = $("#initialLoadScreen");
        $loadScreen.removeClass("canceling").removeData("canceltime");
        $loadScreen.find(".animatedEllipsisWrapper .text")
                   .text(StatusMessageTStr.PleaseWait);
        countdown()
        .then(function() {
            MainMenu.close(true);
            Workbook.hide(true);

            deferred.resolve();
        });
        return deferred.promise();
    }

    function progressCycle(queryName, adjustTime, retry) {
        var intTime = checkInterval;
        if (adjustTime) {
            intTime = Math.max(200, checkInterval - adjustTime);
        }
        progressTimeout = setTimeout(function() {
            var timeoutNum = progressTimeout;
            var startTime = Date.now();

            getProgress(queryName)
            .then(function(progress) {
                if (timeoutNum !== progressTimeout) {
                    return;
                }
                if (progress.numTotal < 1) {
                    return;
                }
                var $loadScreen = $("#initialLoadScreen");
                var $bar = $loadScreen.find(".progressBar");
                var $numSteps = $loadScreen.find(".numSteps");
                var $progressNode = $loadScreen.find(".progressNode");
                if (!$loadScreen.hasClass("sessionProgress")) {
                    $loadScreen.addClass("sessionProgress");
                    $bar.stop().width(0).data("pct", 0);
                    $progressNode.text("").data("node", "");
                    $numSteps.data("num", 0);
                }
                $bar.data("totalsteps", progress.numTotal);
                var pct = Math.round(100 * progress.numCompleted /
                                     progress.numTotal);
                var lastPct = $bar.data("pct");
                if (pct !== lastPct) {
                    var animTime = checkInterval;
                    if (pct === 100) {
                        animTime /= 2;
                    }
                    $bar.animate({"width": pct + "%"}, animTime, "linear");
                    $bar.data("pct", pct);
                }
                var lastNum = $numSteps.data("num");

                transitionProgressText(lastNum, progress.numCompleted,
                                       progress.numTotal);
                $numSteps.data("num", progress.numCompleted);
                var type;
                if (progress.processingNode) {
                    type = XcalarApisTStr[progress.processingNode.api];
                    $progressNode.text(StatusMessageTStr.CurrReplay + ": " +
                                        type)
                                 .data("node", progress.processingNode);
                } else if ($progressNode.data("node")) {
                    var node = $progressNode.data("node");
                    type = XcalarApisTStr[node.api];
                    $progressNode.text(StatusMessageTStr.CompReplay + ": " +
                                       type);
                }
                if (progress.numCompletedWorkItem === progress.numTotal) {
                    return;
                }
                var elapsedTime = Date.now() - startTime;
                progressCycle(queryName, elapsedTime);
            })
            .fail(function() {
                if (timeoutNum !== progressTimeout) {
                    return;
                }
                if (!retry) {
                    progressCycle(queryName, true);
                }
            });
        }, intTime);
    }

    function transitionProgressText(lastNum, currNum, total) {
        clearInterval(progressTextCycle);
        var $loadScreen = $("#initialLoadScreen");
        var $numSteps = $loadScreen.find(".numSteps");
        var count = 0;
        setTimeout(function() {
            clearInterval(progressTextCycle);
            $numSteps.text(currNum + "/" + total);
        }, checkInterval);

        $numSteps.text(lastNum + "/" + total);

        var diff = currNum - lastNum;
        var numChanges = Math.floor(checkInterval / textTime);
        var vals = [];
        for (var i = 0; i < numChanges; i++) {
            vals.push(lastNum + Math.floor(diff * ((i + 1) / numChanges)));
        }

        progressTextCycle = setInterval(function() {
            if (count >= numChanges) {
                clearInterval(progressTextCycle);
                $numSteps.text(currNum + "/" + total);
            } else {
                $numSteps.text(vals[count] + "/" + total);
            }
            count++;
        }, textTime);
    }

    function getProgress(queryName) {
        var deferred = jQuery.Deferred();
        XcalarQueryState(queryName)
        .then(function(ret) {
            var state;
            var numCompleted = 0;
            var processingNode;
            for (var i = 0; i < ret.queryGraph.numNodes; i++) {
                state = ret.queryGraph.node[i].state;
                if (state === DgDagStateT.DgDagStateReady) {
                    numCompleted++;
                } else if (state === DgDagStateT.DgDagStateProcessing) {
                    processingNode = ret.queryGraph.node[i];
                }
            }
            var progress = {
                numCompleted: numCompleted,
                numTotal: ret.queryGraph.numNodes,
                processingNode: processingNode
            };
            deferred.resolve(progress);
        })
        .fail(deferred.reject);
        return deferred.promise();
    }

    function progressComplete() {
        var $loadScreen = $("#initialLoadScreen");
        var $bar = $loadScreen.find(".progressBar");
        var $numSteps = $loadScreen.find(".numSteps");
        $bar.stop().width("100%").data('pct', 100);
        var numSteps = $bar.data("totalsteps");
        $numSteps.text(numSteps + "/" + numSteps);
        clearTimeout(progressTimeout);
    }

    function endProgressCycle() {
        clearTimeout(progressTimeout);
        progressTimeout += "canceled";
        $("#initialLoadScreen").removeClass("sessionProgress");
    }

    /* Unit Test Only */
    if (window.unitTestMode) {
        WorkbookManager.__testOnly__ = {};
        WorkbookManager.__testOnly__.generateKey = generateKey;
        WorkbookManager.__testOnly__.getWKBKId = getWKBKId;
        WorkbookManager.__testOnly__.delWKBKHelper = delWKBKHelper;
        WorkbookManager.__testOnly__.copyHelper = copyHelper;
        WorkbookManager.__testOnly__.resetActiveWKBK = resetActiveWKBK;
        WorkbookManager.__testOnly__.saveWorkbook = saveWorkbook;
        WorkbookManager.__testOnly__.syncSessionInfo = syncSessionInfo;
        WorkbookManager.__testOnly__.switchWorkBookHelper = switchWorkBookHelper;
        WorkbookManager.__testOnly__.changeIntTime = function(time, tTime) {
            checkInterval = time;
            textTime = tTime;
        };
        WorkbookManager.__testOnly__.progressCycle = progressCycle;
        WorkbookManager.__testOnly__.endProgressCycle = endProgressCycle;
    }
    /* End Of Unit Test Only */

    return (WorkbookManager);
}(jQuery, {}));
