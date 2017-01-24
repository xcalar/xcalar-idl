window.DF = (function($, DF) {
    var dataflows = {};
    var retStructs = []; // temp usage only
    var dfCache; // temp usage only

    DF.restore = function(retMeta) {
        // This call now has to return a promise
        var deferred = jQuery.Deferred();
        var retArray = [];

        dfCache = retMeta;

        XcalarListRetinas()
        .then(function(list) {
            for (var i = 0; i < list.numRetinas; i++) {
                var retName = list.retinaDescs[i].retinaName;
                if (retName.indexOf("#") > -1) {
                    // These are retinas that are generated by retina replay
                    // Do not show them
                    // We do not allow uploading or creation of retinas with #
                    continue;
                }
                retArray.push(XcalarGetRetina(retName));
            }
            return PromiseHelper.when.apply({}, retArray);
        })
        .then(function() {
            dataflows = {}; // Reset dataflow cache
            retStructs = arguments;
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    DF.initialize = function() {
        for (var i = 0; i < retStructs.length; i++) {
            if (retStructs[i] == null) {
                continue;
            }
            // Populate node information
            var retName = retStructs[i].retina.retinaDesc.retinaName;
            if (retName in dfCache) {
                dataflows[retName] = dfCache[retName];
            } else {
                console.warn("No meta for dataflow", retName);
                dataflows[retName] = new Dataflow(retName);
            }

            updateDFInfo(retStructs[i]);

            // Populate export column information
            addColumns(retName);
        }

        dfCache = undefined;
        retStructs = undefined;

        DFCard.clearDFImages();
        DFCard.refreshDFList();
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
            delete deepCopy[df].columns;
        }
        return deepCopy;
    };

    DF.getDataflow = function(dataflowName) {
        return (dataflows[dataflowName]);
    };

    DF.addDataflow = function(dataflowName, dataflow, expTableName, options) {
        var isUpload = false;
        // var noClick = false;
        if (options) {
            isUpload = options.isUpload;
            // noClick = options.noClick;
        }
        var deferred = jQuery.Deferred();
        dataflows[dataflowName] = dataflow;

        var innerDef;
        if (isUpload) {
            innerDef = PromiseHelper.resolve();
        } else {
            innerDef = createRetina(dataflowName, expTableName);
        }

        innerDef
        .then(function() {
            return (XcalarGetRetina(dataflowName));
        })
        .then(function(retInfo) {
            updateDFInfo(retInfo);
            if (isUpload) {
                addColumns(dataflowName, retInfo);
            }
            // XXX TODO add sql
            DFCard.addDFToList(dataflowName);
            KVStore.commit();
            deferred.resolve();
        })
        .fail(function(error) {
            delete dataflows[dataflowName];
            deferred.reject(error);
        });

        return (deferred.promise());
    };

    DF.removeDataflow = function(dataflowName) {
        var deferred = jQuery.Deferred();
        XcalarDeleteRetina(dataflowName)
        .then(function() {
            delete dataflows[dataflowName];
            DFCard.deleteDF(dataflowName);
            return saveHelper();
        })
        .then(deferred.resolve)
        .fail(deferred.reject);

        return deferred.promise();

        function saveHelper() {
            var innerDeferred = jQuery.Deferred();
            KVStore.commit()
            .always(innerDeferred.resolve);

            return innerDeferred.promise();
        }
    };

    // For addining. modifying and removing the schedule
    DF.getSchedule = function(dataflowName) {
        var dataflow = dataflows[dataflowName];
        if (dataflow) {
            return dataflow.schedule;
        }
    };

    DF.addScheduleToDataflow = function(dataflowName, options) {
        var dataflow = dataflows[dataflowName];
        if (dataflow) {
            if (!dataflow.schedule) {
                dataflow.schedule = new SchedObj(options);
            } else {
                var schedule = dataflow.schedule;
                schedule.update(options);
            }
        } else {
            console.warn("No such dataflow exist!");
        }
        KVStore.commit();
    };

    DF.removeScheduleFromDataflow = function(dataflowName) {
        var dataflow = dataflows[dataflowName];
        if (dataflow) {
            dataflow.schedule = null;
        } else {
            console.warn("No such dataflow exist!");
        }
        KVStore.commit();
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

    function createRetina(retName, tableName) {
        var df = dataflows[retName];
        var columns = [];

        var tableArray = [];

        df.columns.forEach(function(colInfo) {
            var col = new ExColumnNameT();
            col.name = colInfo.backCol; // Back col name
            col.headerAlias = colInfo.frontCol; // Front col name
            columns.push(col);
        });

        var retinaDstTable = new XcalarApiRetinaDstT();
        retinaDstTable.numColumns = columns.length;
        retinaDstTable.target = new XcalarApiNamedInputT();
        retinaDstTable.target.isTable = true;
        retinaDstTable.target.name = tableName;
        retinaDstTable.columns = columns;
        tableArray.push(retinaDstTable);
        return XcalarMakeRetina(retName, tableArray);
    }

    // called after retina is created to update the ids of dag nodes
    function updateDFInfo(retInfo) {
        var retina = retInfo.retina;
        var retName = retina.retinaDesc.retinaName;
        var dataflow = dataflows[retName];
        var nodes = retina.retinaDag.node;

        dataflow.retinaNodes = nodes;

        for (var i = 0; i < retina.retinaDag.numNodes; i++) {
            var tableName = nodes[i].name.name;
            dataflow.nodeIds[tableName] = nodes[i].dagNodeId;
        }
    }

    function addColumns(dataflowName) {
        var dFlow = DF.getDataflow(dataflowName);
        for (i = 0; i < dFlow.retinaNodes.length; i++) {
            if (dFlow.retinaNodes[i].api === XcalarApisT.XcalarApiExport) {
                var exportCols = dFlow.retinaNodes[i].input.exportInput
                                                           .meta.columns;
                for (var j = 0; j < exportCols.length; j++) {
                    var newCol = {};
                    newCol.frontCol = exportCols[j].headerAlias;
                    newCol.backCol = exportCols[j].name;
                    dFlow.columns.push(newCol);
                }
                break;
            }
        }
    }

    return (DF);

}(jQuery, {}));
