class ExportOpPanelModel {
    public columnList: ExportOpPanelModelColumnInfo[] = [];
    public exportDrivers: ExportDriver[] = [];
    public currentDriver: ExportDriver;
    public loadedName: string;
    public driverArgs: ExportDriverArg[];
    private _advMode: boolean;

    public static getColumnsFromDag(dagNode: DagNodeExport): Map<string, ProgCol> {
        const allColsList: ProgCol[][] = dagNode.getParents().map((parentNode) => {
            return parentNode.getLineage().getColumns();
        });
        const allColMap: Map<string, ProgCol> = new Map();
        for (const cols of allColsList) {
            for (const col of cols) {
                allColMap.set(col.getBackColName(), col);
            }
        }
        return allColMap;
    }

    /**
     * Create ExportOpPanelModel instance from input configuration and column meta
     * @param dagInput
     * @param allColMap
     * @param drivers
     */
    public static fromDagInput(dagInput: DagNodeExportInputStruct,
             allColMap: Map<string, ProgCol>, drivers: ExportDriver[]): ExportOpPanelModel {
        const model: ExportOpPanelModel = new ExportOpPanelModel();
        model.exportDrivers = drivers;
        model.currentDriver = drivers.find((driver) => {
            return driver.name == dagInput.driver;
        });
        model.setAdvMode(true);
        model.driverArgs = model.constructParams(model.currentDriver, dagInput.driverArgs);
        model.loadedName = dagInput.driver;
        const selectedColumns = dagInput.columns.reduce( (res, col) => {
            res[col] = true;
            return res;
        }, {});
        for (const [colName, colInfo] of allColMap.entries()) {
            const isSelected: boolean = selectedColumns[colName] ? true : false;
            // Derived column
            model.columnList.push({
                name: colName,
                isSelected: isSelected,
                type: colInfo.type
            });
        }

        return model;
    }

    /**
     * Restores the model that dagNode may have, excluding params.
     * @param dagNode
     */
    public static fromDag(dagNode: DagNodeExport) {
        const model: ExportOpPanelModel = new ExportOpPanelModel();
        const dagInputInfo: DagNodeExportInputStruct = dagNode.getParam();
        const selectedColumns: {} = dagInputInfo.columns.reduce( (res, col) => {
            res[col] = true;
            return res;
        }, {});

        const allColMap: Map<string, ProgCol> = this.getColumnsFromDag(dagNode);

        for (const [colName, colInfo] of allColMap.entries()) {
            const isSelected: boolean = selectedColumns[colName] ? true : false;
            // Derived column
            model.columnList.push({
                name: colName,
                isSelected: isSelected,
                type: colInfo.type
            });
        }

        $("#exportDriver").val(dagInputInfo.driver);
        model.loadedName = dagInputInfo.driver || "";

        model._advMode = false;
        return model;
    }



    /**
     * Loads all export drivers.
     */
    public loadDrivers(): JQueryDeferred<{}> {
        const deferred: JQueryDeferred<{}> = PromiseHelper.deferred();
        XcalarDriverList()
        .then((drivers: ExportDriver[]) => {
            this.exportDrivers = drivers;
            this.currentDriver = drivers.find((driver: ExportDriver) => {
                return driver.name == this.loadedName;
            });
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred;
    }

    /**
     * Creates the DagNodeExportInputStruct for the current model.
     */
    public toDag(): DagNodeExportInputStruct {
        const dagData: DagNodeExportInputStruct = {
            columns: [],
            driver: "",
            driverArgs: {}
        };
        for (const colInfo of this.columnList) {
            if (colInfo.isSelected) {
                dagData.columns.push(colInfo.name);
            }
        }
        if (this.currentDriver != null) {
            dagData.driver = this.currentDriver.name;
        } else {
            dagData.driver = "";
        }
        if (this.driverArgs != null) {
            this.driverArgs.forEach((arg: ExportDriverArg) => {
                dagData.driverArgs[arg.name] = arg.value;
            })
        }
        return dagData;
    }

    /**
     * Restores prior saved parameters. Only used for op panel
     */
    private _restoreParams(): void {
        let $params: JQuery = $("#exportOpPanel .argsSection .exportArg");
        let $param: JQuery = null;
        this.driverArgs.forEach((arg: ExportDriverArg, index: number) => {
            if (arg.value == null) {
                return;
            }
            $param = $params.eq(index);
            if (arg.type == "boolean" && arg.value == "true") {
                $param.addClass("checked");
                $param.find('.checkbox').addClass("checked");
                return;
            }
            $param.find('input').val(arg.value);
            return;
        });
    }

    public constructParams(driver: ExportDriver, oldArgs?: {[key: string]: string}) {
        if (driver == null) {
            return [];
        }
        let driverParams = [];
        driver.params.forEach((param: ExportParam) => {
            let arg: ExportDriverArg = {
                "name": param.name,
                "type": param.type,
                "optional": param.optional,
                "value": null
            }
            if (param.type == "boolean") {
                arg.value = "false";
            }
            if (oldArgs) {
                arg.value = oldArgs[param.name];
            }
            driverParams.push(arg);
        });
        return driverParams;
    }

    /**
     * Assembles driver parameter list for driver
     * @param driver
     */
    public setUpParams(driver: ExportDriver): void {
        if (this.currentDriver != null && driver.name == this.currentDriver.name) {
            this._restoreParams();
            return;
        } else if (driver == null) {
            return;
        }
        this.currentDriver = driver;
        this.driverArgs = this.constructParams(driver);
    }

    /**
     * Sets the value of the parameter at argIndex
     * @param value
     * @param argIndex
     */
    public setParamValue(value: string, argIndex: number): void {
        let arg: ExportDriverArg = this.driverArgs[argIndex];
        arg.value = value;
    }

    /**
     * Verifies a dagInpuit follows the convention of an export input
     * @param dagInput
     * @returns {string}
     */
    public verifyDagInput(dagInput: DagNodeExportInputStruct): string {
        if (dagInput.columns == null) {
            return "Input must have column list."
        }
        if (dagInput.driver == null) {
            return "Input must have associated driver."
        }
        if (dagInput.columns.length == 0) {
            return "Cannot export empty result."
        }
        const driver: ExportDriver = this.exportDrivers.find((driver) => {
            return driver.name == dagInput.driver;
        });
        if (driver == null) {
            return "Invalid driver specified: \"" + dagInput.driver + '"';
        }
        const dParams: ExportParam[] = driver.params;
        const inputParams: {[key: string]: string} = dagInput.driverArgs;
        const inputNames: string[] = Object.keys(inputParams);
        if (dParams.length != inputNames.length) {
            return "Invalid number of parameters for driver specified";
        }

        for (let i = 0; i < dParams.length; i++) {
            let dParam: ExportParam = dParams[i];
            let name: string = inputNames[i];
            if (dParam.name != name) {
                return "Parameter \"" + name + "\" does not align with driver parameter: \"" +
                    dParam.name;
            }
        }

        return "";
    }

    /**
     * Validates the current arguments/parameters.
     */
    public validateArgs($container: JQuery): boolean {
        if (this.driverArgs == null || this.exportDrivers == []) {
            let $errorLocation: JQuery = $container.find(".btn.confirm");
            StatusBox.show("No existing driver.", $errorLocation,
                false, {'side': 'right'});
            return false;
        }
        const argLen: number = this.driverArgs.length;
        let arg: ExportDriverArg = null;
        let $parameters: JQuery = $container.find(".exportArg");
        for(let i = 0; i < argLen; i++) {
            arg = this.driverArgs[i];
            if (!arg.optional && arg.value == null || arg.value == "") {
                let $errorLocation: JQuery = $parameters.eq(i).find(".label");
                if (this._advMode) {
                    $errorLocation = $container.find(".advancedEditor");
                }
                StatusBox.show("\"" + arg.name + "\" is not an optional parameter.", $errorLocation,
                    false, {'side': 'right'});
                return false;
            }
            if (arg.type == "integer") {
                if (!$.isNumeric(arg.value)) {
                    let $errorLocation: JQuery = $parameters.eq(i).find(".label");
                    if (this._advMode) {
                        $errorLocation = $container.find(".advancedEditor");
                    }
                    StatusBox.show("\"" + arg.name + "\" must be an integer.", $errorLocation,
                        false, {'side': 'right'});
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Saves the arguments to the dagNode
     * @param dagNode
     */
    public saveArgs(dagNode: DagNodeExport): boolean {
        if (!this.validateArgs($("#exportOpPanel"))) {
            return false;
        }
        dagNode.setParam(this.toDag());
        return true;
    }

    /**
     * Sets all columns to be selected or not
     * @param selected
     */
    public setAllCol(selected: boolean): void {
        this.columnList.forEach((column: ExportOpPanelModelColumnInfo) => {
            column.isSelected = selected;
        });
    }

    /**
     * Toggles the column at the index to be selected or not
     * @param colIndex
     */
    public toggleCol(colIndex: number): void {
        let col: ExportOpPanelModelColumnInfo = this.columnList[colIndex];
        col.isSelected = !col.isSelected;
        return;
    }

    /**
     * Sets this model to be in advanced mode or not.
     * @param mode
     */
    public setAdvMode(mode: boolean): void {
        this._advMode = mode;
    }

    /**
     * Says this model to be in advanced mode or not.
     */
    public isAdvMode(): boolean {
        return this._advMode;
    }


    public createParamHtml(param: ExportParam): string {
        let argHtml: string = "";
        let type: string = "";
        switch (param.type) {
            case "integer":
                type = "number";
                break;
            case "boolean":
                type = "checkbox";
                break;
            case "target":
                type = "target";
                break;
            case "string":
                type = "text";
                break;
            default:
                break;
        }
        type = param.secret ? "password" : type;
        argHtml = '';
        argHtml = '<div class="exportArg formRow ' + param.name.replace(/ /g,"_") + ' ' + type + 'Arg">' +
            '<div class="subHeading clearfix">' +
                '<div class="label">' + param.name
        if (param.optional) {
            argHtml += ' (optional)'
        }
        argHtml += ':</div>' +
            '</div>' +
            '<p class="instrText">' + param.description + '</p>';
        if (param.type == "target") {
            argHtml += this._createTargetListHtml();
        } else if (param.type == "boolean") {
            argHtml += '<div class="checkbox">' +
            '<i class="icon xi-ckbox-empty"></i>' +
            '<i class="icon xi-ckbox-selected"></i></div>'
        } else {
            argHtml += '<div class="inputWrap">' +
                '<input class="arg ';
            if (param.optional) {
                argHtml += 'optional" placeholder="Optional'
            }
            argHtml += '" type="' + type + '"></div>';
        }
        argHtml += '</div>'
        return argHtml;
    }

    private _createTargetListHtml(): string {
        let html: string = '<div class="dropDownList">' +
            '<input class="text" type="text" value="" spellcheck="false">' +
            '<div class="iconWrapper"><i class="icon xi-arrow-down"></i></div>' +
            '<div class="list"><ul class="exportDrivers">';
        // Object.values is not supported by many browsers
        const obj = DSTargetManager.getAllTargets();
        let targets: {name: string}[] = Object.keys(obj).map((key) => obj[key]);
        targets.forEach((target) => {
            html += "<li>" + target.name + "</li>";
        });
        html += '</ul><div class="scrollArea top"><i class="arrow icon xi-arrow-up"></i></div>' +
            '<div class="scrollArea bottom"><i class="arrow icon xi-arrow-down"></i>' +
            '</div></div></div>'
        return html;
    }
}