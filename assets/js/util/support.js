window.Support = (function(Support, $) {
    var username;
    var commitFlag;
    var commitCheckTimer;
    var commitCheckInterval = 120000; // 2 mins each check
    var commitCheckError = "commit key not match";

    var connectionCheckTimer;
    var connectionCheckInterval = 10000; // 10s/check

    var numNodes;
    var statsMap = null;
    var isCheckingMem = false;
    // constant
    var defaultCommitFlag = "commit-default";

    var statsCache = {}; // Store temporary version of the Stats

    Support.setup = function() {
        try {
            username = xcSessionStorage.getItem("xcalar-username");
            // set up session variables
            userIdName = username;
            userIdUnique = getUserIdUnique(username);
        } catch (error) {
            console.error(error);
        }
    };

    Support.getUser = function() {
        return username;
    };

    Support.holdSession = function() {
        return sessionHoldCheck();
    };

    Support.releaseSession = function() {
        var deferred = jQuery.Deferred();
        var promise;

        if (StartManager.getStatus() === SetupStatus.Fail) {
            // when setup fails and logout, should not commit
            // (the module even didn't setup yet)
            promise = PromiseHelper.resolve();
        } else {
            promise = KVStore.commit();
        }

        promise
        .then(function() {
            return XcalarKeyPut(KVStore.commitKey, defaultCommitFlag, false, gKVScope.FLAG);
        })
        .then(function() {
            xcSessionStorage.removeItem(username);
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    // in case you are hold forever
    Support.forceReleaseSession = function() {
        xcSessionStorage.removeItem(username);
        XcalarKeyPut(KVStore.commitKey, defaultCommitFlag, false, gKVScope.FLAG)
        .then(function() {
            location.reload();
        })
        .fail(function(error) {
            console.error(error);
        });
    };

    Support.commitCheck = function() {
        var deferred = jQuery.Deferred();
        if (KVStore.commitKey == null) {
            // when workbook is not set up yet or no workbook yet
            deferred.resolve();
        } else {
            XcalarKeyLookup(KVStore.commitKey, gKVScope.FLAG)
            .then(function(val) {
                if (val == null || val.value !== commitFlag) {
                    commitMismatchHandler();
                    deferred.reject(commitCheckError);
                } else {
                    deferred.resolve();
                }
            })
            .fail(function(error) {
                if (error.status === StatusT.StatusSessionNotFound) {
                    commitMismatchHandler();
                    deferred.reject(commitCheckError);
                } else {
                    deferred.reject(error);
                }
            });
        }

        return (deferred.promise());
    };

    Support.memoryCheck = function() {
        if (isCheckingMem) {
            console.warn("Last time's  mem check not finish yet");
            return PromiseHelper.resolve();
        }

        var deferred = jQuery.Deferred();

        var yellowThreshold = 0.8;
        var redThreshold = 0.9;

        isCheckingMem = true;

        refreshTables()
        .then(function() {
            return xcHelper.getMemUsage();
        })
        .then(detectMemoryUsage)
        .then(deferred.resolve)
        .fail(deferred.reject)
        .always(function() {
            isCheckingMem = false;
        });

        return deferred.promise();

        function refreshTables() {
            var innerDeferred = jQuery.Deferred();
            // need it to detect if users have tables
            TableList.refreshOrphanList(false)
            .always(innerDeferred.resolve);

            return innerDeferred.promise();
        }

        function detectMemoryUsage(nodes) {
            jQuery.each(nodes, function(index, nodeInfo) {
                var shouldAlert;
                if (nodeInfo.mlock && nodeInfo.mlock.xdb_pages) {
                    var tableInfo = nodeInfo.mlock.xdb_pages;
                    var tableUsage = tableInfo.used / tableInfo.total;
                    shouldAlert = handleMemoryUsage(tableUsage, true);
                    if (shouldAlert) {
                        // stop looping
                        return false;
                    }
                }
                // XXX not sure if it's the right formula for ds yet
                if (nodeInfo.malloc) {
                    var dsInfo = nodeInfo.malloc;
                    var dsUsage = dsInfo.used / dsInfo.total;
                    shouldAlert = handleMemoryUsage(dsUsage, false);

                    if (shouldAlert) {
                        // stop looping
                        return false;
                    }
                }
            });
        }

        function handleMemoryUsage(memoryUsage, isTable) {
            var shouldAlert = false;
            var $memoryAlert = $("#memoryAlert");

            if (memoryUsage > redThreshold) {
                // when it's red, can stop loop immediately
                $memoryAlert.addClass("red").removeClass("yellow");
                shouldAlert = true;
            } else if (memoryUsage > yellowThreshold) {
                // when it's yellow, should continue loop
                // to see if it has any red case
                $memoryAlert.addClass("yellow").removeClass("red");
                shouldAlert = true;
            } else {
                $memoryAlert.removeClass("red").removeClass("yellow");
            }
            // XXX Remove following if clause when ds memory is fixed
            if (!isTable) {
                shouldAlert = false;
                $memoryAlert.removeClass("red").removeClass("yellow");
            }

            if (shouldAlert) {
                var text;
                if (isTable) {
                    if (jQuery.isEmptyObject(gTables) &&
                        gOrphanTables.length === 0)
                    {
                        text = TooltipTStr.LowMemByOthers;
                    } else {
                        text = TooltipTStr.LowMemInTable;
                    }
                    $memoryAlert.addClass("tableAlert");
                } else {
                    text = TooltipTStr.LowMemInDS;
                    $memoryAlert.removeClass("tableAlert");
                }

                xcTooltip.changeText($memoryAlert, text);
            }

            return shouldAlert;
        }
    };

    Support.heartbeatCheck = function() {
        commitCheckInterval = (UserSettings.getPref('commitInterval') * 1000) ||
                             commitCheckInterval;
        clearInterval(commitCheckTimer);
        commitCheckTimer = setInterval(function() {
            if (KVStore.commitKey == null) {
                // when workbook is not set up yet or no workbook yet
                return;
            }

            Support.commitCheck()
            .then(function() {
                // this one just commit tracker data
                // can be paraell
                xcTracker.commit();
                return Support.memoryCheck();
            })
            .then(function() {
                return autoSave();
            })
            .fail(function(error) {
                console.error(error);
            });

        }, commitCheckInterval);
    };

    Support.stopHeartbeatCheck = function() {
        clearInterval(commitCheckTimer);
    };

    Support.checkConnection = function() {
        // if we get this status, there may not be a connection to the backend
        // if xcalargetversion doesn't work then it's very probably that
        // there is no connection so alert.
        var connectionCheck = true;
        var deferred = jQuery.Deferred();

        XcalarGetVersion(connectionCheck)
        .then(deferred.resolve)
        .fail(function(error) {
            checkConnection();
            deferred.reject(error);
        });

        return deferred.promise();
    };

    Support.checkStats = function(stats) {
        var data = {};
        var deferred = jQuery.Deferred();
        getStatsMap()
        .then(function() {
            var statsMapArray = [];
            if (!stats) {
                for (var statKey in statsMap) {
                    statsMapArray.push(statsMap[statKey]);
                }

            } else if (!statsMap.hasOwnProperty(stats)) {
                console.error(stats, "doesn't exist");
                console.info("check:", statsMap);
                deferred.reject();
                return;
            } else {
                statsMapArray.push(statsMap[stats]);
            }

            var promises = [];

            for (var node = 0; node < numNodes; node++) {
                for (var sid = 0; sid < statsMapArray.length; sid++) {
                    var statsId = statsMapArray[sid];
                    promises.push(getStat.bind(null, node, statsId, data));
                }
            }

            return PromiseHelper.chain(promises);
        })
        .then(function() {
            statsCache = data;
            console.log(statsMap);
            var file = "";
            for (var groupId in data) {
                var oneRow = {};
                // var notFound = false;
                for (var j = 0; j < data[groupId]["node0"]["stats"].length; j++) {
                    oneRow.groupName = groupId;
                    for (var gName in statsMap) {
                        if (statsMap[gName] === groupId) {
                            oneRow.groupName = gName;
                            break;
                        }
                    }

                    oneRow.name = data[groupId]["node0"]["stats"][j]["statName"];
                    for (var i = 0; i<numNodes; i++) {
                        stat = data[groupId]["node"+i]["stats"][j];
                        oneRow["node"+i] = stat["statValue"];
                    }
                    var outRow = ("                                         " +
                                  oneRow.groupName).slice(-40);
                    outRow += ("                                         " +
                               oneRow.name).slice(-40);
                    for (var i = 0; i < numNodes; i++) {
                        outRow += ("                                         " +
                                   oneRow["node"+i]).slice(-20);
                    }
                    outRow += "\n";
                    file += outRow;
                }
            }

            var header = ("                                    GroupName")
                          .slice(-40);
            header += ("                                         StatName")
                       .slice(-40);
            for (var i = 0; i < numNodes; i++) {
                header += ("                                         Node"+i)
                           .slice(-20);
            }
            header += "\n";
            statsCache = header + file;
            console.info(data);
            deferred.resolve(header + file);
        });
        return deferred.promise();
    };

    Support.downloadLog = function(targetUsername, targetWorkbookName) {
        var log;
        var errLog;
        XcalarKeyLookup(targetUsername+"-wkbk-"+targetWorkbookName+"-gLog", 1)
        .then(function(l) {
            log = l;
            return (XcalarKeyLookup(targetUsername + "-wkbk-" +
                                   targetWorkbookName + "-gErr", 1));
        })
        .then(function(e) {
            errLog = e;
            var overall = {};
            overall.log = log;
            overall.err = errLog;
            xcHelper.downloadAsFile(targetUsername + "-" + targetWorkbookName +
                                    ".txt", JSON.stringify(overall));
        });
    };

    Support.downloadStats = function(stats) {
        Support.checkStats(stats)
        .then(function(f) {
            xcHelper.downloadAsFile(userIdName + "-stats-" +
                                    xcHelper.getCurrentTimeStamp() + ".txt", f);
            console.log(f);
        });
    };

    Support.downloadLRQ = function(lrqName) {
        XcalarExportRetina(lrqName)
        .then(function(a) {
            xcHelper.downloadAsFile(lrqName + ".tar.gz", a.retina, true);
        })
        .fail(function(error) {
            Alert.error(DFTStr.DownloadErr, error);
        });
    };

    //Support.uploadLRQ = function(lrqName, overwriteUDF, )

    function sessionHoldCheck() {
        var deferred = jQuery.Deferred();

        holdCheckHelper()
        .then(function() {
            commitFlag = randCommitFlag();
            // hold the session
            return XcalarKeyPut(KVStore.commitKey, commitFlag, false, gKVScope.FLAG);
        })
        .then(function() {
            // mark as hold in browser tab
            xcSessionStorage.setItem(username, "hold");
            deferred.resolve();
        })
        .fail(deferred.reject);

        return (deferred.promise());

        function holdCheckHelper() {
            var innerDeferred = jQuery.Deferred();

            XcalarKeyLookup(KVStore.commitKey, gKVScope.FLAG)
            .then(function(val) {
                if (val == null || val.value === defaultCommitFlag) {
                    innerDeferred.resolve();
                } else if (xcSessionStorage.getItem(username) === "hold") {
                    // when this browser tab hold the seesion and not release
                    console.warn("Session not release last time...");
                    innerDeferred.resolve();
                } else {
                    innerDeferred.reject(WKBKTStr.Hold);
                }
            })
            .fail(innerDeferred.reject);

            return (innerDeferred.promise());
        }
    }

    function checkConnection() {
        clearTimeout(connectionCheckTimer);

        connectionCheckTimer = setTimeout(function() {
            // if fail, continue to another check
            Support.checkConnection()
            .then(function() {
                clearTimeout(connectionCheckTimer);
                // reload browser if connection back
                location.reload();
            });
        }, connectionCheckInterval);
    }

    function autoSave() {
        if (SQL.hasUnCommitChange() ||
            KVStore.hasUnCommitChange()) {
            return KVStore.commit();
        } else {
            return PromiseHelper.resolve();
        }
    }

    function commitMismatchHandler() {
        Support.stopHeartbeatCheck();

        // hide all modal
        $(".modalContainer:not(.locked)").hide();
        // this browser tab does not hold any more
        xcSessionStorage.removeItem(username);
        // user should force to logout
        xcSessionStorage.removeItem("xcalar-username");
        xcSessionStorage.removeItem("xcalar-fullUsername");

        Alert.show({
            "title"     : WKBKTStr.Expire,
            "msg"       : WKBKTStr.ExpireMsg,
            "lockScreen": true,
            "logout"    : true
        });
    }

    function randCommitFlag() {
        return "commit" + Math.floor((Math.random() * 10000) + 1);
    }

    function getStatsMap() {
        if (statsMap != null) {
            return PromiseHelper.resolve();
        }
        var deferred = jQuery.Deferred();

        XcalarGetStatGroupIdMap(0, 100)
        .then(function(res) {
            statsMap = {};
            var groups = res.groupName;
            var numGroupNames = res.numGroupNames;
            for (var i = 0; i < numGroupNames; i++) {
                statsMap[groups[i]] = i;
            }

            return XcalarApiTop();
        })
        .then(function(res) {
            numNodes = res.numNodes;
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    }

    function getStat(nodeId, statsId, data) {
        var deferred = jQuery.Deferred();

        XcalarGetStatsByGroupId([nodeId], [statsId])
        .then(function(res) {
            if (!data[statsId]) {
                data[statsId] = {};
            }
            data[statsId]["node" + nodeId] = res;
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    }

    function getUserIdUnique(name) {
        var hash = jQuery.md5(name);
        var len = 5;
        var id = parseInt("0x" + hash.substring(0, len)) + 4000000;
        return id;
    }

    return (Support);
}({}, jQuery));
