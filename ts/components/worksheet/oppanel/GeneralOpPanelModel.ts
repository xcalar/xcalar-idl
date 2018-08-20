class GeneralOpPanelModel {
    protected dagNode: DagNodeFilter;
    protected tableColumns: ProgCol[];
    protected event: Function;
    protected groups: OpPanelFunctionGroup[]; // TODO fix
    protected andOrOperator: string;
    protected _opCategories: number[];

    public constructor(dagNode: DagNodeFilter, event: Function) {
        this.dagNode = dagNode;
        this.event = event;
        this.groups = [];
        this.andOrOperator = "and";
        this.tableColumns = this.dagNode.getParents().map((parentNode) => {
            return parentNode.getLineage().getColumns();
        })[0] || [];
        this._opCategories = [];
        const params: DagNodeFilterInput = this.dagNode.getParam();
        this._initialize(params);
    }

    /**
     * Return the whole model info
     */
    public getModel(): {
        groups: OpPanelFunctionGroup[],
        andOrOperator: string
    } {
        return {
            groups: this.groups,
            andOrOperator: this.andOrOperator
        }
    }

    public getColumns() {
        return this.tableColumns;
    }

    public addGroup(): void {
        this.groups.push({
            operator: "",
            args: []
        });
        this._update();
    }

    public removeGroup(index: number): void {
        this.groups.splice(index, 1);
        this._update();
    }

    public clearFunction(index: number): void {
        this.groups[index].operator = "";
        this.groups[index].args = [];
        this._update();
    }

    public enterFunction(value: string, opInfo, index: number): void {
        this.groups[index].operator = value;
        if (!opInfo) {
            this.groups[index].args = [];
            this._update();
            return;
        }
        const numArgs = Math.max(Math.abs(opInfo.numArgs),
                                opInfo.argDescs.length);
        this.groups[index].args = Array(numArgs).fill("").map((_o, i) => {
                                        return new OpPanelArg("", opInfo.argDescs[i].typesAccepted);
                                    });
        if (value === "regex" && numArgs === 2) {
            this.groups[index].args[1].setRegex(true);
        }
        this._update();
    }

    public updateArg(
        value: string,
        groupIndex: number,
        argIndex: number,
        options?: any
    ): void {
        options = options || {};
        const group = this.groups[groupIndex];
        while (group.args.length <= argIndex) {
            group.args.push(new OpPanelArg("", -1));
        }
        // no arg if boolean is not true
        if ((options.boolean && value === "") || options.isEmptyArg) {
            group.args.splice(argIndex, 1);
        } else {
            const arg: OpPanelArg = group.args[argIndex];
            arg.setValue(value);
            if (options.typeid != null) {
                arg.setTypeid(options.typeid);
            }
            if (options.isNone) {
                arg.setIsNone(true);
            } else if (arg.hasOwnProperty("isNone")) {
                arg.setIsNone(false);
            }
            if (options.isEmptyString) {
                arg.setIsEmptyString(true);
            } else if (arg.hasOwnProperty("isEmptyString")) {
                arg.setIsEmptyString(false);
            }
            this._formatArg(arg);
            this._validateArg(arg);
        }

        // console.log(JSON.stringify(this.groups, null, 2));
        // this._update(); // causes focus/blur issues
    }

    public updateCast(
        type: ColumnType,
        groupIndex: number,
        argIndex: number
    ): void {
        const arg: OpPanelArg = this.groups[groupIndex].args[argIndex];
        arg.setCast(type);
        this._validateArg(arg);
    }
    /**
     * Submit the settings of Set op node params
     */
    public submit(): void {
        const param: DagNodeFilterInput = this._getParam();
        this.dagNode.setParam(param);
    }

    protected _initialize(paramsRaw) {
        const self = this;
        const params: xcHelper.OpAndArgsObject = xcHelper.extractOpAndArgs(
                                                        paramsRaw.evalString);
        // initialize all columns
        this.tableColumns = this.dagNode.getParents().map((parentNode) => {
            return parentNode.getLineage().getColumns();
        })[0];
        const func = params.op;
        const categoryNum = FunctionCategoryT.FunctionCategoryCondition;
        const ops = XDFManager.Instance.getOperatorsMap()[categoryNum];
        const opInfo = ops.find((op) => {
            return op.displayName === func;
        });

        const args = params.args.map((arg, i) => {
            const argInfo: OpPanelArg = new OpPanelArg(arg, opInfo.argDescs[i].typesAccepted, true);
            return argInfo;
        });
        args.forEach((arg) => {
            const value = formatArgToUI(arg.getValue());
            arg.setValue(value);
            if (func === "regex" && args.length === 2) {
                arg.setRegex(true);
            }
            self._formatArg(arg);
            self._validateArg(arg);
        });

        this.groups = [{operator: params.op, args: args}];
        this.andOrOperator = "and";

        function formatArgToUI(arg) {
            if (arg.charAt(0) !== ("'") && arg.charAt(0) !== ('"')) {
                if (self._isArgAColumn(arg)) {
                    // it's a column
                    if (arg.charAt(0) !== gAggVarPrefix) {
                        // do not prepend colprefix if has aggprefix
                        arg = gColPrefix + arg;
                    }
                }
            } else {
                const quote = arg.charAt(0);
                if (arg.lastIndexOf(quote) === arg.length - 1) {
                    arg = arg.slice(1, -1); // remove surrounding quotes
                }
            }
            return arg;
        }
    }

    protected _update(all?: boolean): void {
        // console.log(JSON.stringify(this.tableColumns), JSON.stringify(this.getModel(), null, 2));
        if (this.event != null) {
            this.event(all);
        }
    }

    protected _getParam(): DagNodeFilterInput {
        return this.dagNode.getParam();
    }

    // TODO: instead of storing formattedValue, calculate when needed based on
    // type
    protected _formatArg(arg: OpPanelArg): void {
        const self = this;
        let val: string = arg.getValue();
        const trimmedVal: string = val.trim();
        let formattedValue: string;

        if (trimmedVal === "") {
            if (arg.hasNoneChecked()) {
                formattedValue = "None";
            } else if (arg.checkIsEmptyString()) {
                formattedValue = "\"\"";
            } else {
                formattedValue = val;
            }
            arg.setType("value");
        } else if (arg.checkIsRegex()) {
            formattedValue = val;
            arg.setType("regex");
        } else if (this._hasFuncFormat(trimmedVal)) {
            formattedValue = self._parseColPrefixes(trimmedVal);
            arg.setType("function");
        } else if (xcHelper.hasValidColPrefix(trimmedVal)) {
            formattedValue = self._parseColPrefixes(trimmedVal);
            arg.setType("column");
        } else {
            formattedValue = self._formatArgumentInput(val, arg.getTypeid(), {}).value
            arg.setType("value");
        }
        arg.setFormattedValue(formattedValue.toString());
    }

    protected _validateArg(arg: OpPanelArg) {
        const self = this;
        let val: string = arg.getFormattedValue();
        let trimmedVal: string = val.trim();
        arg.clearError();

        if (val === "") {
            arg.setError("No value");
            return;
        }

        if (arg.getType() === "column") {
            if (val.includes(",")) {
                arg.setError("Multiple columns");
                return;
            }
            let colName = val;
            if (trimmedVal.length > 0) {
                colName = trimmedVal;
            }
            const progCol: ProgCol = self.tableColumns.find((progCol) => {
                return progCol.getBackColName() === colName;
            });
            if (progCol == null) { // if cannot find column, pass
                return;
            } else {
                let colType: string = progCol.getType();
                if (colType === ColumnType.integer && !progCol.isKnownType()) {
                    // for fat potiner, we cannot tell float or integer
                    // so for integer, we mark it
                    colType = ColumnType.number;
                }
                if (!arg.isCast()) {
                    if (colType == null) {
                        console.error("colType is null/col not " +
                            "pulled!");
                        arg.setError("No type");
                    } else {
                        const validTypes = self._parseType(arg.getTypeid());
                        let errorText = self._validateColInputType(validTypes, colType);
                        if (errorText != null) {
                            arg.setError(errorText);
                            return;
                        }
                    }
                }
            }
        } else if (arg.getType() === "value") {
            const checkRes = self._checkArgTypes(trimmedVal, arg.getTypeid());
            if (checkRes != null) {
                let error;
                if (checkRes.currentType === "string" &&
                    self._hasUnescapedParens(val)) {
                    // function-like string found but invalid format
                    error = ErrTStr.InvalidFunction;
                } else {
                    error = ErrWRepTStr.InvalidOpsType;
                    error = xcHelper.replaceMsg(error, {
                        "type1": checkRes.validType.join("/"),
                        "type2": checkRes.currentType
                    });
                }

                arg.setError(error);
            }
        }
    }

     // checks to see if value has at least one parentheses that's not escaped
    // or inside quotes
    protected _hasUnescapedParens(val: string): boolean {
        let inQuotes: boolean = false;
        for (let i = 0; i < val.length; i++) {
            if (inQuotes) {
                if (val[i] === '"') {
                    inQuotes = false;
                } else if (val[i] === '\\') {
                    i++; // ignore next character
                }
                continue;
            }
            if (val[i] === '"') {
                inQuotes = true;
            } else if (val[i] === '\\') {
                i++; // ignore next character
            } else if (val[i] === "(" || val[i] === ")") {
                return (true);
            }
        }
        return (false);
    }

     // used for args with column names provided like $col1, and not "hey" or 3
    protected _validateColInputType(
        requiredTypes: string[],
        inputType: string
    ): string {
        if (inputType === "newColumn") {
            return ErrTStr.InvalidOpNewColumn;
        } else if (inputType === ColumnType.mixed) {
            return null;
        } else if (requiredTypes.includes(inputType)) {
            return null;
        } else if (inputType === ColumnType.number &&
                    (requiredTypes.includes(ColumnType.float) ||
                        requiredTypes.includes(ColumnType.integer))) {
            return null;
        // } else if (inputType === ColumnType.string &&
        //             this._hasUnescapedParens($input.val())) {
        //     // function-like string found but invalid format
        //     return ErrTStr.InvalidFunction;
        } else {
            return xcHelper.replaceMsg(ErrWRepTStr.InvalidOpsType, {
                "type1": requiredTypes.join("/"),
                "type2": inputType
            });
        }
    }

    public getColumnTypeFromArg(value): string {
        const self = this;
        let colType: string;
        value = value.split(",")[0];
        const valSpacesRemoved: string = jQuery.trim(value);
        if (valSpacesRemoved.length > 0) {
            value = valSpacesRemoved;
        }

        const progCol: ProgCol = self.tableColumns.find((progCol) => {
            return progCol.getBackColName() === value;
        });
        if (progCol == null) {
            console.error("cannot find col", value);
            return;
        }

        // const backName = progCol.getBackColName();
        colType = progCol.getType();
        if (colType === ColumnType.integer && !progCol.isKnownType()) {
            // for fat potiner, we cannot tell float or integer
            // so for integer, we mark it
            colType = ColumnType.number;
        }
        return colType;
    }

    public switchMode(
        toAdvancedMode: boolean,
        editor: CodeMirror.EditorFromTextArea
    ): {error: string} {
        if (toAdvancedMode) {
            const param: DagNodeFilterInput = this._getParam();
            editor.setValue(JSON.stringify(param, null, 4));
        } else {
            const error = this.validateAdvancedMode(editor.getValue());
            if (error) {
                return error;
            }
            this._update();
        }
        return null;
    }

    public validateAdvancedMode(_paramStr: string): {error: string} {
        return null;
    }

    protected _hasFuncFormat(val: string): boolean {
        if (typeof val !== ColumnType.string) {
            return false;
        }
        val = val.trim();
        const valLen: number = val.length;

        if (valLen < 3) { // must be at least this long: a()
            return false;
        }

        //check if has opening and closing parens
        if (val.indexOf("(") > -1 && val.indexOf(")") > -1) {
            // check that val doesnt start with parens and that it does end
            // with parens
            if (val.indexOf("(") !== 0 &&
                val.lastIndexOf(")") === (valLen - 1)) {
                return (xcHelper.checkMatchingBrackets(val).index === -1);
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    protected _parseColPrefixes(str: string): string {
        for (let i = 0; i < str.length; i++) {
            if (str[i] === gColPrefix) {
                if (str[i - 1] === "\\") {
                    str = str.slice(0, i - 1) + str.slice(i);
                } else if (this._isActualPrefix(str, i)) {
                    str = str.slice(0, i) + str.slice(i + 1);
                }
            }
        }
        return (str);
    }

    protected _parseAggPrefixes(str: string): string {
        for (let i = 0; i < str.length; i++) {
            if (str[i] === gAggVarPrefix) {
                if (str[i - 1] === "\\") {
                    str = str.slice(0, i - 1) + str.slice(i);
                }
            }
        }
        return (str);
    }

    // returns true if previous character, not including spaces, is either
    // a comma, a (, or the very beginning
    protected _isActualPrefix(str: string, index: number): boolean {
        for (let i = index - 1; i >= 0; i--) {
            if (str[i] === ",") {
                return (true);
            } else if (str[i] === "(") {
                return (true);
            } else if (str[i] !== " ") {
                return (false);
            }
        }
        return (true);
    }

    protected _checkArgTypes(arg: string, typeid: number) {
        const types: string[] = this._parseType(typeid);
        let argType: string = "string";

        if (types.indexOf(ColumnType.string) > -1 ||
            types.indexOf(ColumnType.mixed) > -1)
        {
            // if it accepts string/mixed, any input should be valid
            return null;
        }

        let tmpArg: string | number = arg.toLowerCase();
        const isNumber: boolean = !isNaN(Number(arg));
        let canBeBooleanOrNumber: boolean = false;

        // boolean is a subclass of number
        if (tmpArg === "true" || tmpArg === "false" ||
            tmpArg === "t" || tmpArg === "f" || isNumber)
        {
            canBeBooleanOrNumber = true;
            argType = "string/boolean/integer/float";
        }

        if (types.indexOf(ColumnType.boolean) > -1) {
            // if arg doesn't accept strings but accepts booleans,
            // then the provided value needs to be a booleanOrNumber
            if (canBeBooleanOrNumber) {
                return null;
            } else {
                return {
                    "validType": types,
                    "currentType": argType
                };
            }
        }

        // the remaining case is float and integer, both is number
        tmpArg = Number(arg);

        if (!isNumber) {
            return {
                "validType": types,
                "currentType": argType
            };
        }

        if (types.indexOf(ColumnType.float) > -1) {
            // if arg is integer, it could be a float
            return null;
        }

        if (types.indexOf(ColumnType.integer) > -1) {
            if (tmpArg % 1 !== 0) {
                return {
                    "validType": types,
                    "currentType": ColumnType.float
                };
            } else {
                return null;
            }
        }

        if (types.length === 1 && types[0] === ColumnType.undefined) {
            return {
                "validType": types,
                "currentType": argType
            };
        }

        return null; // no known cases for this
    }

    protected _formatArgumentInput(
        value: string,
        typeid: number,
        existingTypes: object
    ) {
        const strShift: number = 1 << DfFieldTypeT.DfString;
        const numberShift: number =
                        (1 << DfFieldTypeT.DfInt32) |
                        (1 << DfFieldTypeT.DfUInt32) |
                        (1 << DfFieldTypeT.DfInt64) |
                        (1 << DfFieldTypeT.DfUInt64) |
                        (1 << DfFieldTypeT.DfFloat32) |
                        (1 << DfFieldTypeT.DfFloat64);
        const boolShift: number = 1 << DfFieldTypeT.DfBoolean;

        // when field accept
        let shouldBeString: boolean = (typeid & strShift) > 0;
        const shouldBeNumber: boolean = (typeid & numberShift) > 0;
        const shouldBeBoolean: boolean = (typeid & boolShift) > 0;
        let isNumberAsString: boolean;
        let isBoolAsString: boolean;

        if (shouldBeString) {
            // handle edge case
            const parsedVal: number = parseFloat(value);
            if (!isNaN(parsedVal) &&
                parsedVal === Number(value) &&
                shouldBeNumber)
            {
                // the case that the field accepts both string and number and
                // it fills in a number, should depends on the existingTypes

                // XXX potential bug is that existingTypes
                // has both string and number
                shouldBeString = existingTypes.hasOwnProperty(ColumnType.string);
                if (!shouldBeString) {
                    // when its number
                    value = <any>parsedVal;
                }
            } else if (this._isNumberInQuotes(value)) {
                if (shouldBeNumber) {
                    isNumberAsString = true;
                }
                // keep value as is
            } else if (this._isBoolInQuotes(value)) {
                if (shouldBeBoolean) {
                    isBoolAsString = true;
                }
            } else if (shouldBeBoolean) {
                const valLower = ("" + value).toLowerCase();
                if (valLower === "true" || valLower === "false") {
                    shouldBeString = false;
                }
            }
        }

        value = this._parseAggPrefixes(value);
        value = this._parseColPrefixes(value);
        if (shouldBeString) {
            if (!isNumberAsString && !isBoolAsString) {
                // add quote if the field support string
                value = "\"" + value + "\"";
                // stringify puts in too many slashes
            }
        } else if (shouldBeNumber) {
            const tempValue = "" + value; // Force string to provide indexOf
            if (tempValue.indexOf(".") === 0) {
                value = "0" + value;
            }
        } else {
            if (typeof value === ColumnType.string) {
                value = value.trim();
            }
        }

        return ({value: value, isString: shouldBeString});
    }

     // used in cases where arg could be type string and number
     protected _isNumberInQuotes(arg: string): boolean {
        if (arg[0] === "'" || arg[0] === '"') {
            const quote: string = arg[0];
            arg = arg.slice(1);
            if (arg.length > 1 && arg[arg.length - 1] === quote) {
                arg = arg.slice(0, arg.length - 1);
                const parsedVal: number = parseFloat(arg);
                if (!isNaN(parsedVal) && String(parsedVal) === arg) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }

        } else {
            return false;
        }
    }

    // used in cases where arg could be type string and bool
    protected _isBoolInQuotes(arg: string): boolean {
        if (arg[0] === "'" || arg[0] === '"') {
            const quote: string = arg[0];
            arg = arg.slice(1);
            if (arg.length > 1 && arg[arg.length - 1] === quote) {
                arg = arg.slice(0, arg.length - 1).toLowerCase();
                if (arg === "true" || arg === "false") {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }

        } else {
            return false;
        }
    }

    protected _parseType(typeId: number): ColumnType[] {
        const types: ColumnType[] = [];
        let typeShift: number;

        // string
        typeShift = 1 << DfFieldTypeT.DfString;
        if ((typeId & typeShift) > 0) {
            types.push(ColumnType.string);
        }

        // integer
        typeShift = (1 << DfFieldTypeT.DfInt32) |
                    (1 << DfFieldTypeT.DfUInt32) |
                    (1 << DfFieldTypeT.DfInt64) |
                    (1 << DfFieldTypeT.DfUInt64);
        if ((typeId & typeShift) > 0) {
            types.push(ColumnType.integer);
        }

        // float
        typeShift = (1 << DfFieldTypeT.DfFloat32) |
                    (1 << DfFieldTypeT.DfFloat64);
        if ((typeId & typeShift) > 0) {
            types.push(ColumnType.float);
        }

        // boolean
        typeShift = 1 << DfFieldTypeT.DfBoolean;
        if ((typeId & typeShift) > 0) {
            types.push(ColumnType.boolean);
        }

        // mixed
        typeShift = 1 << DfFieldTypeT.DfMixed;
        if ((typeId & typeShift) > 0) {
            types.push(ColumnType.mixed);
        }

        // undefined/unknown
        typeShift = (1 << DfFieldTypeT.DfNull) |
                    (1 << DfFieldTypeT.DfUnknown);
        if ((typeId & typeShift) > 0) {
            types.push(ColumnType.undefined);
        }

        return (types);
    }

    protected _isArgAColumn(arg: string) {
        return (isNaN(<any>arg) &&
                arg.indexOf("(") === -1 &&
                arg !== "true" && arg !== "false" &&
                arg !== "t" && arg !== "f" && arg !== "None");
    }

    protected _isOperationValid(groupNum): boolean {
        const groups = this.groups;
        const operator = groups[groupNum].operator;
        return this._getOperatorObj(operator) != null;
    }

    protected _getOperatorObj(operatorName: string): any {
        const opsLists = this._getOperatorsLists();
        for (let i = 0; i < opsLists.length; i++) {
            const op = opsLists[i].find((op) => {
                return op.displayName === operatorName;
            });
            if (op) {
                return op;
            }
        }
        return null;
    }

    protected _getOperatorsLists(): any[][] {
        const opLists: any[][] = [];
        this._opCategories.forEach(categoryNum => {
            let ops = XDFManager.Instance.getOperatorsMap()[categoryNum];
            opLists.push(ops);
        });
        return opLists;
    }


    public validateGroups() {
        const self = this;
        const groups = this.groups;

        // function name error
        for (let i = 0; i < groups.length; i++) {
            if (!self._isOperationValid(i)) {
                return {error: ErrTStr.NoSupportOp,
                        group: i,
                        arg: -1,
                        type: "function"};
            }
        }

        // blank inputs
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            for (let j = 0; j < group.args.length; j++) {
                const arg = group.args[j];
                if (!arg.checkIsValid() && arg.getError() === "No value") {
                    return {error: arg.getError(),
                            group: i,
                            arg: j,
                            type: "blank"};
                }
            }
        }

        // other errors aside from wrong type
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            for (let j = 0; j < group.args.length; j++) {
                const arg = group.args[j];
                if (!arg.checkIsValid() &&
                    !arg.getError().includes(ErrWRepTStr.InvalidOpsType
                                                        .substring(0, 20))) {
                    return {error: arg.getError(),
                            group: i,
                            arg: j,
                            type: "other"};
                }
            }
        }

        // wrong type on column
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            for (let j = 0; j < group.args.length; j++) {
                const arg = group.args[j];
                if (!arg.checkIsValid() && arg.getType() === "column" &&
                    arg.getError().includes(ErrWRepTStr.InvalidOpsType
                                                       .substring(0, 20))) {
                    return {error: arg.getError(),
                            group: i,
                            arg: j,
                            type: "columnType"};
                }
            }
        }

        // wrong type on value
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            for (let j = 0; j < group.args.length; j++) {
                const arg = group.args[j];
                if (!arg.checkIsValid() &&
                    arg.getError().includes(ErrWRepTStr.InvalidOpsType
                                                       .substring(0, 20))) {
                    return {error: arg.getError(),
                            group: i,
                            arg: j,
                            type: "valueType"};
                }
            }
        }
        return null;
    }

    protected _translateAdvancedErrorMessage(error) {
        let groups = this.groups;
        let text: string= "";
        let operator: string = "";
        if (groups[error.group]) {
            operator = groups[error.group].operator;
        }
        switch (error.type) {
            case ("function"):
                if (!operator) {
                    text = ErrTStr.NoEmpty;
                } else {
                    text = "\"" + operator + "\" is not a supported function."
                }
                break;
            case ("blank"):
                text = ErrTStr.NoEmpty;
                text = "Argument " + (error.arg + 1) + " in " + operator +
                       " function is empty.";
                break;
            case ("other"):
                text = error.error + ": " + groups[error.group].args[error.arg].getValue();
                break;
            case ("columnType"):
            case ("valueType"):
                const arg = groups[error.group].args[error.arg].getValue();
                text = "Value: " + arg + ". " + error.error;
                break;
            default:
                text = error.error;
                break;
        }
        return {error: text};
    }
}