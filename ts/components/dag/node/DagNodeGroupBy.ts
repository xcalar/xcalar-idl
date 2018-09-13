class DagNodeGroupBy extends DagNode {
    protected input: DagNodeGroupByInput;

    public constructor(options: DagNodeInfo) {
        super(options);
        this.type = DagNodeType.GroupBy;
        this.minParents = 1;
    }

    /**
     * @returns {DagNodeGroupByInput} GroupBy node parameters
     */
    public getParam(): DagNodeGroupByInput {
        return {
            groupBy: this.input.groupBy || [""],
            aggregate: this.input.aggregate || [{operator: "", sourceColumn: "", destColumn: "", distinct: false, cast: null}],
            includeSample: this.input.includeSample || false,
            icv: this.input.icv || false,
            groupAll: this.input.groupAll || false,
            newKeys: this.input.newKeys || []
        };
    }

    /**
     * Set project node's parameters
     * @param input {DagNodeProjectInput}
     * @param input.keys {string[]} An array of column names to group on
     * @param input.eval an array of column eval info
     * @param includeSample {boolean} include sample columns or not
     */
    public setParam(input: DagNodeGroupByInput = <DagNodeGroupByInput>{}) {
        this.input = {
            groupBy: input.groupBy,
            aggregate: input.aggregate,
            includeSample: input.includeSample,
            icv: input.icv,
            groupAll: input.groupAll,
            newKeys: input.newKeys
        }
        this._updateNewKeys();
        super.setParam();
    }

    // XXX TODO: verify it's correctness
    public lineageChange(columns: ProgCol[]): DagLineageChange {
        const changes: {from: ProgCol, to: ProgCol}[] = [];
        const aggCols: ProgCol[] = [];
        let finalCols: ProgCol[] = [];

        this.input.aggregate.forEach((aggInfo) => {
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

        if (this.input.includeSample) {
            finalCols = aggCols.concat(columns);
        } else {
            const colMap: Map<string, ProgCol> = new Map();
            columns.forEach((progCol) => {
                const colName: string = progCol.getBackColName();
                colMap.set(colName, progCol);
            });
            const groupCols: ProgCol[] = [];
            this.input.groupBy.forEach((colName, index) => {
                const oldProgCol: ProgCol = colMap.get(colName);
                const colType: ColumnType = oldProgCol.getType();
                const newKey: string = this.input.newKeys[index];
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
        const oldNewKeys = this.input.newKeys || [];

        oldNewKeys.forEach((key) => {
            takenNames.add(key);
        });

        this.input.aggregate.forEach((aggInfo) => {
            takenNames.add(aggInfo.destColumn);
        });
        const parsedGroupByCols: PrefixColInfo[] = this.input.groupBy.map(xcHelper.parsePrefixColName);
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
        this.input.newKeys = newKeys;
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