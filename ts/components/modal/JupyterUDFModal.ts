class JupyterUDFModal {
    private static _instance: JupyterUDFModal;
    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private _modalHelper:  ModalHelper;
    private _cols: string[];

    private constructor() {
        this._reset();

        this._modalHelper = new ModalHelper(this._getModal(), {
            noBackground: true,
            beforeResize: function() {
                $("#container").addClass("menuResizing");
            },
            afterResize: function() {
                $("#container").removeClass("menuResizing");
            },
        });
        this._addEventListeners();
    }

    /**
     * JupyterUDFModal.Instance.show
     * @param type
     * @param params
     */
    public show(type: string, params?: {target?: string, filePath?: string}) {
        let $modal = this._getModal();
        if ($modal.is(":visible")) {
            // in case modal show is triggered when
            // it's already open
            return;
        }
        params = params || {};
        $modal.removeClass("type-map type-newImport");
        $modal.addClass("type-" + type);
        this._modalHelper.setup();

        let $activeSection = $modal.find(".form:visible");
        if (params.target) {
            $activeSection.find(".target").val(params.target);
        }
        if (params.filePath) {
            $activeSection.find(".url").val(params.filePath);
        }

        // focus on first none empty input
        $activeSection.find(".arg").filter(function() {
            return !$(this).val();
        }).eq(0).focus();
    }

    /**
     * JupyterUDFModal.Instance.refreshTarget
     * @param targetList
     */
    public refreshTarget(targetList: HTML): void {
        this._getTargetList().find("ul").html(targetList);
    }

    private _getModal(): JQuery {
        return $("#jupyterUDFTemplateModal");
    }

    private _getTargetList(): JQuery {
        return this._getModal().find(".targetList");
    }

    private _reset(): void {
        let $modal = this._getModal();
        $modal.find(".arg").val("").removeData("tablename");
        $modal.find(".columnsList .arg").val("");
        $modal.find(".columnsList li.selecting").removeClass("selecting");
        $modal.find(".columnsList ul").empty();
        this._cols = [];
    }

    private _close(): void {
        this._modalHelper.clear();
        this._reset();
    }

    private _submitForm(): void {
        let isValid: boolean;
        let $modal: JQuery = this._getModal();
        let $args: JQuery = $modal.find(".arg:visible");
        $args.each(function() {
            let $input = $(this);
            isValid = xcHelper.validate({
                "$ele": $input
            });
            if (!isValid) {
                return false;
            }
        });
        if (!isValid) {
            return;
        }

        let moduleName: string = $modal.find(".moduleName:visible").val();
        let isModuleNameValid = xcHelper.checkNamePattern(PatternCategory.UDF, PatternAction.Check, moduleName);
        if (!isModuleNameValid) {
            StatusBox.show(UDFTStr.InValidName, $modal.find(".moduleName:visible"), true);
            return;
        }

        let fnName: string = $modal.find(".fnName:visible").val();
        let isFnNameValid = xcHelper.checkNamePattern(PatternCategory.UDFFn, PatternAction.Check, fnName);
        if (!isFnNameValid) {
            StatusBox.show(UDFTStr.InValidFnName, $modal.find(".fnName:visible"), true);
            return;
        }

        if ($modal.hasClass("type-map")) {
            let columns = $modal.find(".columns").val().split(",");
            columns = columns.map((colName) => colName.trim());
            let tableName = $modal.find(".tableName:visible").data("tablename");
            let table = gTables[xcHelper.getTableId(tableName)];
            JupyterPanel.appendStub("basicUDF", {
                moduleName: $modal.find(".moduleName:visible").val(),
                fnName: fnName,
                tableName: tableName,
                columns: columns,
                allCols: table.getColNameList(),
                includeStub: true
            });
        } else if ($modal.hasClass("type-newImport")) {
            JupyterPanel.appendStub("importUDF", {
                fnName: fnName,
                target: $modal.find(".target:visible").val(),
                url: $modal.find(".url:visible").val(),
                moduleName: $modal.find(".moduleName:visible").val(),
                includeStub: true,
            });
        }

        this._close();
    }

    private _addEventListeners(): void {
        let $modal = this._getModal();
        $modal.on("click", ".close, .cancel", () => {
            this._close();
        });

        $modal.on("click", ".confirm", () => {
            this._submitForm();
        });

        $modal.on("mouseenter", ".tooltipOverflow", function() {
            xcTooltip.auto(this);
        });

        // setup table list
        new MenuHelper($modal.find(".tableList"), {
            "onOpen": () => {
                let tableLis = this._getTableList();
                $modal.find(".tableList").find("ul").html(tableLis);
                let tableName = $modal.find(".tableList .arg").data("tablename");
                $modal.find(".tableList").find('li').filter(function() {
                    return ($(this).data("tablename") === tableName);
                }).addClass('selected');
            },
            "onSelect": ($li) => {
                let val = $li.text();
                let tableName = $li.data("tablename");
                if (tableName ===  $modal.find(".tableList .arg").data("tablename")) {
                    return;
                }
                $modal.find(".tableList .arg").val(val);
                $modal.find(".tableList .arg").data('tablename', tableName);
                $modal.find(".columnsList .arg").val("");
                $modal.find(".columnsList li.selecting").removeClass("selecting");
                this._cols = [];
                let table = gTables[xcHelper.getTableId(tableName)];
                let progCols = table.getAllCols(true);
                let html = "";
                for (let i = 0; i < progCols.length; i++) {
                    if (progCols[i].type === ColumnType.array ||
                        progCols[i].type === ColumnType.object) {
                        html += '<li data-toggle="tooltip" ' +
                                'data-container="body" ' +
                                'title="Cannot directly operate on objects ' +
                                'or arrays" class="unavailable">' +
                                xcStringHelper.escapeHTMLSpecialChar(
                                        progCols[i].getBackColName()) + "</li>";
                    } else {
                        html += "<li>" + xcStringHelper.escapeHTMLSpecialChar(
                                    progCols[i].getBackColName()) + "</li>";
                    }
                }
                $modal.find(".columnsList ul").html(html);
            }
        }).setupListeners();

        // set up column list
        new MenuHelper($modal.find(".columnsList"), {
            "onSelect": ($li) => {
                if ($li.hasClass("unavailable")) {
                    return true;
                }
                let val: string = $li.text();
                let cols = this._cols;
                if ($li.hasClass("selecting")) {
                    cols.splice(cols.indexOf(val), 1);
                } else {
                    cols.push(val);
                }
                $li.toggleClass("selecting");
                let vals: string = cols.join(", ");
                $modal.find(".columnsList .arg").val(vals);
                return true;
            }
        }).setupListeners();

        // set up target list
        new MenuHelper(this._getTargetList(), {
            "onSelect": ($li) => {
                let target = $li.text();
                this._getTargetList().find(".target").val(target);
            }
        }).setupListeners();
    }

    private _getTableList(): HTML {
        let tableList: HTML = "";
        let activeWKBNK: string = WorkbookManager.getActiveWKBK();
        let workbook: WKBK = WorkbookManager.getWorkbook(activeWKBNK);
        let dfTablePrefix: string = "table_DF2_" + workbook.sessionId + "_";
        let sqlTablePrefix: string = "table_SQLFunc_" + workbook.sessionId + "_";
        let tableInfos = [];

        for (let tableId in gTables) {
            let table = gTables[tableId];
            let tableName = table.getName();
            let isSql = false;
            if (!tableName.startsWith(dfTablePrefix)) {
                if (tableName.startsWith(sqlTablePrefix)) {
                    isSql = true;
                } else {
                    continue;
                }
            }
            let displayName = tableName;
            let displayNameHtml = displayName;
            let tableNamePart;
            if (isSql) {
                tableNamePart = tableName.slice(tableName.indexOf("SQLFunc_"));
            } else {
                tableNamePart = tableName.slice(tableName.indexOf("DF2_"));
            }
            let dagPartIndex = tableNamePart.indexOf("_dag_");
            if (dagPartIndex === -1) {
                continue;
            }
            let tabId = tableNamePart.slice(0, dagPartIndex);

            let dagListTab = DagList.Instance.getDagTabById(tabId);
            if (dagListTab) {
                displayNameHtml = dagListTab.getName();
                displayName = displayNameHtml;
                let dagTab = DagTabManager.Instance.getTabById(tabId);
                if (dagTab) {
                    let nodePart = tableNamePart.slice(dagPartIndex + 1);
                    let hashIndex = nodePart.indexOf("#");
                    let graph = dagTab.getGraph();
                    if (graph && hashIndex > -1) {
                        let nodeId = nodePart.slice(0, hashIndex);
                        let node = graph.getNode(nodeId);
                        if (node) {
                            displayNameHtml += " (" + node.getDisplayNodeType() + ")";
                            let nodeTitle = node.getTitle();
                            if (nodeTitle) {
                                displayNameHtml += " - " + nodeTitle;
                            }
                        }
                    }
                    displayName = displayNameHtml;
                } else {
                    displayNameHtml += '<span class="inactiveDF"> (inactive dataflow) </span>' + tableName;
                    displayName += " (inactive dataflow) " + tableName;
                }

            } else {
                continue;
            }
            tableInfos.push({
                displayName: displayName,
                displayNameHtml: displayNameHtml,
                displayNameLower: displayName.toLowerCase(),
                tableId: tableId,
                tableName: tableName
            });
        }
        tableInfos.sort((a, b) => {
            return (a.displayNameLower < b.displayNameLower) ? -1 : (a.displayNameLower !== b.displayNameLower ? 1 : 0);
        });
        tableInfos.forEach((tableInfo) => {
            tableList +=
            '<li class="tooltipOverflow"' +
            ' data-original-title="' + tableInfo.displayName + '"' +
            ' data-toggle="tooltip"' +
            ' data-container="body" ' +
            ' data-id="' + tableInfo.tableId + '" data-tablename="' + tableInfo.tableName + '">' +
                tableInfo.displayNameHtml +
            '</li>';
        });

        return tableList;
    }
}