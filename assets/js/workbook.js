window.WKBKManager = (function($, WKBKManager) {
    var username;

    var wkbkKey;
    var activeWKBKKey;
    var activeWKBKId;

    var wkbkSet;

    // initial setup
    WKBKManager.setup = function() {
        var deferred = jQuery.Deferred();

        username = Support.getUser();

        // key that stores all workbook infos for the user
        wkbkKey = generateKey(username, "workbookInfos");
        // key that stores the current active workbook Id
        activeWKBKKey = generateKey(username, "activeWorkbook");
        wkbkSet = new WKBKSet();

        WKBKManager.getWKBKsAsync()
        .then(function(oldWorkbooks, sessionInfo) {
            // sycn sessionInfo with wkbkInfo
            var innerDeferred = jQuery.Deferred();

            var numSessions = sessionInfo.numSessions;
            var sessions = sessionInfo.sessions;

            if (oldWorkbooks == null) {
                for (var i = 0; i < numSessions; i++) {
                    console.warn("Error!", sessions[i].name, "has no meta.");
                }

                innerDeferred.resolve(null, sessionInfo);
                return (innerDeferred.promise());
            }
            var wkbkId;
            for (var i = 0; i < numSessions; i++) {
                var wkbkName = sessions[i].name;
                wkbkId = getWKBKId(wkbkName);
                var wkbk;

                if (oldWorkbooks.hasOwnProperty(wkbkId)) {
                    wkbk = new WKBK(oldWorkbooks[wkbkId]);
                    delete oldWorkbooks[wkbkId];
                } else {
                    console.warn("Error!", wkbkName, "has no meta.");
                    wkbk = new WKBK({
                        "id"    : wkbkId,
                        "name"  : wkbkName,
                        "noMeta": true
                    });
                }

                wkbkSet.put(wkbkId, wkbk);
            }

            for (wkbkId in oldWorkbooks) {
                console.warn("Error!", wkbkId, "is missing.");
            }

            // refresh workbook info
            KVStore.put(wkbkKey, wkbkSet.getWithStringify(), true, gKVScope.WKBK)
            .then(function() {
                return KVStore.get(activeWKBKKey, gKVScope.WKBK);
            })
            .then(function(activeId) {
                innerDeferred.resolve(activeId, sessionInfo);
            })
            .fail(innerDeferred.reject);

            return (innerDeferred.promise());
        })
        .then(function(wkbkId, sessionInfo) {
            var innerDeferred = jQuery.Deferred();
            // if no any workbook, force displaying the workbook modal
            if (wkbkId == null ||
                sessionInfo.numSessions === 0 ||
                !wkbkSet.has(wkbkId))
            {
                if (wkbkId == null) {
                    innerDeferred.reject("No workbook for the user");
                } else {
                    KVStore.delete(activeWKBKKey, gKVScope.WKBK)
                    .always(function() {
                        innerDeferred.reject("No workbook for the user");
                    });
                }
                $('#initialLoadScreen').remove();
                WorkbookModal.forceShow();
                var text = StatusMessageTStr.Viewing + " " + WKBKTStr.Location;
                StatusMessage.updateLocation(true, text);
            } else {
                var wkbkName = wkbkSet.get(wkbkId).name;
                var numSessions = sessionInfo.numSessions;
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
                    XcalarSwitchToWorkbook(wkbkName, null)
                    .then(function() {
                        innerDeferred.resolve(wkbkId);
                    })
                    .fail(innerDeferred.reject);
                } else {
                    innerDeferred.resolve(wkbkId);
                }
            }
            return (innerDeferred.promise());
        })
        .then(function(wkbkId) {
            activeWKBKId = wkbkId;
            // console.log("Current Workbook Id is", wkbkId);
            // retive key from username and wkbkId
            var gInfoKey = generateKey(wkbkId, "gInfo");
            var gLogKey  = generateKey(wkbkId, "gLog");
            var gErrKey  = generateKey(wkbkId, "gErr");
            var gUsreKey = generateKey(username, 'gUser');

            KVStore.setup(gInfoKey, gLogKey, gErrKey, gUsreKey);
            deferred.resolve();
        })
        .fail(function(error) {
            console.error("Setup Workbook fails!", error);
            deferred.reject(error);
        })
        .always(function() {
            updateBottomBar();
        });

        return (deferred.promise());
    };

    WKBKManager.getWKBKS = function() {
        return wkbkSet.getAll();
    };


    WKBKManager.getWKBKsAsync = function() {
        var deferred = jQuery.Deferred();
        var sessionInfo;

        XcalarListWorkbooks("*")
        .then(function(output) {
            sessionInfo = output;
            // console.log(sessionInfo);
            return KVStore.getAndParse(wkbkKey, gKVScope.WKBK);
        })
        .then(function(wkbk) {
            deferred.resolve(wkbk, sessionInfo);
        })
        .fail(deferred.reject);

        return (deferred.promise());
    };
    // get current active workbook
    WKBKManager.getActiveWKBK = function() {
        return (activeWKBKId);
    };

    // get current user
    WKBKManager.getUser = function() {
        return (username);
    };

    // make new workbook
    WKBKManager.newWKBK = function(wkbkName, srcWKBKId) {
        var deferred = jQuery.Deferred();

        if (!wkbkName) {
            deferred.reject("Invalid name");
            return (deferred.promise());
        }

        var wkbk;
        var isCopy = (srcWKBKId != null);
        var copySrc = null;

        if (isCopy) {
            copySrc = wkbkSet.get(srcWKBKId);
            if (copySrc == null) {
                // when the source workbook's meta not exist
                deferred.reject("missing workbook meta");
                return (deferred.promise());
            }
        }

        var copySrcName = isCopy ? copySrc.name : null;

        XcalarNewWorkbook(wkbkName, isCopy, copySrcName)
        .then(function() {
            var time = xcHelper.getTimeInMS();
            var options = {
                "id"      : getWKBKId(wkbkName),
                "name"    : wkbkName,
                "created" : time,
                "modified": time,
                "srcUser" : username,
                "curUser" : username
            };

            wkbk = new WKBK(options);
            wkbkSet.put(wkbk.id, wkbk);

            return KVStore.put(wkbkKey, wkbkSet.getWithStringify(), true, gKVScope.WKBK);
        })
        .then(function() {
            // in case KVStore has some remants about wkbkId, clear it
            var innerDeferred = jQuery.Deferred();

            var gInfoKey = generateKey(wkbk.id, "gInfo");
            var gLogKey  = generateKey(wkbk.id, "gLog");

            var def1 = XcalarKeyDelete(gInfoKey, gKVScope.META);
            var def2 = XcalarKeyDelete(gLogKey, gKVScope.LOG);

            jQuery.when(def1, def2)
            .always(function() {
                innerDeferred.resolve();
            });

            return (innerDeferred.promise());
        })
        .then(function() {
            deferred.resolve(wkbk.id);
        })
        .fail(function(error) {
            console.error("Create workbook fails!", error);
            deferred.reject(error);
        });

        return (deferred.promise());
    };

    // swtich to another workbook
    WKBKManager.switchWKBK = function(wkbkId, modalHelper) {
        // validation
        if (wkbkId == null) {
            console.error("Invalid wookbook Id!");
            return;
        }

        if (wkbkId === activeWKBKId) {
            console.info("Switch to itself");
            return;
        }

        if (modalHelper) {
            modalHelper.submit();
        }

        var fromWkbkName;
        var toWkbkName;

        if (activeWKBKId == null) {
            // case that creat a totaly new workbook
            KVStore.put(activeWKBKKey, wkbkId, true, gKVScope.WKBK)
            .then(function() {
                location.reload();
            });
            return;
        }

        // check if the wkbkId is right
        var toWkbk = wkbkSet.get(wkbkId);
        if (toWkbk != null) {
            toWkbkName = toWkbk.name;

            fromWkbkName = (activeWKBKId == null) ?
                                    null :
                                    wkbkSet.get(activeWKBKId).name;
        } else {
            console.error("No such workbook id!");
            if (modalHelper) {
                modalHelper.enableSubmit();
            }
            return;
        }

        // should stop check since seesion is released
        Support.stopHeartbeatCheck();

        // to switch workbook, should release all ref count first
        freeAllResultSetsSync()
        .then(function() {
            return saveCurrentWKBK();
        })
        .then(function() {
            return Support.releaseSession();
        })
        .then(function() {
            return (XcalarSwitchToWorkbook(toWkbkName, fromWkbkName));
        })
        .then(function() {
            return XcalarKeyPut(activeWKBKKey, wkbkId, true, gKVScope.WKBK);
        })
        .then(function() {
            removeUnloadPrompt();
            location.reload();
        })
        .fail(function(error) {
            console.error("Switch Workbook Fails", error);
            // restart if fails
            Support.heartbeatCheck();
        })
        .always(function() {
            if (modalHelper) {
                modalHelper.enableSubmit();
            }
        });
    };

    // copy workbook
    WKBKManager.copyWKBK = function(srcWKBKId, wkbkName) {
        var deferred = jQuery.Deferred();
        var newId;
        WKBKManager.newWKBK(wkbkName, srcWKBKId)
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

        return (deferred.promise());
    };

    WKBKManager.inActiveAllWKBK = function() {
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
                    promises.push(XcalarInActiveWorkbook.bind(this, session.name));
                }
            }

            return PromiseHelper.chain(promises);
        })
        .then(function() {
            return XcalarKeyDelete(activeWKBKKey, gKVScope.WKBK);
        })
        .then(function() {
            removeUnloadPrompt();
            location.reload();
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    // XXX this is buggy now because it clear wkbkInfo but the session info is kept!
    WKBKManager.emptyAll = function() {
        var deferred = jQuery.Deferred();
        var promises = [];

        // delete all workbooks
        var workbooks = wkbkSet.getAll();
        for (var wkbkId in workbooks) {
            promises.push(delWKBKHelper.bind(this, wkbkId));
        }

        // delete all active workbook key
        promises.push(KVStore.delete.bind(this, activeWKBKKey, gKVScope.WKBK));

        PromiseHelper.chain(promises)
        .then(function() {
            return KVStore.delete(wkbkKey, gKVScope.WKBK);
        })
        .then(function() {
            console.log("empty all workbook related info");
            deferred.resolve();
        })
        .fail(function(error) {
            console.error("empty all workbook related fails", error);
            deferred.reject(error);
        });

        return (deferred.promise());
    };

    function updateBottomBar() {
        var workbooks = WKBKManager.getWKBKS();
        var workbook;
        if (activeWKBKId != null && workbooks.hasOwnProperty(activeWKBKId)) {
            workbook = workbooks[activeWKBKId];
            $("#worksheetInfo .wkbkName").text(workbook.name);
            $("#workspaceDate .date").text(xcHelper.getDate("-", null,
                                                        workbook.created));
        } else {
            $("#worksheetInfo .wkbkName").text("N/A");
            $("#workspaceDate .date").text("N/A");
        }

        $("#autoSavedInfo").text("N/A");
    }

    // helper for WKBKManager.copyWKBK
    function copyHelper(srcId, newId) {
        var deferred = jQuery.Deferred();

        var oldInfoKey = generateKey(srcId, "gInfo");
        var oldLogKey  = generateKey(srcId, "gLog");
        var oldErrKey  = generateKey(srcId, "gErr");
        var newInfoKey = generateKey(newId, "gInfo");
        var newLogKey  = generateKey(newId, "gLog");
        var newErrKey  = generateKey(newId, "gErr");

        // copy all info to new key
        KVStore.get(oldInfoKey, gKVScope.META)
        .then(function(value) {
            return KVStore.put(newInfoKey, value, true, gKVScope.META);
        })
        .then(function() {
            return KVStore.get(oldLogKey, gKVScope.LOG);
        })
        .then(function(value) {
            return KVStore.put(newLogKey, value, true, gKVScope.LOG);
        })
        .then(function() {
            return KVStore.get(oldErrKey, gKVScope.ERR);
        })
        .then(function(value) {
            return KVStore.put(newErrKey, value, true, gKVScope.ERR);
        })
        .then(deferred.resolve)
        .fail(deferred.reject);

        return (deferred.promise());
    }

    // helper for WKBKManager.emptyAll
    function delWKBKHelper(wkbkId) {
        var deferred   = jQuery.Deferred();

        var storageKey = generateKey(wkbkId, "gInfo");
        var logKey     = generateKey(wkbkId, "gLog");

        XcalarKeyDelete(storageKey, gKVScope.META)
        .then(function() {
            return (XcalarKeyDelete(logKey, gKVScope.LOG));
        })
        .then(function() {
            console.log("Delete workbook", wkbkId);
            deferred.resolve();
        })
        .fail(function(error) {
            console.error("Delete workbook fails!", error);
            deferred.reject(error);
        });

        return (deferred.promise());
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
        return generateKey(username, "wkbk", wkbkName);
    }

    // save current workbook
    function saveCurrentWKBK() {
        // if activeWKBK is null, then it's creating a new WKBK
        wkbkSet.get(activeWKBKId).update();
        return KVStore.put(wkbkKey, wkbkSet.getWithStringify(), true, gKVScope.WKBK);
    }

    return (WKBKManager);
}(jQuery, {}));
