class DagNodeInput {
    protected lastInput;
    protected input;
    protected parameters;
    public static schema = {}; // schema is generated by taking a valid input struct
    // example and running it through https://www.jsonschema.net/

     /**
     * DagNodeInput.getParamsInVal
     * @description searches text for matching < and >, returns immediately if
     * <sdf<sdf> is found
     * @param val
     */
    public static getParamsInVal(val: string): string[] {
        var len = val.length;
        var param = "";
        var params = [];
        var braceOpen = false;
        for (var i = 0; i < len; i++) {
            if (braceOpen) {
                if (val[i] === ">") {
                    if (param.length) {
                        // only add param if has valid characters
                        if (xcHelper.checkNamePattern(PatternCategory.Param,
                                            PatternAction.Check, param)) {
                                params.push(param);
                        }
                    }
                    param = "";
                    braceOpen = false;
                } else if (val[i] === "<") {
                    // invalid, break and return what we have
                    return params;
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

    /**
     * DagNodeInput.checkValidParamBrackets
     * @param val
     * @param requiresParam if true, will return false if no params found
     */
    public static checkValidParamBrackets(
        val: string,
        requiresParam?: boolean
    ): boolean {
        const len = val.length;
        let braceOpen = false;
        let numLeftBraces = 0;
        let numRightBraces = 0;
        let hasParam = false;

        for (let i = 0; i < len; i++) {
            if (val[i] === ">") {
                numLeftBraces++;
            } else if (val[i] === "<") {
                numRightBraces++;
            }
            if (braceOpen) {
                if (val[i] === ">") {
                    braceOpen = false;
                    if (numLeftBraces === numRightBraces) {
                        hasParam = true;
                    }
                }
            } else if (val[i] === "<") {
                braceOpen = true;
            }
        }
        const passedParamRequirement = !requiresParam || hasParam;
        return (!braceOpen && numLeftBraces === numRightBraces &&
                passedParamRequirement);
    }

        /**
     * DagNdoeInput.replaceParamForValidation
     * @param txt
     * @example "my<param>text" to "myatext" so text can pass validation
     */
    public static replaceParamForValidation(
        txt: string,
        replaceWith?: string
    ): string {
        const params = DagNodeInput.getParamsInVal(txt);
        const replaces = {};
        params.forEach((paramName) => {
            replaces[paramName] = replaceWith || "a";
        });
        return xcStringHelper.replaceMsg(txt, replaces);
    }

    /**
     * xcHelper.stringifyEval
     * assumes valid func structure of {args:[], name:""};
     * @param func
     */
    public static stringifyEval(func: ParsedEval): string {
        return DagNodeInput.stringifyEvalHelper(func);
    }

    private static stringifyEvalHelper(func: ParsedEval): string {
        let str: string = "";
        if (func.fnName) {
            str += func.fnName;
            str += "(";
        }

        const args: ParsedEval[] | ParsedEvalArg[] = func.args;
        for (let i = 0; i < args.length; i++) {
            if (i > 0) {
                str += ",";
            }

            if (args[i].type === "fn") {
                str += DagNodeInput.stringifyEvalHelper(<ParsedEval>args[i]);
            } else {
                const arg = <ParsedEvalArg>args[i];
                str += arg.value;
            }
        }
        if (func.fnName) {
            str += ")";
        }
        return str;
    }

    constructor(inputStruct) {
        inputStruct = inputStruct || {};
        this.setInput(inputStruct);
        this.lastInput = this.input;
    }

    public getInput(replaceParameters?: boolean) {
        let input;
        if (replaceParameters) {
            input = DagNodeInput.replaceParameters(this.input, this.getRuntime().getDagParamService().getParamMap());
            // input = DagNodeInput.replaceParameters(this.input, DagParamManager.Instance.getParamMap());
        } else {
            input = this.input;
        }
        return xcHelper.deepCopy(input);
    }

    public setInput(input) {
        this.lastInput = this.input;
        this.input = input;
        try {
            this.parameters = DagNodeInput.getParamsInVal(JSON.stringify(this.input));
        } catch (e) {
            this.parameters = [];
            console.error(e);
        }
    }

    public hasParametersChanges(): boolean {
        return JSON.stringify(this.lastInput) !== JSON.stringify(this.input);
    }

    public getParameters(): any[] {
        return this.parameters;
    }

    public hasParameters(): boolean {
        return this.parameters.length > 0;
    }

    // swaps all found parameters with the values in the paramMap
    public getParameterReplacedInput(paramMap) {
        // XXX validateJSON elsewhere
        const validation = this.validateParameters(this.input);
        if (validation.error) {
            return validation.error
        } else {
            return DagNodeInput.replaceParameters(this.input, paramMap);
        }
    }

    public isConfigured(): boolean {
        return (Object.keys(this.input).length > 0);
    }

    public validate(input?): {error: string} {
        input = input || this.input;
        if (!this.constructor["validateFn"]) {
            let ajv = new Ajv();
            this.constructor["validateFn"] = ajv.compile(this.constructor["schema"]);
        }
        const valid = this.constructor["validateFn"](input);
        if (!valid) {
            // only saving first error message
            const msg = this._parseValidationErrMsg( this.constructor["validateFn"].errors[0]);
            return {error: msg};
        } else {
            const paramCheck = this.validateParameters(input);
            if (paramCheck) {
                return paramCheck;
            }
            return null;
        }
    }

    protected _parseValidationErrMsg(errorObj) {
        let path = errorObj.dataPath;
        if (path[0] === ".") {
            path = path.slice(1);
        }
        if (!path) {
            path = "Configuration";
        }
        let msg = errorObj.message;
        switch (errorObj.keyword) {
            case ("enum"):
                msg += ": " + xcStringHelper.listToEnglish(errorObj.params.allowedValues);
                break;
            case ("additionalProperties"):
                msg += ": " + errorObj.params.additionalProperty;
                break;
            default:
            // do nothing
        }
        msg = path + " " + msg;
        return msg;
    }

    public static replaceParameters(input, paramMap) {
        // can provide custom input but if not, use the instance's input
        if (!input) {
            return input;
        }
        paramMap = paramMap || {};
        let swappedInput = xcHelper.deepCopy(input);
        paramMap = Object.keys(paramMap).reduce((res, key) => {
            res[`<${key}>`] = paramMap[key];
            return res;
        }, {});

        swappedInput = replace(swappedInput) || swappedInput;
        return swappedInput;

        function replace(value) {
            if (value == null) {
                return null;
            } else if (value.constructor === Array) {
                for (let i = 0; i < value.length; i++) {
                    const res = replace(value[i]);
                    if (res) {
                        value[i] = res;
                    }
                }
            } else if (typeof value === "object") {
                for (let i in value) {
                    const res = replace(value[i]);
                    if (res) {
                        value[i] = res;
                    }
                }
            } else if (typeof value === "string") {
                return xcStringHelper.replaceTemplate(value, paramMap, true);
            }
        }
    }

    public validateParameters(
        value: Object,
        parameterizableFields?: string[]
    ): {error: string} {
        const trace = [];
        const res = validate(value, trace);
        return res;

        function validate(value, trace) {
            if (value == null) {
                return null;
            } else if (value.constructor === Array) {
                for (let i = 0; i < value.length; i++) {
                    trace.push(i);
                    var res = validate(value[i], trace);
                    if (res) {
                        return res;
                    }
                    trace.pop();
                }
            } else if (typeof value === "object") {
                for (let i in value) {
                    const openBracketIndex = i.indexOf("<");
                    if (openBracketIndex > -1 && (openBracketIndex < i.indexOf(">"))) {
                        return {error: "Keys cannot be parameterized: " + i};
                    }
                    trace.push(i);
                    var res = validate(value[i], trace);
                    if (res) {
                        return res;
                    }
                    trace.pop();
                }
            } else if (typeof value === "string") {
                const openBracketIndex = value.indexOf("<");
                if (openBracketIndex > -1 && (openBracketIndex < value.indexOf(">"))) {
                    // XXX old code for checking against paramterizable properties

                    var parent = trace[trace.length - 1];
                    // check if property accepts parameters
                    if (parameterizableFields &&
                        parameterizableFields.indexOf(parent) === -1) {
                        return {error: "Field \"" + parent + "\" cannot be parameterized."};
                    }

                    // check valid characters in parameter
                    const params = DagNodeInput.getParamsInVal(value);
                    for (let i = 0; i < params.length; i++) {
                        const isValid = xcHelper.checkNamePattern(
                                                    PatternCategory.Param,
                                                    PatternAction.Check,
                                                    params[i]);
                        if (!isValid) {
                            return {error: ErrTStr.NoSpecialCharInParam + ": " + value};
                        }
                    }
                }
            }
            return null;
        }
    }

    protected getRuntime(): DagRuntime {
        // In expServer execution, this function is overridden by DagRuntime.accessible() and should never be invoked.
        // In XD execution, this will be invoked in case the DagNode instance
        // is not decorated by DagRuntime.accessible(). Even the decoration happens,
        // the return object will always be DagRuntime._defaultRuntime, which is the same
        // object as we return in this function.
        return DagRuntime.getDefaultRuntime();
    }
}

if (typeof exports !== 'undefined') {
    exports.DagNodeInput = DagNodeInput;
};
