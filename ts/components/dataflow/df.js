window.DF = (function($, DF) {
    var dataflows = {};
    var parameters = {};
    var initialized = false;
    var lastCreatedDF;
    var parameterizableTypes = ["XcalarApiBulkLoad", "XcalarApiSyntesize",
                                "XcalarApiFilter", "XcalarApiExport"];

    DF.initialize = function() {
        var deferred = PromiseHelper.deferred();
        var retMeta;
        var numRetinas;

        DF.getEmataInfo()
        .then(function(eMeta) {
            var ephMetaInfos;
            try {
                ephMetaInfos = new EMetaConstructor(eMeta);
            } catch (error) {
                return PromiseHelper.reject();
            }
            if (ephMetaInfos) {
                retMeta = ephMetaInfos.getDFMeta();
                return XcalarListRetinas();
            }
        })
        .then(function(list) {
            numRetinas = list.numRetinas;
            for (var i = 0; i < list.numRetinas; i++) {
                var retName = list.retinaDescs[i].retinaName;
                if (retName.indexOf("#") > -1) {
                    // These are retinas that are generated by retina replay
                    // Do not show them
                    // We do not allow uploading or creation of retinas with #
                    numRetinas--;
                    continue;
                }
                if (retName in retMeta.dataflows) {
                    dataflows[retName] = retMeta.dataflows[retName];
                } else {
                    console.warn("No meta for dataflow", retName);
                    dataflows[retName] = new Dataflow(retName);
                }
            }
            return XcalarListSchedules();
        })
        .then(function(list) {
            for (var i = 0; i < list.length; i++) {
                var retName = list[i].scheduleMain.retName;
                if (dataflows[retName] == null) {
                    console.error("error case");
                    continue;
                }

                var allOptions = $.extend({}, list[i].scheduleMain.options,
                             list[i].scheduleMain.substitutions,
                             list[i].scheduleMain.timingInfo);
                dataflows[retName].schedule = new SchedObj(allOptions);
            }

            if (numRetinas > 0) {
                DFCard.refreshDFList(true, true);
                var $listItem;
                if (lastCreatedDF) {
                    $listItem = DFCard.getDFListItem(lastCreatedDF);
                    lastCreatedDF = null;
                }
                if (!$listItem || !$listItem.length) {
                    $listItem = $("#dfMenu").find(".dataFlowGroup").eq(0);
                }
                $listItem.click();
            } else {
                DFCard.refreshDFList(true);
            }
            initParamMap(retMeta.params);
            deferred.resolve();
        })
        .fail(deferred.reject)
        .always(function() {
            initialized = true;
        });

        return deferred.promise();
    };

    DF.wasRestored = function() {
        return initialized;
    };

    DF.getEmataInfo = function() {
        var key = KVStore.getKey("gEphStorageKey");
        var kvStore = new KVStore(key, gKVScope.GLOB);
        return kvStore.getInfo(true);
    };

    // if df.restore hasn't been called, we will track the most recently
    // created df so we can focus on it later
    DF.setLastCreatedDF = function(dfName) {
        lastCreatedDF = dfName;
    };

    // calls XcalarGetRetina and XcalarGetRetinaJson
    function getRetinaAndJson(retName) {
        var deferred = jQuery.Deferred();
        PromiseHelper.when(XcalarGetRetina(retName), XcalarGetRetinaJson(retName))
        .then(function(retStruct, retJson) {
            var retinaInfo = {
                name: retName,
                retStruct: retStruct.retina.retinaDag,
                retJson: retJson
            };
            deferred.resolve(retinaInfo);
        })
        .fail(deferred.reject);

        return deferred.promise();
    }

    DF.refresh = function(retMeta) {
        // This call now has to return a promise
        var deferred = PromiseHelper.deferred();

        XcalarListRetinas()
        .then(function(list) {
            var promises = [];
            for (var i = 0; i < list.numRetinas; i++) {
                var retName = list.retinaDescs[i].retinaName;
                if (retName.indexOf("#") > -1) {
                    // These are retinas that are generated by retina replay
                    // Do not show them
                    // We do not allow uploading or creation of retinas with #
                    continue;
                }
                promises.push(getRetinaAndJson(retName));
            }

            return PromiseHelper.alwaysResolve(PromiseHelper.when.apply({}, promises));
        })
        .then(function() {
            var retStructs = arguments;
            dataflows = {}; // Reset dataflow cache
            for (var i = 0; i < retStructs.length; i++) {
                if (retStructs[i] == null || !retStructs[i].name) {
                    continue;
                }

                // Populate node information
                var retName = retStructs[i].name;
                if (retName in retMeta.dataflows) {
                    dataflows[retName] = retMeta.dataflows[retName];
                } else {
                    console.warn("No meta for dataflow", retName);
                    dataflows[retName] = new Dataflow(retName);
                }

                updateDFInfo(retStructs[i]);
            }
            return XcalarListSchedules();
        })
        .then(function(list) {
            for (var i = 0; i < list.length; i++) {
                var retName = list[i].scheduleMain.retName;
                if (dataflows[retName] == null) {
                    console.error("error case");
                    continue;
                }

                var allOptions = $.extend({}, list[i].scheduleMain.options,
                             list[i].scheduleMain.substitutions,
                             list[i].scheduleMain.timingInfo);
                dataflows[retName].schedule = new SchedObj(allOptions);
            }
            DFCard.refreshDFList(true);
            initParamMap(retMeta.params, true);
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    DF.commitAndBroadCast = function(modifiedDataflow) {
        KVStore.commit()
        .always(function() {
            var xcSocket = XcSocket.Instance;
            xcSocket.sendMessage("refreshDataflow", modifiedDataflow);
        });
    };

    DF.getAllDataflows = function() {
        return (dataflows);
    };

    DF.getNumDataflows = function() {
        return (Object.keys(dataflows).length);
    };

    DF.getAllCommitKeys = function() {
        // Only commit stuff that we cannot recreate
        var deepCopy = xcHelper.deepCopy(dataflows);
        for (var df in deepCopy) {
            delete deepCopy[df].nodeIds;
            delete deepCopy[df].retinaNodes;
            delete deepCopy[df].nodes;
            delete deepCopy[df].columns;
            delete deepCopy[df].schedule;
        }
        return deepCopy;
    };

    DF.getDataflow = function(dataflowName) {
        return (dataflows[dataflowName]);
    };

    DF.addDataflow = function(dataflowName, dataflow, exportTables, srcTables,
                              options) {
        options = options || {};
        var deferred = PromiseHelper.deferred();

        var promise;
        if (options.isUpload) {
            promise = PromiseHelper.resolve();
        } else {
            promise = createRetina(dataflowName, exportTables, srcTables);
        }

        promise
        .then(function() {
            return getRetinaAndJson(dataflowName);
        })
        .then(function(retInfo) {
            dataflows[dataflowName] = dataflow;
            updateDFInfo(retInfo);
            // XXX TODO add sql
            DFCard.addDFToList(dataflowName);

            if (DF.checkForAddedParams(dataflow)) {
                DF.commitAndBroadCast(dataflowName);
            } else {
                // no need to commit to kvstore since there's no info stored
                // in this new dataflow
                var xcSocket = XcSocket.Instance;
                xcSocket.sendMessage("refreshDataflow", dataflowName);
            }


            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    DF.removeDataflow = function(dataflowName) {
        var deferred = PromiseHelper.deferred();
        var hasRemoveSched = false;

        DF.removeScheduleFromDataflow(dataflowName)
        .then(function() {
            hasRemoveSched = true;
            return XcalarDeleteRetina(dataflowName);
        })
        .then(function () {
            // may fail if hasn't been run, so just always resolve
            PromiseHelper.alwaysResolve(XcalarQueryDelete(dataflowName));
        })
        .then(function() {
            resolveDelete();
            deferred.resolve();
        })
        .fail(function(error) {
            if (typeof error === "object" &&
                error.status === StatusT.StatusRetinaNotFound)
            {
                resolveDelete();
                deferred.resolve();
            } else {
                if (hasRemoveSched) {
                    DF.commitAndBroadCast(dataflowName);
                }
                deferred.reject(error);
            }
        });

        return deferred.promise();

        function resolveDelete() {
            delete dataflows[dataflowName];
            DF.commitAndBroadCast(dataflowName);
        }
    };

    // For addining. modifying and removing the schedule
    DF.getSchedule = function(dataflowName) {
        var dataflow = dataflows[dataflowName];
        if (dataflow) {
            return dataflow.schedule;
        }
    };

    DF.addScheduleToDataflow = function(dataflowName, allOptions) {
        var deferred = PromiseHelper.deferred();
        var dataflow = dataflows[dataflowName];
        var schedule;
        var substitutions;
        var options;
        var timingInfo;
        if (dataflow) {
            if (!dataflow.schedule) {
                schedule = new SchedObj(allOptions);
                substitutions = getSubstitutions(dataflowName,
                                    allOptions.activeSession);
                options = getOptions(allOptions);
                timingInfo = getTimingInfo(allOptions);
                XcalarCreateSched(dataflowName, dataflowName,
                    substitutions, options, timingInfo)
                .then(function() {
                    dataflow.schedule = schedule;
                    DF.commitAndBroadCast(dataflowName);
                    deferred.resolve();
                })
                .fail(deferred.reject);
            } else {
                schedule = dataflow.schedule;
                XcalarDeleteSched(dataflowName)
                .then(function() {
                    substitutions = getSubstitutions(dataflowName,
                                        allOptions.activeSession);
                    options = getOptions(allOptions);
                    timingInfo = getTimingInfo(allOptions);
                    return XcalarCreateSched(dataflowName, dataflowName,
                        substitutions, options, timingInfo);
                })
                .then(function() {
                    schedule.update(allOptions);
                    DF.commitAndBroadCast(dataflowName);
                    deferred.resolve();
                })
                .fail(deferred.reject);
            }
        } else {
            console.warn("No such dataflow exist!");
            deferred.resolve();
        }
        return deferred.promise();
    };

    DF.updateScheduleForDataflow = function(dataflowName) {
        var deferred = PromiseHelper.deferred();
        var dataflow = dataflows[dataflowName];

        if (!dataflow) {
            return;
        }
        var option = DF.getAdvancedExportOption(dataflowName, true);
        var exportOptions = DF.getExportTarget(option.activeSession, dataflowName);
        dataflow.schedule.exportTarget = exportOptions.exportTarget;
        dataflow.schedule.exportLocation = exportOptions.exportLocation;

        var options = getOptions(dataflow.schedule);
        var timingInfo = getTimingInfo(dataflow.schedule);
        var substitutions = getSubstitutions(dataflowName, option.activeSession);

        XcalarUpdateSched(dataflowName, dataflowName,
            substitutions, options, timingInfo)
        .then(deferred.resolve)
        .fail(deferred.reject);
        return deferred.promise();
    };

    DF.removeScheduleFromDataflow = function(dataflowName) {
        var dataflow = dataflows[dataflowName];
        if (!dataflow) {
            var error = xcHelper.replaceMsg(DFTStr.NoTExists, {
                "df": dataflowName
            });
            return PromiseHelper.reject(error);
        }

        var deferred = PromiseHelper.deferred();
        XcalarDeleteSched(dataflowName)
        .then(function() {
            dataflow.schedule = null;
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    DF.hasSchedule = function(dataflowName) {
        var dataflow = dataflows[dataflowName];
        if (dataflow) {
            return dataflow.hasSchedule();
        } else {
            console.warn("No such dataflow exist!");
            return false;
        }
    };

    DF.hasDataflow = function(dataflowName) {
        return dataflows.hasOwnProperty(dataflowName);
    };

    // when focusing on a df and nodes haven't been fetched yet
    DF.updateDF = function(dfName) {
        var deferred = PromiseHelper.deferred();
        var df = dataflows[dfName];
        var nodesCache;

        getRetinaAndJson(dfName)
        .then(function(retStruct) {
            if (!dataflows[dfName]) {
                deferred.reject(); // could have been deleted
                return;
            }
            updateDFInfo(retStruct);
            nodesCache = df.nodes;

            if (!dataflows[dfName].nodes || !dataflows[dfName].nodes.length) {
                // node info can get deleted during the asyn call
                dataflows[dfName].nodes = nodesCache;
            }

            if (DF.checkForAddedParams(dataflows[dfName])) {
                DF.commitAndBroadCast();
            }
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    function initParamMap(params, checkDataflows) {
        if ($.isEmptyObject(params)) {
            for (var i in dataflows) {
                var df = dataflows[i];
                for (var j in df.paramMap) {
                    if (!parameters.hasOwnProperty(j)) {
                        parameters[j] = {
                            value: df.paramMap[j],
                            isEmpty: !df.paramMap[j] || (df.paramMap[j].length === 0)
                        };
                    } else {
                        console.error("duplicate param", j, df.paramMap[j]);
                    }
                }
            }
        } else {
            parameters = params;
        }

        // check each dataflow for params that are not in the kvstore
        if (checkDataflows) {
            for (var i in dataflows) {
                var df = dataflows[i];
                DF.checkForAddedParams(df);
            }
        }
        $("#dfViz").find(".retTabSection").removeClass("hidden");
    }

    DF.getParamMap = function() {
        return parameters;
    };

    DF.updateParamMap = function(params) {
        parameters = params;
        DF.commitAndBroadCast();
    };

    DF.getParameters = function(df) {
        var retNodes = df.retinaNodes;
        var params = [];
        for (var tName in retNodes) {
            var node = retNodes[tName];
            if (parameterizableTypes.indexOf(node.operation) !== -1) {
                params = params.concat(getParametersHelper(node.args));
            }
        }
        return params;
    };

    DF.checkForAddedParams = function(df) {
        var hasNewParam = false;
        var paramsInDataflow = DF.getParameters(df);
        for (var j = 0; j < paramsInDataflow.length; j++) {
            if (!parameters[paramsInDataflow[j]]) {
                hasNewParam = true;
                parameters[paramsInDataflow[j]] = {
                    value: "",
                    isEmpty: true
                };
            }
        }
        return hasNewParam;
    }

    DF.comment = function(dfName, tableName, newComment, meta) {
        var deferred = PromiseHelper.deferred();

        var commentObj = {
            userComment: newComment || "",
            meta: meta || {}
        };
        XcalarUpdateRetina(dfName, tableName, null, JSON.stringify(commentObj))
        .then(function() {
            DF.commitAndBroadCast(dfName);
            deferred.resolve();
        })
        .fail(deferred.reject);
        return deferred.promise();
    };

    function getParametersHelper(value) {
        var paramMap = {};
        getParamHelper(value);

        var params = [];
        for (var i in paramMap) {
            params.push(i);
        }
        return params;

        function getParamHelper(value) {
            if (!value) {
                return false;
            }
            if (typeof value !== "object") {
                if (typeof value === "string") {
                    var openIndex = value.indexOf("<");
                    if (openIndex > -1 && value.lastIndexOf(">") > openIndex) {
                        var params = getParamsInVal(value);
                        for (var i = 0; i < params.length; i++) {
                            paramMap[params[i]] = true;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                if ($.isEmptyObject(value)) {
                    return false;
                }
                if (value.constructor === Array) {
                    for (var i = 0; i < value.length; i++) {
                        getParamHelper(value[i]);
                    }
                } else {
                    for (var i in value) {
                        if (!value.hasOwnProperty(i)) {
                            continue;
                        }
                        getParamHelper(value[i]);
                    }
                }
                return false;
            }
        }

        function getParamsInVal(val) {
            var len = val.length;
            var param = "";
            var params = [];
            var braceOpen = false;
            for (var i = 0; i < len; i++) {
                if (braceOpen) {
                    if (val[i] === ">") {
                        params.push(param);
                        param = "";
                        braceOpen = false;
                    } else {
                        param += val[i];
                    }
                }
                if (val[i] === "<") {
                    braceOpen = true;
                }
            }
            return (params);
        }
    }

    function createRetina(retName, exportTables, srcTables) {
        var tableArray = []; // array of XcalarApiRetinaDstT
        var srcTableArray = [];

        for (var i = 0; i < exportTables.length; i++) {
            var retinaDstTable = new XcalarApiRetinaDstT();
            retinaDstTable.target = new XcalarApiNamedInputT();
            retinaDstTable.target.isTable = true;
            retinaDstTable.target.name = exportTables[i].tableName;
            var columns = [];

            for (var j = 0; j < exportTables[i].columns.length; j++) {
                var col = new ExColumnNameT();
                col.name = exportTables[i].columns[j].backCol; // Back col name
                col.headerAlias = exportTables[i].columns[j].frontCol;
                columns.push(col);
            }

            retinaDstTable.columns = columns;
            retinaDstTable.numColumns = columns.length;

            tableArray.push(retinaDstTable);
        }

        for (var i = 0; i < srcTables.length; i++) {
            var retinaSrcTable = new XcalarApiRetinaSrcTableT(
                                                       {source: srcTables[i],
                                                        dstName: srcTables[i]});
            retinaSrcTable.source.name = srcTables[i];
            srcTableArray.push(retinaSrcTable);
        }

        return XcalarMakeRetina(retName, tableArray, srcTableArray);
    }

    // called after retina is created to update the ids of dag nodes
    function updateDFInfo(retInfo) {
        var retName = retInfo.name;
        var dataflow = DF.getDataflow(retName);
        dataflow.nodes = retInfo.retStruct.node; // used to construct graph then deleted
        dataflow.retinaNodes = {};

        var nodeArgs = retInfo.retJson.query;
        for (var i = 0; i < nodeArgs.length; i++) {
            var tableName = nodeArgs[i].args.dest;
            dataflow.retinaNodes[tableName] = nodeArgs[i];
        }

        for (var i in dataflow.parameterizedNodes) {
            // check if using nodeid instead of tablename,
            // if so, then replace with tname
            if (parseInt(i) > 0) {
                for (var j = 0; j < dataflow.nodes.length; j++) {
                    if (dataflow.nodes[j].dagNodeId === i) {
                        var tName = dataflow.nodes[j].name.name;
                        var params = dataflow.parameterizedNodes[i];
                        dataflow.parameterizedNodes[tName] = params;
                        delete dataflow.parameterizedNodes[i];
                    }
                }
            }
        }
    }

    function getSubstitutions(dataflowName, forceAddN) {
        var paramsArray = [];
        var dfObj = DF.getDataflow(dataflowName);
        var paramMap = dfObj.paramMap;
        var paramMapInUsed = dfObj.paramMapInUsed;

        for (var name in paramMap) {
            var p = new XcalarApiParameterT();
            if (paramMapInUsed[name]) {
                p.paramName = name;
                p.paramValue = paramMap[name];
                paramsArray.push(p);
            }
        }
        if (forceAddN && !paramMap.hasOwnProperty("N")) {
            p = new XcalarApiParameterT();
            p.paramName = "N";
            p.paramValue = 0;
            paramsArray.push(p);
        }
        return paramsArray;
    }

    function getOptions(allOptions) {
        var options = {
            "activeSession": allOptions.activeSession,
            "newTableName": allOptions.newTableName,
            "usePremadeCronString": allOptions.usePremadeCronString,
            "premadeCronString": allOptions.premadeCronString,
            "isPaused": allOptions.isPaused,
            "exportTarget": allOptions.exportTarget,
            "exportLocation": allOptions.exportLocation
        };
        return options;
    }
    function getTimingInfo(allOptions) {
        var timingInfo = {
            "startTime": allOptions.startTime,
            "dateText": allOptions.dateText,
            "timeText": allOptions.timeText,
            "repeat": allOptions.repeat,
            "modified": allOptions.modified,
            "created": allOptions.created
        };
        return timingInfo;
    }

    DF.getExportTarget = function(activeSession, dataflowName) {
        var options = {};
        options.exportTarget = null;
        options.exportLocation = null;
        if (activeSession) {
            options.exportLocation = "N/A";
            options.exportTarget = "XcalarForTable";
            return options;
        } else {
            var exportTarget = "Default";
            var df = DF.getDataflow(dataflowName);
            if (df) {
                var retinaNodes = df.retinaNodes;
                try {
                    var exportNode;
                    for (var name in retinaNodes) {
                        if (retinaNodes[name].operation === "XcalarApiExport") {
                            exportNode = retinaNodes[name];
                            break;
                        }
                    }
                    exportTarget = exportNode.args.targetName;
                    var exportTargetObj = DSExport.getTarget(exportTarget);
                    options.exportTarget = exportTargetObj.info.name;
                    options.exportLocation = exportTargetObj.info.formatArg;
                } catch (error) {
                    console.error(error);
                }
            }
            return options;
        }
    };

    DF.saveAdvancedExportOption = function(dataflowName, activeSessionOptions) {
        var df = DF.getDataflow(dataflowName);
        if (df) {
            df.activeSession = activeSessionOptions.activeSession;
            df.newTableName = activeSessionOptions.newTableName;
        }
    };

    DF.getAdvancedExportOption = function(dataflowName, withoutHashId) {
        var df = DF.getDataflow(dataflowName);
        var res = {
            "activeSession": false,
            "newTableName": ""
        };
        if (df) {
            if (df.activeSession) {
                var newTableName = df.newTableName;
                if (!withoutHashId) {
                    newTableName += Authentication.getHashId();
                }
                res.activeSession = df.activeSession;
                res.newTableName = newTableName;
            }
            return res;
        } else {
            return null;
        }
    };

    DF.deleteActiveSessionOption = function(dataflowName) {
        var df = DF.getDataflow(dataflowName);

        if (df) {
            delete df.activeSession;
            delete df.newTableName;
        }
    };

    /* Unit Test Only */
    if (window.unitTestMode) {
        DF.__testOnly__ = {};
        DFParamModal.__testOnly__.getSubstitutions = getSubstitutions;
        DFParamModal.__testOnly__.updateDataflows = function(newDf) {
            var oldDataflows = [];
            for (var i in dataflows) {
                oldDataflows[i] = dataflows[i];
                delete dataflows[i];
            }
            for (var i in newDf) {
                dataflows[i] = newDf[i];
            }

            return oldDataflows;
        };
    }
    /* End Of Unit Test Only */


    return (DF);

}(jQuery, {}));
