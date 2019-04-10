namespace xcFunction {
    interface XcFuncOptions {
        formOpenTime?: number;
    }

    interface XcFuncSortColInfo {
        colNum?: number;
        ordering: number;
        typeToCast: ColumnType | null;
        name?: string;
    }

    interface XcFuncSortOptions extends XcFuncOptions {

    }

    /**
     * xcFunction.sort
     * @param tableId
     * @param colInfo
     * @param options
     */
    export function sort(
        tableId: TableId,
        colInfos: XcFuncSortColInfo[],
        options: XcFuncSortOptions = <XcFuncSortOptions>{}
    ): XDPromise<string> {
        const table: TableMeta = gTables[tableId];
        const tableName: string = table.getName();
        const tableCols: ProgCol[] = table.tableCols;
        const keys: string[] = [];
        const colNums: number[] = [];
        const orders: number[] = [];
        const hiddenSortCols = {};

        colInfos.forEach((colInfo) => {
            let progCol: ProgCol = null;
            let colNum: number = colInfo.colNum
            if (colInfo.colNum == null && colInfo.name != null) {
                colNum = table.getColNumByBackName(colInfo.name);
            }

            if (colNum != null) {
                progCol = table.getCol(colInfo.colNum);
            }
            if (progCol == null) {
                keys.push(colInfo.name);
            } else {
                keys.push(progCol.getFrontColName(true));
            }

            colNums.push(colNum);
            orders.push(colInfo.ordering);
        });

        function typeCastHelper(srcTable: string): XDPromise<string> {
            const typesToCast: ColumnType[] = [];
            const mapStrs: string[] = [];
            const mapColNames: string[] = [];
            const newColInfos: {name: string, ordering: XcalarOrderingT, type?: ColumnType, colNum?: number}[] = [];
            let newTableCols: ProgCol[] = tableCols;
            const prevTableHiddenSortCols = table.getHiddenSortCols();
            const prevHiddenSortColsSet: Set<string> = new Set();
            for (let name in prevTableHiddenSortCols) {
                prevHiddenSortColsSet.add(prevTableHiddenSortCols[name]);
            }

            colInfos.forEach((colInfo, i) => {
                const progCol: ProgCol = table.getCol(colNums[i]);
                const backColName: string = (progCol == null) ?
                    colInfo.name : progCol.getBackColName();

                const parsedName: PrefixColInfo = xcHelper.parsePrefixColName(backColName);
                let typeToCast: ColumnType = colInfo.typeToCast;

                const type: ColumnType = (progCol == null) ?
                    null : progCol.getType();
                if (!prevHiddenSortColsSet.has(backColName) && parsedName.prefix !== "") {
                    // if it's a prefix, need to cast to immediate first
                    // as sort will create an immeidate and go back to sort table's
                    // parent table need to have the same column
                    typeToCast = typeToCast || type;
                }
                if (typeToCast != null) {
                    const mapString: string = xcHelper.castStrHelper(backColName, typeToCast, false);
                    let mapColName: string = xcHelper.stripColName(parsedName.name);
                    mapColName = xcHelper.getUniqColName(tableId, mapColName);

                    mapStrs.push(mapString);
                    mapColNames.push(mapColName);
                    typesToCast.push(typeToCast);
                    newColInfos.push({
                        name: mapColName,
                        ordering: colInfo.ordering,
                        type: typeToCast
                    });

                    newTableCols = xcHelper.deepCopy(tableCols);
                    if (newTableCols[colNums[i] - 1]) {
                        newTableCols[colNums[i] - 1].sortedColAlias = mapColName;
                        hiddenSortCols[mapColName] = backColName;
                    }
                } else {
                    let colName = backColName;
                    if (prevHiddenSortColsSet.has(backColName)) {
                        colName = progCol.getSortedColAlias();
                        if (colName !== backColName) {
                            hiddenSortCols[colName] = backColName;
                        }
                    } else if (prevTableHiddenSortCols[colName]) {
                        hiddenSortCols[colName] = prevTableHiddenSortCols[colName];
                    }
                    newColInfos.push({
                        name: colName,
                        colNum: colNums[i],
                        ordering: colInfo.ordering,
                        type: type
                    });
                }
            });

            if (!mapStrs.length) {
                return PromiseHelper.resolve(srcTable, newColInfos, tableCols);
            }

            sql['typeToCast'] = typesToCast;
            const innerDeferred: XDDeferred<string> = PromiseHelper.deferred();

            XIApi.map(txId, mapStrs, srcTable, mapColNames)
            .then((mapTableName) => {
                TblManager.setOrphanTableMeta(mapTableName, newTableCols);
                innerDeferred.resolve(mapTableName, newColInfos, newTableCols);
            })
            .fail(innerDeferred.reject);

            return innerDeferred.promise();
        }

        // XXX fix this
        const direction: string = (orders[0] === XcalarOrderingT.XcalarOrderingAscending) ?
            "ASC" : "DESC";
        const sql: object = {
            operation: SQLOps.Sort,
            tableName: tableName,
            tableId: tableId,
            keys: keys,
            colNums: colNums,
            orders: orders,
            direction: direction,
            sorted: true,
            options: options,
            colInfo: colInfos,
            htmlExclude: ["options", "colInfo"]
        };
        let msg;
        if (colInfos.length > 1) {
            msg = StatusMessageTStr.Sort + " multiple columns";
        } else {
            msg = StatusMessageTStr.Sort + " " +
                xcHelper.escapeHTMLSpecialChar(keys[0]);
        }
        const txId: number = Transaction.start({
            msg: msg,
            operation: SQLOps.Sort,
            sql: sql,
            track: true
        });

        // user timeout because it may fail soon if table is already sorted
        // lock table will cause blinking
        xcHelper.lockTable(tableId, txId, {delayTime: 200});

        const deferred: XDDeferred<string> = PromiseHelper.deferred();
        let finalTableName: string;
        let finalTableCols: ProgCol[];

        typeCastHelper(tableName)
        .then((tableToSort, newColInfos, newTableCols) => {
            finalTableCols = newTableCols;

            newColInfos.forEach((colInfo) => {
                if (colInfo.type == null) {
                    const table: TableMeta = gTables[tableId];
                    if (table != null) {
                        const progCol: ProgCol = table.getCol(colInfo.colNum);
                        if (progCol != null) {
                            colInfo.name = progCol.getBackColName();
                            colInfo.type = progCol.getType();
                            if (colInfo.type === ColumnType.number) {
                                colInfo.type = ColumnType.float;
                            }
                        }
                    }
                }
            });

            return XIApi.sort(txId, newColInfos, tableToSort);
        })
        .then((sortTableName) => {
            finalTableName = sortTableName;
            // sort will filter out KNF, so it change the profile
            return TblManager.refreshTable([finalTableName], finalTableCols, [tableName], txId);
        })
        .then(() => {
            if (table.hasLock()) {
                xcHelper.unlockTable(tableId);
            }

            gTables[xcHelper.getTableId(finalTableName)].setHiddenSortCols(hiddenSortCols);
            sql['newTableName'] = finalTableName;
            Transaction.done(txId, {
                msgTable: xcHelper.getTableId(finalTableName),
                sql: sql
            });
            deferred.resolve(finalTableName);
        })
        .fail((error, sorted) => {
            if (table.hasLock()) {
                xcHelper.unlockTable(tableId);
            }

            if (sorted) {
                Transaction.cancel(txId);
                const msg: string = xcHelper.replaceMsg(IndexTStr.SortedErr, {
                    order: XcalarOrderingTStr[orders[0]].toLowerCase() // XXX fix this
                });
                Alert.error(IndexTStr.Sorted, msg);
            } else if (error.error === SQLType.Cancel) {
                Transaction.cancel(txId);
                deferred.resolve();
            } else {
                Transaction.fail(txId, {
                    failMsg: StatusMessageTStr.SortFailed,
                    error: error
                });
            }
            deferred.reject(error);
        });

        return deferred.promise();
    }
}