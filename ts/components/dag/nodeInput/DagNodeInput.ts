class DagNodeInput {
    protected input;
    protected parameters;
    public static schema = {}; // schema is generated by taking a valid input struct
    // example and running it through https://www.jsonschema.net/

    constructor(inputStruct) {
        inputStruct = inputStruct || {};
        this.setInput(inputStruct);
    }

    public getInput(replaceParameters?: boolean) {
        if (replaceParameters) {
            return this.replaceParameters(this.input, DagParamManager.Instance.getParamMap());
        } else {
            return this.input;
        }
    }

    public setInput(input) {
        this.input = input;
        try {
            this.parameters = xcHelper.getParamsInVal(JSON.stringify(this.input));
        } catch (e) {
            this.parameters = [];
            console.error(e);
        }
    }

    public getParameters() {
        return this.parameters;
    }

    public hasParameters() {
        return this.parameters.length > 0;
    }

    // swaps all found parameters with the values in the paramMap
    public getParameterReplacedInput(paramMap) {
        // XXX validateJSON elsewhere
        const validation = this.validateParameters(this.input);
        if (validation.error) {
            return validation.error
        } else {
            return this.replaceParameters(this.input, paramMap);
        }
    }

    public isConfigured(): boolean {
        return (Object.keys(this.input).length > 0);
    }

    public validate(input?): {error: string} {
        input = input || this.input;
        window["ajv"] = new Ajv(); //TODO: try to reuse
        const validate = ajv.compile(this.constructor["schema"]);
        const valid = validate(input);
        if (!valid) {
            // only saving first error message
            const msg = this._parseValidationErrMsg(validate.errors[0]);
            return {error: msg};
        } else {
            const paramCheck = this.validateParameters(input);
            if (paramCheck) {
                return paramCheck;
            }
            return null;
        }
    }

    private _parseValidationErrMsg(errorObj) {
        let path = errorObj.dataPath;
        if (path[0] === ".") {
            path = path.slice(1);
        }
        if (!path) {
            path = "Configuration ";
        }
        let msg = errorObj.message;
        switch (errorObj.keyword) {
            case ("enum"):
                msg += ": " + xcHelper.listToEnglish(errorObj.params.allowedValues);
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

    private replaceParameters(input, paramMap) {
        // can provide custom input but if not, use the instance's input
        if (!input) {
            return input;
        }
        paramMap = paramMap || {};
        const swappedInput = xcHelper.deepCopy(input);
        replace(swappedInput);
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
                return xcHelper.replaceMsg(value, paramMap)
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
                    // check matching brackets
                    if (!xcHelper.checkValidParamBrackets(value)) {
                        return {error: ErrTStr.UnclosedParamBracket + ": " + value};
                    }

                    // check valid characters in parameter
                    const params = xcHelper.getParamsInVal(value);
                    for (let i = 0; i < params.length; i++) {
                        const isValid = xcHelper.checkNamePattern(
                                                    PatternCategory.Param2,
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
}