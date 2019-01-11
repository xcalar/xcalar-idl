class ExportSQLTableModal {
    private static _instance: ExportSQLTableModal;
    private _$modal: JQuery; // $("#exportSQLTableModal")
    private _$exportDest: JQuery = null; // $("#exportSQLTableDriver");
    private _$exportDestList: JQuery = null; // $("#exportSQLTableDriverList");
    private _$exportColList: JQuery = null; // $("#exportSQLTableColumns .cols");
    private _$exportArgSection: JQuery = null; // $("#exportSQLTableModal .argsSection");
    private _modalHelper: ModalHelper;
    private _columns: ProgCol[];
    private _selectedDriver: string;
    private _dataModel: ExportOpPanelModel;
    private _tableName: string;

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private constructor() {
        const self = this;
        this._$modal = $("#exportSQLTableModal");
        this._$exportDest = $("#exportSQLTableDriver");
        this._$exportDestList = $("#exportSQLTableDriverList");
        this._$exportColList = $("#exportSQLTableColumns .cols");
        this._$exportArgSection = $("#exportSQLTableModal .argsSection");
        this._columns = [];
        this._modalHelper = new ModalHelper(this._$modal, {
            noEnter: true
        });
        self._dataModel = new ExportOpPanelModel();
        this._activateDropDown(this._$exportDestList, "#exportSQLTableDriverList");

        let expList: MenuHelper = new MenuHelper($("#exportSQLTableDriverList"), {
            "onSelect": function($li) {
                if ($li.hasClass("hint")) {
                    return false;
                }

                if ($li.hasClass("unavailable")) {
                    return true; // return true to keep dropdown open
                }

                self._$exportDest.val($li.text());
                self.renderDriverArgs();
                const driver: ExportDriver = self._dataModel.exportDrivers.find((driver) => {
                    return driver.name == $li.text();
                });
                self._selectedDriver = $li.text();
                self._dataModel.setUpParams(driver);
            }
        });
        expList.setupListeners();
        this._addEventListeners();
    }

    private _activateDropDown($list: JQuery, container: string) {
        let dropdownHelper: MenuHelper = new MenuHelper($list, {
            "onOpen": function() {
                var $lis = $list.find('li').sort(xcHelper.sortHTML);
                $lis.prependTo($list.find('ul'));
            },
            "container": container
        });
        dropdownHelper.setupListeners();
        new InputDropdownHint($list, {
            "menuHelper": dropdownHelper,
            "preventClearOnBlur": true,
            "onEnter": function (val, $input) {
                if (val === $.trim($input.val())) {
                    return;
                }
                $input.val(val);
            },
            "order": true
        });
    }

    /**
     * ExportSQLTableModal.Instance.show
     * @returns {boolean}
     * @param table
     */
    public show(tableName: string, columns: ProgCol[]): boolean {
        if (this._$modal.is(":visible")) {
            return false;
        }
        this._tableName = tableName;
        this._columns = columns;
        this._dataModel = new ExportOpPanelModel();
        this._selectedDriver = "";
        this._modalHelper.setup();
        this._dataModel.loadDrivers()
        .then(() => {
            this._updateUI();
        })
        .fail((error) => {
            console.error(error);
            this._dataModel.exportDrivers = [];
            StatusBox.show("Unable to load drivers", $("#exportSQLTableDriver"),
                    false, {'side': 'right'});
        });
        return true;
    };

    /**
     * Renders the current driver arguments on XD
     */
    public renderDriverArgs(): void {
        let driverName: string = this._$exportDest.val();
        if (driverName == "") {
            driverName = $("#exportDriverList .exportDriver").eq(0).text();
            this._$exportDest.val(driverName);
        } else if (driverName == this._selectedDriver) {
            return;
        }
        const driver: ExportDriver = this._dataModel.exportDrivers.find((driver) => {
            return driver.name == driverName;
        });
        if (driver == null) {
            return;
        }
        this._selectedDriver = driverName;
        let html: string = "";
        this._$exportArgSection.empty();
        let targetParams: string[] = [];
        driver.params.forEach((param: ExportParam) => {
            html += this._dataModel.createParamHtml(param);
            if (param.type == "target") {
                targetParams.push(param.name.replace(/ /g,"_"));
            }
        });
        this._$exportArgSection.append(html);
        let $targetList: JQuery = null;
        let container: string = "";
        targetParams.forEach((paramName) => {
            let self = this;
            container = "#exportSQLTableModal .argsSection ." + paramName + " .dropDownList"
            $targetList = $(container);
            this._activateDropDown($targetList, container);
            let expList: MenuHelper = new MenuHelper($(container), {
                "onSelect": ($li) => {
                    if ($li.hasClass("hint")) {
                        return false;
                    }

                    if ($li.hasClass("unavailable")) {
                        return true; // return true to keep dropdown open
                    }

                    $li.closest('.dropDownList').find('input').val($li.text());
                    let index: number = $("#exportSQLTableModal .exportArg").index($($li.closest(".exportArg")));
                    self._dataModel.setParamValue($li.text(), index);
                }
            });
            expList.setupListeners();
        });
        $("#exportSQLTableModal .argsSectionBox").removeClass("xc-hidden");
    }

    private _updateUI(): void {
        this._renderColumns();
        this._renderDriverList();
        this.renderDriverArgs();
    }

    private _getTypeIcon(type: ColumnType): string {
        return '<i class="icon type ' +
            xcHelper.getColTypeIcon(xcHelper.convertColTypeToFieldType(type)) +
            '"></i>';
    }

    private _renderColumns(): void {
        const columnList = this._columns;
        if (columnList.length == 0) {
            this._$exportColList.empty();
            $("#exportSQLTableColumns .noColsHint").show();
            $("#exportSQLTableColumns .selectAllWrap").hide();
            return;
        }

        // Render column list
        let html: string = "";
        columnList.forEach((column, index) => {
            const colName: string = xcHelper.escapeHTMLSpecialChar(
                column.name);
            const colNum: number = (index + 1);
            html += '<li class="col' +
                '" data-colnum="' + colNum + '">' +
                this._getTypeIcon(column.getType()) +
                '<span class="text tooltipOverflow" ' +
                'data-original-title="' +
                    xcHelper.escapeDblQuoteForHTML(
                        xcHelper.escapeHTMLSpecialChar(colName)) + '" ' +
                'data-toggle="tooltip" data-placement="top" ' +
                'data-container="body">' +
                    colName +
                '</span>' +
                '<div class="checkbox' + '">' +
                    '<i class="icon xi-ckbox-empty fa-13"></i>' +
                    '<i class="icon xi-ckbox-selected fa-13"></i>' +
                '</div>' +
            '</li>';
        });
        this._$exportColList.html(html);
        $("#exportSQLTableColumns .selectAllWrap").show();
        $("#exportSQLTableColumns .noColsHint").hide();
        if (this._$exportColList.find('.col .checked').length == this._$exportColList.find('.checkbox').length) {
            this._$modal.find(".selectAllWrap .checkbox").eq(0).addClass("checked");
        } else {
            this._$modal.find(".selectAllWrap .checkbox").eq(0).removeClass("checked");
        }

        if (columnList.length > 9) {
            this._$exportColList.css("overflow-y", "auto");
        } else {
            this._$exportColList.css("overflow-y", "hidden");
        }
    }

    private _renderDriverList() {
        let $list: JQuery = $("#exportSQLTableDriverList .exportDrivers");
        $list.empty();
        const drivers: ExportDriver[] = this._dataModel.exportDrivers;
        let html: string = "";
        drivers.forEach(driver => {
            html += '<li class="exportDriver">' + driver.name + '</li>';
        });
        $list.append(html);
    }

    private _addEventListeners(): void {
        const self = this;
        this._$modal.on("click", ".close, .cancel", function() {
            self._closeModal();
        });

        this._$modal.on("click", ".confirm", function() {
            self._submitForm();
        });

        $('#exportSQLTableColumns .selectAllWrap .checkbox').click(function(event) {
            let $box: JQuery = $(this);
            event.stopPropagation();
            if ($box.hasClass("active")) {
                return;
            }
            if ($box.hasClass("checked")) {
                $box.removeClass("checked");
                self._$exportColList.find('.checked').not(".active").removeClass("checked");
            } else {
                $box.addClass("checked");
                self._$exportColList.find('.col').addClass("checked");
                self._$exportColList.find('.checkbox').addClass("checked");
            }
        });

        $('#exportSQLTableColumns .columnsWrap').on("click", ".checkbox", function(event) {
            let $box: JQuery = $(this);
            let $col: JQuery = $(this).parent();
            event.stopPropagation();
            if ($box.hasClass("active")) {
                return;
            }
            if ($col.hasClass("checked")) {
                $col.removeClass("checked");
                $box.removeClass("checked");
                self._$modal.find(".selectAllWrap .checkbox").eq(0).removeClass("checked");
            } else {
                $col.addClass("checked");
                $box.addClass("checked");
                if (self._$exportColList.find('.col .checked').length == self._$exportColList.find('.checkbox').length) {
                    self._$modal.find(".selectAllWrap .checkbox").eq(0).addClass("checked");
                }
            }
        });

        $('#exportSQLTableModal .argsSection').on("click", ".checkbox", function(event) {
            event.stopPropagation();
            let $box: JQuery = $(this);
            let $arg: JQuery = $(this).parent();
            let paramIndex: number = $("#exportSQLTableModal .exportArg").index($arg);
            if ($arg.hasClass("checked")) {
                $arg.removeClass("checked");
                $box.removeClass("checked");
                self._dataModel.setParamValue("false", paramIndex);
            } else {
                $arg.addClass("checked");
                $box.addClass("checked");
                self._dataModel.setParamValue("true", paramIndex);
            }
        });

        $('#exportSQLTableModal .argsSection').on("change", "input", function(event) {
            event.stopPropagation();
            let $input = $(this);
            let $arg = $(this).closest('.exportArg');
            let paramIndex = $("#exportSQLTableModal .exportArg").index($arg);
            self._dataModel.setParamValue($input.val(), paramIndex);
        });
    }

    private _closeModal(): void {
        this._modalHelper.clear();
        this._reset();
    }

    private _reset(): void {
        this._columns = [];
        this._selectedDriver = "";
        this._$exportDest.val("");
        this._$modal.find(".argsSectionBox").addClass("xc-hidden");
        this._$modal.find(".argsSectionBox .argsSection").empty();
    }

    private _submitForm(): void {
        if (!this._dataModel.validateArgs(this._$modal)) {
            return
        }
        let $cols = this._$exportColList.find(".col.checked");
        let columns: ProgCol[] = [];
        for (let i = 0; i < $cols.length; i++) {
            columns.push(this._columns[$cols.eq(i).data("colnum") - 1]);
        }
        let driverArgs: {[key: string]: string} =  {}
        this._dataModel.driverArgs.forEach((arg: ExportDriverArg) => {
            driverArgs[arg.name] = arg.value;
        });

        const txId: number = Transaction.start({
            operation: "export",
            track: true,
        });
        const exportTableName = this._tableName + '_export_' + Authentication.getHashId();
        const driverColumns: XcalarApiExportColumnT[] = columns.map((selectedCol,i) => {
            let col = new XcalarApiExportColumnT();
            col.headerName = selectedCol.getFrontColName();
            col.columnName = selectedCol.getBackColName();
            return col;
        });

        const $bg: JQuery = $("#initialLoadScreen");
        $bg.show();
        XIApi.exportTable(txId, this._tableName, this._selectedDriver,
            driverArgs, driverColumns, exportTableName)
        .then(() => {
            this._closeModal();
            $bg.hide();
            return;
        })
        .fail((err) => {
            StatusBox.show(err.error, this._$modal.find(".confirm"));
            $bg.hide();
            return;
        })
    }
}
