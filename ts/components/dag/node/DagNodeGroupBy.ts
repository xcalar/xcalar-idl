class DagNodeGroupBy extends DagNode {
    protected input: DagNodeGroupByInput;

    public constructor(options: DagNodeInfo) {
        super(options);
        this.type = DagNodeType.GroupBy;
        this.minParents = 1;
        this.display.icon = "&#xe937;";
        this.input = new DagNodeGroupByInput(options.input);
    }

    /**
     * @returns {DagNodeGroupByInputStruct} GroupBy node parameters
     */
    public getParam(): DagNodeGroupByInputStruct {
        return this.input.getInput();

    }

    /**
     * Set project node's parameters
     * @param input {DagNodeProjectInputStruct}
     * @param input.keys {string[]} An array of column names to group on
     * @param input.eval an array of column eval info
     * @param includeSample {boolean} include sample columns or not
     */
    public setParam(input: DagNodeGroupByInputStruct = <DagNodeGroupByInputStruct>{}) {
        this.input.setInput({
            groupBy: input.groupBy,
            aggregate: input.aggregate,
            includeSample: input.includeSample,
            icv: input.icv,
            groupAll: input.groupAll,
            newKeys: input.newKeys
        });
        this._updateNewKeys();
        super.setParam();
    }

    // XXX TODO: verify it's correctness
    public lineageChange(columns: ProgCol[]): DagLineageChange {
        const changes: {from: ProgCol, to: ProgCol}[] = [];
        const aggCols: ProgCol[] = [];
        let finalCols: ProgCol[] = [];
        const input = this.input.getInput();
        input.aggregate.forEach((aggInfo) => {
            const colName: string = aggInfo.destColumn;
            if (xcHelper.parsePrefixColName(colName).prefix) {
                throw new Error("columns generated by map cannot have prefix");
            }
            const colType: ColumnType = this._getAggColType(aggInfo.operator);
            const progCol: ProgCol = ColManager.newPullCol(colName, colName, colType);
            aggCols.push(progCol);
            changes.push({
                from: null,
                to: progCol
            });
        });

        if (input.includeSample) {
            finalCols = aggCols.concat(columns);
        } else {
            const colMap: Map<string, ProgCol> = new Map();
            columns.forEach((progCol) => {
                const colName: string = progCol.getBackColName();
                colMap.set(colName, progCol);
            });
            const groupCols: ProgCol[] = [];
            input.groupBy.forEach((colName, index) => {
                const oldProgCol: ProgCol = colMap.get(colName);
                if (!oldProgCol) {
                    return;
                }
                const colType: ColumnType = oldProgCol.getType();
                const newKey: string = input.newKeys[index];
                if (colName !== newKey) {
                    const progCol: ProgCol = ColManager.newPullCol(newKey, newKey, colType);
                    groupCols.push(progCol);
                    changes.push({
                        from: oldProgCol,
                        to: progCol
                    });
                    colMap.delete(colName);
                } else {
                    groupCols.push(oldProgCol);
                    colMap.delete(colName);
                }
            });
            finalCols = aggCols.concat(groupCols);
            for (let progCol of colMap.values()) {
                changes.push({
                    from: progCol,
                    to: null
                });
            }
        }

        return {
            columns: finalCols,
            changes: changes
        }
    }

    private _updateNewKeys(): void {
        const takenNames: Set<string> = new Set();
        const input = this.input.getInput();
        const oldNewKeys = input.newKeys || [];
        oldNewKeys.forEach((key) => {
            takenNames.add(key);
        });

        input.aggregate.forEach((aggInfo) => {
            takenNames.add(aggInfo.destColumn);
        });
        const parsedGroupByCols: PrefixColInfo[] = input.groupBy.map(xcHelper.parsePrefixColName);
        parsedGroupByCols.forEach((parsedCol) => {
            if (!parsedCol.prefix) {
                takenNames.add(parsedCol.name);
            }
        });

        const newKeys: string[] = parsedGroupByCols.map((parsedCol, index) => {
            if (oldNewKeys[index]) {
                return oldNewKeys[index];
            } else if (!parsedCol.prefix) {
                // immediate
                return parsedCol.name;
            } else {
                // prefix
                let name: string = xcHelper.stripColName(parsedCol.name, false);
                if (!takenNames.has(name)) {
                    return name;
                }

                name = xcHelper.convertPrefixName(parsedCol.prefix, name);
                let newName: string = name;
                if (!takenNames.hasOwnProperty(newName)) {
                    return newName;
                }
                return xcHelper.randName(name);
            }
        });
        input.newKeys = newKeys;
    }

    public applyColumnMapping(renameMap): void {
        const newRenameMap = xcHelper.deepCopy(renameMap);
        const input = this.input.getInput();
        try {
            input.groupBy.forEach((val, i) => {
                if (renameMap.columns[val]) {
                    input.groupBy[i] = renameMap.columns[val];
                    delete newRenameMap.columns[val];
                    // this column gets renamed so we don't need to map it
                    // anymore
                    // XXX decide if we want to rename the newKey as well
                } else {
                    input.groupBy[i] = this._replaceColumnInEvalStr(val,
                                                renameMap.columns);
                }
            });
            input.aggregate.forEach((agg, i) => {
                if (renameMap.columns[agg.sourceColumn]) {
                    input.aggregate[i].sourceColumn = renameMap.columns[agg.sourceColumn];
                } else {
                    input.aggregate[i].sourceColumn = this._replaceColumnInEvalStr(agg.sourceColumn,
                                                renameMap.columns);
                }
            });
        } catch(err) {
            console.error(err);
        }
        super.setParam();
        return newRenameMap;
    }

    private _getAggColType(operator: string): ColumnType {
        let colType: ColumnType = null;
        const opsMap = XDFManager.Instance.getOperatorsMap();
        const ops = opsMap[FunctionCategoryT.FunctionCategoryAggregate];
        const opInfo = ops[operator];
        if (opInfo) {
            colType = xcHelper.getDFFieldTypeToString(opInfo.outputType);
        }
        return colType;
    }
}