window.Repeat = (function($, Repeat) {
    var repeatFuncs = {};
    var wsOperations = [SQLOps.AddWS, SQLOps.HideWS, SQLOps.DelWS];
    var tableOperations = [SQLOps.HideTable, SQLOps.UnhideTable,
                           SQLOps.ArchiveTable, SQLOps.MoveTableToWS,
                           SQLOps.DeleteTable, SQLOps.SortTableCols,
                           SQLOps.ResizeTableCols];

    Repeat.run = function(sql) {
        xcAssert((sql != null), "invalid sql");

        var deferred = jQuery.Deferred();

        var options = sql.getOptions();
        var operation = sql.getOperation();
        var colNums = [];
        var tableId;

        if (repeatFuncs.hasOwnProperty(operation)) {
            if (wsOperations.indexOf(operation) === -1) {
                var $ths = $(".xcTable th.selectedCell");
                if (tableOperations.indexOf(operation) > -1) {
                    tableId = xcHelper.getFocusedTable();
                    if (!tableId) {
                        return PromiseHelper.resolve();
                    }
                    $ths.each(function() {
                        colNums.push(xcHelper.parseColNum($(this)));
                    });
                } else {

                    if (!$ths.length) {
                        return PromiseHelper.resolve();
                    }
                    var $table = $ths.closest(".xcTable");
                    tableId = xcHelper.parseTableId($table);
                    $ths.each(function() {
                        colNums.push(xcHelper.parseColNum($(this)));
                    });
                }
            }

            var minModeCache = gMinModeOn;
            // do not use any animation
            gMinModeOn = true;

            repeatFuncs[operation](options, colNums, tableId)
            .then(function(){
                deferred.resolve();
            })
            .fail(function() {
                // XX do we do anything with the cursor?
                deferred.reject("repeat failed");
            })
            .always(function() {
                gMinModeOn = minModeCache;
            });
        } else {
            console.warn("Unknown operation cannot repeat", operation);
            deferred.reject("Unknown operation");

        }

        return (deferred.promise());
    };

    Repeat.isValidOperation = function(opName) {
        return opName in repeatFuncs;
    };

    /* START BACKEND OPERATIONS */
    // redoFuncs[SQLOps.IndexDS] = function(options) {
    //     return (TblManager.refreshTable([options.tableName], null, [],
    //                                     options.worksheet));
    // };

    // only sort 1 column
    repeatFuncs[SQLOps.Sort] = function(options, colNums, tableId) {
        if (colNums.length !== 1) {
            return PromiseHelper.resolve(null);
        }
        var progCol = gTables[tableId].getCol(colNums[0]);
        var type = progCol.getType();
        var validTypes = [ColumnType.boolean, ColumnType.float,
                          ColumnType.integer, ColumnType.number,
                          ColumnType.string];
        if (validTypes.indexOf(type) === -1) {
            return PromiseHelper.resolve(null);
        }

        return TblMenu.sortColumn(colNums[0], tableId, options.order);
    };

    // repeatFuncs[SQLOps.Filter] = function(options) {
    // };

    // repeatFuncs[SQLOps.Query] = redoFuncs[SQLOps.Filter];

    // repeatFuncs[SQLOps.Map] = function(options) {
    // };

    // repeatFuncs[SQLOps.Join] = function(options) {
    // };

    // repeatFuncs[SQLOps.GroupBy] = function(options) {
    // };

    // currently only works on 1 column
    repeatFuncs[SQLOps.SplitCol] = function(options, colNums, tableId) {
        if (colNums.length !== 1) {
            return PromiseHelper.resolve(null);
        }
        var progCol = gTables[tableId].getCol(colNums[0]);
        if (progCol.getType() !== ColumnType.string) {
            return PromiseHelper.resolve(null);
        }

        var delimiter = options.delimiter;
        var numColToGet = options.numColToGet;
        return ColManager.splitCol(colNums[0], tableId, delimiter, numColToGet);
    };

    repeatFuncs[SQLOps.ChangeType] = function(options, colNums, tableId) {
        var colTypeInfos = [];
        var type = options.colTypeInfos[0].type;
        for (var i = 0; i < colNums.length; i++) {
            colTypeInfos.push({colNum: colNums[i], type: type});
        }
        return ColManager.changeType(colTypeInfos, tableId);
    };

    // repeatFuncs[SQLOps.Project] = function(options) {
    // };

    // repeatFuncs[SQLOps.Ext] = function(options) {
    // };

    /* END BACKEND OPERATIONS */

    /* USER STYLING/FORMATING OPERATIONS */

    repeatFuncs[SQLOps.MinimizeCols] = function(options, colNums, tableId) {
        return ColManager.minimizeCols(colNums, tableId);
    };

    repeatFuncs[SQLOps.MaximizeCols] = function(options, colNums, tableId) {
        return ColManager.maximizeCols(colNums, tableId);
    };

    repeatFuncs[SQLOps.AddNewCol] = function(options, colNums, tableId) {
        ColManager.addNewCol(colNums[0], tableId, options.direction);
        return PromiseHelper.resolve(null);
    };

    repeatFuncs[SQLOps.HideCol] = function(options, colNums, tableId) {
        return (ColManager.delCol(colNums, tableId));
    };

    repeatFuncs[SQLOps.TextAlign] = function(options, colNums, tableId) {
        ColManager.textAlign(colNums, tableId, options.cachedAlignment);
        return PromiseHelper.resolve(null);
    };

    repeatFuncs[SQLOps.ChangeFormat] = function(options, colNums, tableId) {
        ColManager.format(colNums, tableId, options.formats);
        return PromiseHelper.resolve(null);
    };

    repeatFuncs[SQLOps.RoundToFixed] = function(options, colNums, tableId) {
        var decimals = xcHelper.deepCopy(options.decimals);
        var table = gTables[tableId];
        for (var i = 0; i < colNums.length; i++) {
            var colNum = colNums[i];
            var progCol = table.getCol(colNum);
            if (progCol.getType() !== ColumnType.float) {
                colNums.splice(i, 1);
                decimals.splice(i, 1);
                i--;
            }
        }
        if (colNums.length) {
            ColManager.roundToFixed(colNums, tableId, decimals);
        }

        return PromiseHelper.resolve(null);
    };

    /* END USER STYLING/FORMATING OPERATIONS */

    /* Table Operations */
    repeatFuncs[SQLOps.ArchiveTable] = function(options, colNums, tableId) {
        TblManager.archiveTables(tableId);
        return PromiseHelper.resolve(null);
    };

    // repeatFuncs[SQLOps.ActiveTables] = function(options) {
    //     // redo sent to worksheet
    // };

    repeatFuncs[SQLOps.HideTable] = function(options, colNums, tableId) {
        TblManager.hideTable(tableId);
        return PromiseHelper.resolve(null);
    };

    repeatFuncs[SQLOps.UnhideTable] = function(options, colNums, tableId) {
        TblManager.unHideTable(tableId);
        return PromiseHelper.resolve(null);
    };

    repeatFuncs[SQLOps.MarkPrefix] = function(options, colNums, tableId) {
        if (colNums.length === 1) {
            var progCol = gTables[tableId].getCol(colNums[0]);
            var prefix = progCol.getPrefix();
            if (prefix) {
                TPrefix.markColor(prefix, options.newColor);
            }
        }
        return PromiseHelper.resolve(null);
    };

    repeatFuncs[SQLOps.DeleteTable] = function (options, colNums, tableId) {
        var deferred = jQuery.Deferred();
        var table = gTables[tableId];
        var tableName = table.tableName;

        var msg = xcHelper.replaceMsg(TblTStr.DelMsg, {"table": tableName});
        Alert.show({
            "title": TblTStr.Del,
            "msg": msg,
            "onConfirm": function() {
                TblManager.deleteTables(tableId, TableType.Active)
                .then(function() {
                    Support.memoryCheck(true);
                })
                .always(function() {
                    deferred.resolve(null);
                });
            },
            "onCancel": function() {
                deferred.resolve(null);
            }
        });
        return deferred.promise();
    };

    repeatFuncs[SQLOps.SortTableCols] = function(options, colNums, tableId) {
        TblManager.sortColumns(tableId, options.sortKey, options.direction);
        return PromiseHelper.resolve(null);
    };

    repeatFuncs[SQLOps.ResizeTableCols] = function(options, colNums, tableId) {
        if (!colNums.length) {
            if (!options.allCols) {
                return PromiseHelper.resolve(null);
            }
            colNums = undefined;
        }
        TblManager.resizeColumns(tableId, options.sizeTo, colNums);
        return PromiseHelper.resolve(null);
    };
    // /* End of Table Operations */

    /* Worksheet Operations */
    repeatFuncs[SQLOps.AddWS] = function() {
        WSManager.addWS();
        return PromiseHelper.resolve(null);
    };


    repeatFuncs[SQLOps.MoveTableToWS] = function(options, colNums, tableId) {
        if (WSManager.getActiveWS() !== options.newWorksheetId) {
            WSManager.moveTable(tableId, options.newWorksheetId);
        }
        return PromiseHelper.resolve(null);
    };

    // repeatFuncs[SQLOps.MoveInactiveTableToWS] = function(options) {
    // };

    repeatFuncs[SQLOps.HideWS] = function() {
        if (WSManager.getNumOfWS() > 1) {
            WSManager.hideWS(WSManager.getActiveWS());
        }
        return PromiseHelper.resolve(null);
    };

    // XXX weird behavior if repeating a delete table with delete ws
    // repeatFuncs[SQLOps.DelWS] = function(options) {
    //     if (WSManager.getNumOfWS() > 1) {
    //         return WSManager.delWSCheck(WSManager.getActiveWS());
    //     }
    //     return PromiseHelper.resolve(null);
    // };
    /* End of Worksheet Operation */

    return (Repeat);
}(jQuery, {}));
