window.xcFunction = (function($, xcFunction) {
    var joinLookUp = {
        "Inner Join"      : JoinOperatorT.InnerJoin,
        "Left Outer Join" : JoinOperatorT.LeftOuterJoin,
        "Right Outer Join": JoinOperatorT.RightOuterJoin,
        "Full Outer Join" : JoinOperatorT.FullOuterJoin
    };

    // filter table column
    xcFunction.filter = function(colNum, tableId, fltOptions) {
        var deferred = jQuery.Deferred();

        var table = gTables[tableId];
        var tableName = table.getName();
        var frontColName = table.getCol(colNum).getFronColName();
        var fltStr = fltOptions.filterString;
        var worksheet = WSManager.getWSFromTable(tableId);

        var sql = {
            "operation" : SQLOps.Filter,
            "tableName" : tableName,
            "tableId"   : tableId,
            "colName"   : frontColName,
            "colNum"    : colNum,
            "fltOptions": fltOptions
        };
        var txId = Transaction.start({
            "msg"      : StatusMessageTStr.Filter + ': ' + frontColName,
            "operation": SQLOps.Filter,
            "sql"      : sql
        });

        var finalTableName;

        xcHelper.lockTable(tableId);

        XIApi.filter(txId, fltStr, tableName)
        .then(function(tableAfterFilter) {
            finalTableName = tableAfterFilter;
            var options = {"selectCol": colNum};
            return TblManager.refreshTable([finalTableName], table.tableCols,
                                            [tableName], worksheet, options);
        })
        .then(function() {
            xcHelper.unlockTable(tableId);

            sql.newTableName = finalTableName;
            Transaction.done(txId, {
                "msgTable": xcHelper.getTableId(finalTableName),
                "sql"     : sql
            });
            deferred.resolve();
        })
        .fail(function(error) {
            xcHelper.unlockTable(tableId);

            Transaction.fail(txId, {
                "failMsg": StatusMessageTStr.FilterFailed,
                "error"  : error
            });

            deferred.reject(error);
        });

        return deferred.promise();
    };

    // aggregate table column
    xcFunction.aggregate = function(colNum, tableId, aggrOp, aggStr) {
        var deferred = jQuery.Deferred();

        var table = gTables[tableId];
        var tableName = table.getName();
        var progCol = table.getCol(colNum);
        var frontColName = progCol.getFronColName();
        var backColName = progCol.getBackColName();

        xcHelper.lockTable(tableId);

        var title = xcHelper.replaceMsg(AggTStr.AggTitle, {"op": aggrOp});
        var instr = xcHelper.replaceMsg(AggTStr.AggInstr, {
            "col": frontColName,
            "op" : aggrOp
        });

        var aggInfo = WSManager.checkAggInfo(tableId, backColName, aggrOp);
        if (aggInfo != null) {
            xcHelper.unlockTable(tableId);
            setTimeout(function() {
                var alertMsg = xcHelper.replaceMsg(AggTStr.AggMsg, {
                    "val": aggInfo.value
                });
                Alert.show({
                    "title"  : title,
                    "instr"  : instr,
                    "msg"    : alertMsg,
                    "isAlert": true
                });

                deferred.resolve();
            }, 500);

            return deferred.promise();
        }

        var sql = {
            "operation"  : SQLOps.Aggr,
            "tableName"  : tableName,
            "tableId"    : tableId,
            "colName"    : frontColName,
            "colNum"     : colNum,
            "aggrOp"     : aggrOp,
            "aggStr"     : aggStr,
            "htmlExclude": ["aggStr"]
        };
        var msg = StatusMessageTStr.Aggregate + " " + aggrOp + " " +
                  StatusMessageTStr.OnColumn + ": " + frontColName;
        var txId = Transaction.start({
            "msg"      : msg,
            "operation": SQLOps.Aggr,
            "sql"      : sql
        });

        XIApi.aggregate(txId, aggrOp, aggStr, tableName)
        .then(function(value, dstDagName) {
            var aggRes = {
                "value"  : value,
                "dagName": dstDagName
            };

            WSManager.addAggInfo(tableId, backColName, aggrOp, aggRes);
            TableList.refreshAggTables();

            Transaction.done(txId, {"msgTable": tableId});

            // show result in alert modal
            var alertMsg = xcHelper.replaceMsg(AggTStr.AggMsg, {
                "val": value
            });

            Alert.show({
                "title"  : title,
                "instr"  : instr,
                "msg"    : alertMsg,
                "isAlert": true
            });

            deferred.resolve();
        })
        .fail(function(error) {
            Transaction.fail(txId, {
                "failMsg": StatusMessageTStr.AggregateFailed,
                "error"  : error
            });

            deferred.reject(error);
        })
        .always(function() {
            xcHelper.unlockTable(tableId);
        });

        return deferred.promise();
    };

    // sort table column
    xcFunction.sort = function(colNum, tableId, order, typeToCast) {
        var deferred = jQuery.Deferred();

        var table = gTables[tableId];
        var tableName = table.getName();
        var tableCols = table.tableCols;
        var progCol = tableCols[colNum - 1];
        var backColName = progCol.getBackColName();
        var frontColName = progCol.getFronColName();

        var direction = (order === SortDirection.Forward) ? "ASC" : "DESC";
        var xcOrder;

        if (order === SortDirection.Backward) {
            xcOrder = XcalarOrderingT.XcalarOrderingDescending;
        } else {
            xcOrder = XcalarOrderingT.XcalarOrderingAscending;
        }

        var worksheet = WSManager.getWSFromTable(tableId);
        var sql = {
            "operation": SQLOps.Sort,
            "tableName": tableName,
            "tableId"  : tableId,
            "key"      : frontColName,
            "colNum"   : colNum,
            "order"    : order,
            "direction": direction,
            "sorted"   : true
        };
        var txId = Transaction.start({
            "msg"      : StatusMessageTStr.Sort + " " + frontColName,
            "operation": SQLOps.Sort,
            "sql"      : sql
        });

        // user timeout because it may fail soon if table is already sorted
        // lock table will cause blinking
        var timer = setTimeout(function() {
            xcHelper.lockTable(tableId);
        }, 200);

        var finalTableName;
        var finalTableCols;

        typeCastHelper()
        .then(function(tableToSort, colToSort, newTableCols) {
            finalTableCols = newTableCols;
            return XIApi.sort(txId, xcOrder, colToSort, tableToSort);
        })
        .then(function(sortTableName) {
            finalTableName = sortTableName;
            var options = {"selectCol": colNum - 1};
            // sort will filter out KNF, so it change the profile
            return TblManager.refreshTable([finalTableName], finalTableCols,
                                            [tableName], worksheet,
                                            options);
        })
        .then(function() {
            clearTimeout(timer);
            if (table.hasLock()) {
                xcHelper.unlockTable(tableId);
            }

            sql.newTableName = finalTableName;
            Transaction.done(txId, {
                "msgTable": xcHelper.getTableId(finalTableName),
                "sql"     : sql
            });
            deferred.resolve();
        })
        .fail(function(error, sorted) {
            clearTimeout(timer);
            if (table.hasLock()) {
                xcHelper.unlockTable(tableId);
            }

            if (sorted) {
                Transaction.cancel(txId);
                var textOrder;
                if (order === SortDirection.Forward) {
                    textOrder = "ascending";
                } else {
                    textOrder = "descending";
                }

                var mgs = xcHelper.replaceMsg(IndexTStr.SortedErr, {
                    "order": textOrder
                });
                Alert.error(IndexTStr.Sorted, mgs);
            } else if (error.error === SQLType.Cancel) {
                Transaction.cancel(txId);
                deferred.resolve();
            } else {
                Transaction.fail(txId, {
                    "failMsg": StatusMessageTStr.SortFailed,
                    "error"  : error
                });
            }
            deferred.reject(error);
        });

        return deferred.promise();

        function typeCastHelper() {
            if (typeToCast == null) {
                return PromiseHelper.resolve(tableName, backColName, tableCols);
            }

            sql.typeToCast = typeToCast;

            var innerDeferred = jQuery.Deferred();
            var mapString = xcHelper.castStrHelper(backColName, typeToCast);
            var mapColName = backColName + "_" + typeToCast;

            mapColName = xcHelper.getUniqColName(tableId, mapColName);

            XIApi.map(txId, mapString, tableName, mapColName)
            .then(function(mapTableName) {
                var mapOptions = {"replaceColumn": true};
                var mapTablCols = xcHelper.mapColGenerate(colNum, mapColName,
                                        mapString, tableCols, mapOptions);
                innerDeferred.resolve(mapTableName, mapColName, mapTablCols);
            })
            .fail(innerDeferred.reject);

            return innerDeferred.promise();
        }
    };

    // join two tables
    xcFunction.join = function(lColNums, lTableId, rColNums, rTableId,
                                joinStr, newTableName)
    {
        var deferred = jQuery.Deferred();
        var joinType = joinLookUp[joinStr];

        if (joinType == null) {
            deferred.reject("Incorrect join type!");
            return (deferred.promise());
        }

        var lTable     = gTables[lTableId];
        var lTableName = lTable.tableName;
        var rTable     = gTables[rTableId];
        var rTableName = rTable.tableName;
        var newTableId = xcHelper.getTableId(newTableName);
        var lTablePos  = WSManager.getTableRelativePosition(lTableId);
        var rTablePos  = WSManager.getTableRelativePosition(rTableId);

        var lColNames = [];
        var rColNames = [];

        lColNums.forEach(function(colNum) {
            lColNames.push(lTable.tableCols[colNum].getBackColName());
        });

        rColNums.forEach(function(colNum) {
            rColNames.push(rTable.tableCols[colNum].getBackColName());
        });

        // joined table will in the current active worksheet.
        var worksheet = WSManager.getActiveWS();

        var sql = {
            "operation"   : SQLOps.Join,
            "lTableName"  : lTableName,
            "lTableId"    : lTableId,
            "lTablePos"   : lTablePos,
            "lColNums"    : lColNums,
            "rTableName"  : rTableName,
            "rTableId"    : rTableId,
            "rTablePos"   : rTablePos,
            "rColNums"    : rColNums,
            "newTableName": newTableName,
            "joinStr"     : joinStr,
            "worksheet"   : worksheet,
            "htmlExclude" : ["lTablePos", "rTablePos", "worksheet"]
        };

        var txId = Transaction.start({
            "msg"      : StatusMessageTStr.Join,
            "operation": SQLOps.Join,
            "sql"      : sql
        });

        xcHelper.lockTable(lTableId);
        xcHelper.lockTable(rTableId);

        XIApi.join(txId, joinType, lColNames, lTableName, rColNames, rTableName, newTableName)
        .then(function(finalTableName, finalTableCols) {
            return TblManager.refreshTable([finalTableName], finalTableCols,
                                        [lTableName, rTableName], worksheet);
        })
        .then(function() {
            Transaction.done(txId, {"msgTable": newTableId});
            deferred.resolve();
        })
        .fail(function(error) {
            Transaction.fail(txId, {
                "failMsg": StatusMessageTStr.JoinFailed,
                "error"  : error
            });
            deferred.reject(error);
        })
        .always(function() {
            xcHelper.unlockTable(lTableId);
            xcHelper.unlockTable(rTableId);
        });

        return deferred.promise();
    };

    xcFunction.groupBy = function(operator, tableId,
                                   indexedCols, aggColName,
                                   isIncSample, newColName)
    {
        var deferred = jQuery.Deferred();

        // Validation
        if (tableId < 0 || indexedCols.length < 1 || aggColName.length < 1) {
            deferred.reject("Invalid Parameters!");
            return (deferred.promise());
        }

        // extract groupByCols
        var groupByCols = indexedCols.split(",");
        var tableName = gTables[tableId].tableName;
        var finalTableName;
        var finalTableCols;

        // current workshhet index
        var curWS = WSManager.getWSFromTable(tableId);
        var txId = Transaction.start({
            "msg"      : StatusMessageTStr.GroupBy + " " + operator,
            "operation": SQLOps.GroupBy
        });

        xcHelper.lockTable(tableId);
        var startTime = (new Date()).getTime();
        var focusOnTable = false;
        var startScrollPosition = $('#mainFrame').scrollLeft();

        XIApi.groupBy(txId, operator, groupByCols, aggColName,
                      isIncSample, tableName, newColName)
        .then(function(nTableName, nTableCols) {
            finalTableCols = nTableCols;
            finalTableName = nTableName;

            var timeAllowed = 1000;
            var endTime = (new Date()).getTime();
            var elapsedTime = endTime - startTime;
            var timeSinceLastClick = endTime -
                                     gMouseEvents.getLastMouseDownTime();
            // we'll focus on table if its been less than timeAllowed OR
            // if the user hasn't clicked or scrolled
            if (elapsedTime < timeAllowed ||
                (timeSinceLastClick >= elapsedTime &&
                    ($('#mainFrame').scrollLeft() === startScrollPosition))) {
                focusOnTable = true;
            }
            var options = {"focusWorkspace": focusOnTable};

            return TblManager.refreshTable([finalTableName], finalTableCols,
                                            null, curWS, options);
        })
        .then(function() {
            xcHelper.unlockTable(tableId);

            var sql = {
                "operation"   : SQLOps.GroupBy,
                "operator"    : operator,
                "tableName"   : tableName,
                "tableId"     : tableId,
                "indexedCols" : indexedCols,
                "aggColName"  : aggColName,
                "newColName"  : newColName,
                "isIncSample" : isIncSample,
                "newTableName": finalTableName
            };

            var finalTableId = xcHelper.getTableId(finalTableName);
            Transaction.done(txId, {
                "msgTable"      : finalTableId,
                "sql"           : sql,
                "noNotification": focusOnTable
            });

            deferred.resolve(finalTableName);
        })
        .fail(function(error) {
            xcHelper.unlockTable(tableId);

            var sql = {
                "operation"   : SQLOps.GroupBy,
                "operator"    : operator,
                "tableName"   : tableName,
                "tableId"     : tableId,
                "indexedCols" : indexedCols,
                "aggColName"  : aggColName,
                "newColName"  : newColName,
                "isIncSample" : isIncSample,
                "newTableName": finalTableName
            };

            Transaction.fail(txId, {
                "failMsg": StatusMessageTStr.GroupByFailed,
                "error"  : error,
                "sql"    : sql
            });

            deferred.reject(error);
        });

        return deferred.promise();
    };

    // map a column
    xcFunction.map = function(colNum, tableId, fieldName, mapString, mapOptions) {
        var deferred = jQuery.Deferred();

        mapOptions = mapOptions || {};

        var table = gTables[tableId];
        var tableName = table.getName();

        var worksheet = WSManager.getWSFromTable(tableId);
        var sql = {
            "operation" : SQLOps.Map,
            "tableName" : tableName,
            "tableId"   : tableId,
            "colNum"    : colNum,
            "fieldName" : fieldName,
            "mapString" : mapString,
            "mapOptions": mapOptions
        };
        var txId = Transaction.start({
            "msg"      : StatusMessageTStr.Map + " " + fieldName,
            "operation": SQLOps.Map,
            "sql"      : sql
        });
        var finalTableName;
        var finalTableId;

        xcHelper.lockTable(tableId);

        XIApi.map(txId, mapString, tableName, fieldName)
        .then(function(tableAfterMap) {
            finalTableName = tableAfterMap;
            finalTableId = xcHelper.getTableId(finalTableName);

            var tablCols = xcHelper.mapColGenerate(colNum, fieldName, mapString,
                                                    table.tableCols, mapOptions);

            // map do not change groupby stats of the table
            Profile.copy(tableId, finalTableId);
            var options = {"selectCol": colNum - 1};
            return TblManager.refreshTable([finalTableName], tablCols,
                                            [tableName], worksheet, options);
        })
        .then(function() {
            xcHelper.unlockTable(tableId);

            sql.newTableName = finalTableName;
            Transaction.done(txId, {
                "msgTable": finalTableId,
                "sql"     : sql
            });

            deferred.resolve();
        })
        .fail(function(error) {
            xcHelper.unlockTable(tableId);

            Transaction.fail(txId, {
                "failMsg": StatusMessageTStr.MapFailed,
                "error"  : error
            });

            deferred.reject(error);
        });

        return deferred.promise();
    };

    // export table
    // backColumns and frontColumns are arrays of column names
    xcFunction.exportTable = function(tableName, exportName, targetName,
                                      numCols, backColumns, frontColumns,
                                      keepOrder, dontShowModal, options) {

        var deferred = jQuery.Deferred();
        var retName  = $(".retTitle:disabled").val();

        if (!retName || retName === "") {
            retName = "testing";
        }

        // now disable retName
        // var fileName = retName + ".csv";
        // var location = hostname + ":/var/tmp/xcalar/" + exportName;

        var sql = {
            "operation"   : SQLOps.ExportTable,
            "tableName"   : tableName,
            "exportName"  : exportName,
            "targetName"  : targetName,
            "numCols"     : numCols,
            "frontColumns": frontColumns,
            "backColumns" : backColumns,
            "keepOrder"   : keepOrder || false,
            "options"     : options,
            "htmlExclude" : ['options']
        };
        var txId = Transaction.start({
            "msg"      : StatusMessageTStr.ExportTable + ": " + tableName,
            "operation": SQLOps.ExportTable,
            "sql"      : sql
        });

        XcalarExport(tableName, exportName, targetName, numCols, backColumns,
                     frontColumns, keepOrder, options, txId)
        .then(function() {
            var ext = "";
            if (options.format === DfFormatTypeT.DfFormatCsv) {
                ext = ".csv";
            } else if (options.format === DfFormatTypeT.DfFormatSql) {
                ext = ".sql";
            }
            var instr = xcHelper.replaceMsg(ExportTStr.SuccessInstr, {
                "table"   : tableName,
                "location": targetName,
                "file"    : exportName + ext
            });
            var msg = xcHelper.replaceMsg(ExportTStr.SuccessMsg, {
                "file"    : exportName + ext,
                "location": targetName
            });
            if (!dontShowModal) {
                Alert.show({
                    "title"     : ExportTStr.Success,
                    "msg"       : msg,
                    "instr"     : instr,
                    "isAlert"   : true,
                    "isCheckBox": true,
                    "onCancel"  : function() {
                        $('#alertContent').removeClass('leftAlign');
                    }
                });
                $('#alertContent').addClass('leftAlign');
            }
            Transaction.done(txId, {
                "msgTable": xcHelper.getTableId(tableName)
            });

            deferred.resolve();
        })
        .fail(function(error) {
            var noAlert;
            // if error is that export name already in use and modal is still
            // visible, then show a statusbox next to the name field
            if (error && (error.status === StatusT.StatusDsODBCTableExists ||
                error.status === StatusT.StatusExist ||
                error.status === StatusT.StatusExportSFFileExists) &&
                $('#exportName:visible').length !== 0) {
                StatusBox.show(ErrTStr.NameInUse, $('#exportName'), true);
                noAlert = true;
            } else {
                noAlert = false;
            }

            Transaction.fail(txId, {
                "failMsg": StatusMessageTStr.ExportFailed,
                "error"  : error,
                "noAlert": noAlert
            });

            deferred.reject(error);
        });

        return deferred.promise();
    };

    xcFunction.rename = function(tableId, newTableName) {
        var deferred = jQuery.Deferred();

        if (tableId == null || newTableName == null) {
            deferred.reject("Invalid renaming parameters");
            return (deferred.promise());
        }

        var table = gTables[tableId];
        var oldTableName = table.tableName;

        var sql = {
            "operation"   : SQLOps.RenameTable,
            "tableId"     : tableId,
            "oldTableName": oldTableName,
            "newTableName": newTableName
        };
        var txId = Transaction.start({
            "operation": SQLOps.RenameTable,
            "sql"      : sql
        });

        // not lock table is the operation is short
        var lockTimer = setTimeout(function() {
            xcHelper.lockTable(tableId);
        }, 500);

        var newTableNameId = xcHelper.getTableId(newTableName);
        if (newTableNameId !== tableId) {
            console.warn("Table Id not consistent");
            newTableName = xcHelper.getTableName(newTableName) + "#" + tableId;
        }

        XcalarRenameTable(oldTableName, newTableName, txId)
        .then(function() {
            // does renames for gTables, rightsidebar, dag
            table.tableName = newTableName;

            TableList.renameTable(tableId, newTableName);
            Dag.renameAllOccurrences(oldTableName, newTableName);

            updateTableHeader(tableId);

            Transaction.done(txId);
            deferred.resolve(newTableName);
        })
        .fail(function(error) {
            console.error("Rename Fails!". error);

            Transaction.fail(txId, {
                "noAlert": noAlert,
                "error"  : error
            });
            deferred.reject(error);
        })
        .always(function() {
            clearTimeout(lockTimer);
            xcHelper.unlockTable(tableId);
        });

        return deferred.promise();
    };

    return (xcFunction);
}(jQuery, {}));
