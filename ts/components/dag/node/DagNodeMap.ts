class DagNodeMap extends DagNode {
    protected input: DagNodeMapInput;
    private _aggregates: string[];

    public constructor(options: DagNodeMapInfo) {
        super(options);
        this.type = DagNodeType.Map;
        this.allowAggNode = true;
        this.minParents = 1;
        this._aggregates = options.aggregates || [];
        this.display.icon = "&#xe9da;";
        const namedAggs = Aggregates.getNamedAggs();
        this.input = new DagNodeMapInput(options.input);
        const self = this;
        let errorAggs = [];
        this._aggregates.forEach((aggregateName: string) => {
            if (!namedAggs[aggregateName.substring(1)]) {
                errorAggs.push(aggregateName);
            }
        });
        if (errorAggs.length) {
            self.beErrorState(StatusMessageTStr.AggregateNotExist + errorAggs);
        }
    }

    /**
     * @returns {string[]} used aggregates
     */
    public getAggregates(): string[] {
        return this._aggregates;
    }

    /**
     * Sets the aggregates for this node
     * @param aggregates
     */
    public setAggregates(aggregates: string[]): void {
        this._aggregates = aggregates;
        super.setAggregates(aggregates);
    }

    /**
     * Set map node's parameters
     * @param input {DagNodeMapInputStruct}
     * @param input.eval {Array} array of {evalString, newFieldName}
     */
    public setParam(input: DagNodeMapInputStruct = <DagNodeMapInputStruct>{}) {
        this.input.setInput({
            eval: input.eval,
            icv: input.icv,
        });
        super.setParam();
    }

    public lineageChange(
        columns: ProgCol[],
        replaceParameters?: boolean
    ): DagLineageChange {
        const changes: {from: ProgCol, to: ProgCol}[] = [];
        const params = this.input.getInput(replaceParameters);
        params.eval.forEach((evalInput) => {
            const colName: string = evalInput.newField;
            if (xcHelper.parsePrefixColName(colName).prefix) {
                throw new Error("columns generated by map cannot have prefix");
            }

            const func = XDParser.XEvalParser.parseEvalStr(evalInput.evalString);
            if (func.error) {
                console.error(func.error);
                return;
            }
            const colType: ColumnType = this._getOpType(func);
            const progCol = ColManager.newPullCol(colName, colName, colType);
            let fromCol = null;
            if (this.subType === DagNodeSubType.Cast) {
                const fromColName = (<ParsedEvalArg>func.args[0]).value;
                for (let i = 0; i < columns.length; i++) {
                    if (columns[i].getBackColName() === fromColName) {
                        fromCol = columns.splice(i, 1)[0];
                        break;
                    }
                }
            }
            columns.push(progCol);
            changes.push({
                from: fromCol,
                to: progCol
            });
        });


        return {
            columns: columns,
            changes: changes
        };
    }

    public applyColumnMapping(renameMap): void {
        try {
            const evals = this.input.getInput().eval;
            evals.forEach(evalObj => {
                evalObj.evalString = this._replaceColumnInEvalStr(evalObj.evalString, renameMap.columns);
            });
            this.input.setEvals(evals);
        } catch(err) {
            console.error(err);
        }
        super.setParam(null, true);
    }

    /**
     * Get the used UDF modules in the node
     */
    public getUsedUDFModules(): Set<string> {
        const set: Set<string> = new Set();
        this.input.getInput().eval.forEach((evalArg) => {
            try {
                const arg = XDParser.XEvalParser.parseEvalStr(evalArg.evalString);
                this._getUDFFromArg(arg, set);
            } catch (e) {
                console.error(e);
            }
        });
        return set;
    }

    /**
     * @override
     */
    protected _getSerializeInfo(): DagNodeMapInfo {
        let info = super._getSerializeInfo();
        info['aggregates'] = this._aggregates;
        return info;
    }

    /**
     * @override
     */
    protected _genParamHint(): string {
        let hint: string = "";
        const input: DagNodeMapInputStruct = this.getParam();
        if (input.eval.length) {
            const evalStrs: string[] = input.eval.map((evalInfo) => evalInfo.evalString);
            hint = evalStrs.join(",");
        }
        return hint;
    }

    private _getOpType(func: ParsedEval): ColumnType {
        const operator: string = func.fnName;
        let colType: ColumnType = null;
        const opsMap = XDFManager.Instance.getOperatorsMap();
        for (let category in opsMap) {
            const ops = opsMap[category];
            const opInfo = ops[operator];
            if (opInfo) {
                colType = xcHelper.convertFieldTypeToColType(opInfo.outputType);
                break;
            }
        }
        return colType;
    }

    private _getUDFFromArg(arg: object, set: Set<string> ): void {
        const fnName: string = arg["fnName"];
        if (fnName == null) {
            return;
        }
        const splits: string[] = fnName.split(":");
        if (splits.length === 1) {
            return;
        }
        const moduleName: string = splits[0];
        set.add(moduleName);
        // recusrive check the arg
        if (arg["args"] != null) {
            arg["args"].forEach((subArg) => {
                this._getUDFFromArg(subArg, set);
            });
        }
    }
}