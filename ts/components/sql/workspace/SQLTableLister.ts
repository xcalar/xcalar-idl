class SQLTableLister {
    private static _instance: SQLTableLister;
    
    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private readonly _container: string = "sqlTableListerArea";
    private _attributes: {key: string, text: string}[];
    private _tableInfos: PbTblInfo[];
    private _sortKey: string;
    private _reverseSort: boolean;

    private constructor() {
        this._tableInfos = [];
        this._setupArrtibutes();
        this._initializeMainSection();
        this._addEventListeners();
    }

    /**
     * SQLTableLister.Instance.show
     * @param reset
     */
    public show(reset: boolean): void {
        const $container = this._getContainer();
        // let refresh: boolean = true;
        // if (!$container.hasClass("xc-hidden")) {
        //     // already show
        //     refresh = false;
        // }
        $container.removeClass("xc-hidden");
        if (reset) {
            this._reset();
            this._listTables(false);
        }
    }

    /**
     * SQLTableLister.Instance.close
     */
    public close(): void {
        this._getContainer().addClass("xc-hidden");
    }

    public refresh(): void {
        const $container = this._getContainer();
        if (!$container.hasClass("xc-hidden")) {
            this.show(true);
        }
    }

    /**
     * SQLTableLister.Instance.getAvailableTables
     */
    public getAvailableTables(): PbTblInfo[] {
        return this._getAvailableTables();
    }

    private _reset(): void {
        this._getSearchInput().val("");
        this._getMainContent().empty();
        this._tableInfos = [];
        this._sortKey = null;
        this._reverseSort = null;
    }

    private _setupArrtibutes(): void {
        this._attributes = [{
            key: "name",
            text: CommonTxtTstr.Name
        }, {
            key: "createTime",
            text: CommonTxtTstr.CreateTime,
        }, {
            key: "rows",
            text: CommonTxtTstr.Rows
        }, {
            key: "size",
            text: CommonTxtTstr.Size
        }, {
            key: "status",
            text: CommonTxtTstr.Status
        }];
    }

    private _getContainer(): JQuery {
        return $("#" + this._container);
    }

    private _getTopSection(): JQuery {
        return this._getContainer().find(".topSection");
    }

    private _getMainSection(): JQuery {
        return this._getContainer().find(".mainSection");
    }

    private _getMainContent(): JQuery {
        return this._getMainSection().find(".content");
    }

    private _getSearchInput(): JQuery {
        return this._getTopSection().find(".searchbarArea input");
    }

    private _getTableInfoFromRowEl($row: JQuery): PbTblInfo {
        let index = Number($row.data("index"));
        return this._getTableInfoFromIndex(index);
    } 

    private _getAvailableTables(): PbTblInfo[] {
        let tables: PbTblInfo[] = PTblManager.Instance.getTables();
        tables = tables.filter((table) => {
            if (table.state === PbTblState.BeDataset) {
                return false;
            }
            if (table.name.toUpperCase() !== table.name) {
                return false;
            }
            return true;
        });
        return tables;
    }

    private _getTableInfoFromIndex(index: number): PbTblInfo {
        for (let i = 0; i < this._tableInfos.length; i++) {
            let table = this._tableInfos[i];
            if (table.index === index) {
                return table;
            }
        }
        return null;
    }

    private _listTables(refresh: boolean): XDPromise<void> {
        const deferred: XDDeferred<void> = PromiseHelper.deferred();
        const $content = this._getMainSection().find(".content");
        const promise = deferred.promise();
        this._onLoadingMode();

        let timer = setTimeout(() => {
            xcHelper.showRefreshIcon($content, true, promise);
        }, 800);

        PTblManager.Instance.getTablesAsync(refresh)
        .then(() => {
            this._tableInfos = this._getAvailableTables();
            this._render();
            deferred.resolve();
        })
        .fail(deferred.reject)
        .always(() => {
            clearTimeout(timer);
            this._offLoadingMode();
        });

        return promise;
    }

    private _onLoadingMode(): void {
        this._getContainer().addClass("loading");
    }

    private _offLoadingMode(): void {
        this._getContainer().removeClass("loading");
    }

    private _activateTable($row: JQuery): void {
        if ($row.length === 0) {
            return;
        }

        let tableInfo = this._getTableInfoFromRowEl($row);
        let copyTableInfo = xcHelper.deepCopy(tableInfo);
        copyTableInfo.state = PbTblState.Activating;
        this._replaceRowContent($row, copyTableInfo);

        PTblManager.Instance.activateTables([tableInfo.name])
        .always(() => {
            this._listTables(false);
        });
    }

    private _deactivateTable($row: JQuery): void {
        if ($row.length === 0) {
            return;
        }

        let tableInfo = this._getTableInfoFromRowEl($row);
        let copyTableInfo = xcHelper.deepCopy(tableInfo);
        copyTableInfo.state = PbTblState.Deactivating;
        this._replaceRowContent($row, copyTableInfo);

        PTblManager.Instance.deactivateTables([tableInfo.name])
        .always(() => {
            this._listTables(false);
        });
    }

    private _initializeMainSection(): void {
        const html: HTML =
        '<div class="header">' +
            '<div class="row"></div>' +
        '</div>' +
        '<div class="content"></div>';
        this._getMainSection().html(html);
    }

    private _render(): void {
        this._renderHeader();
        let tableInfos = this._sortTables(this._tableInfos);
        let html: HTML = tableInfos.map((tableInfo) => {
            let row: HTML = 
            `<div class="row" data-index="${tableInfo.index}">` +
                this._renderRowContent(tableInfo) +
            '</div>';
            return row;
        }).join("");

        if (!html) {
            html =
            '<div class="hint">' +
                '<button class="btn btn-submit createTable">' +
                    TblTStr.New +
                '</button>'
            '</div>';
        }

        this._getMainContent().html(html);
        this._filterTables();
        this._updateActions(null);
        this._resizeEvents();
    }

    private _renderHeader(): void {
        let header: HTML = this._attributes.map((attr) => {
            let key: string = attr.key;
            let upIcon = '<i class="icon fa-8 xi-arrow-up"></i>';
            let downIcon = '<i class="icon fa-8 xi-arrow-down"></i>';
            let sortIcon = "";
            if (key === this._sortKey) {
                sortIcon = this._reverseSort ? downIcon : upIcon;
            } else {
                sortIcon = '<span class="sortIconWrap">' +
                                upIcon +
                                downIcon +
                            '</span>';
            }
            let html: HTML =
            `<div class="${key} title" data-key="${key}">` +
                '<div class="label">' +
                    attr.text +
                '</div>' +
                '<div class="sort">' +
                    sortIcon +
                '</div>' +
            "</div>";
            return html;
        }).join("");
        this._getMainSection().find(".header .row").html(header);
    }

    private _renderRowContent(tableInfo: PbTblInfo): HTML {
        let displayInfo: PbTblDisplayInfo = PTblManager.Instance.getTableDisplayInfo(tableInfo);
        let html: HTML = this._attributes.map((attr) => {
            let key: string = xcHelper.escapeHTMLSpecialChar(attr.key);
            let val: string = displayInfo[attr.key];
            let text: string = xcHelper.escapeHTMLSpecialChar(val);
            let title = text;
            if (key === "status") {
                text = this._getStatusCellContent(tableInfo, text);
            }
            let tooltip: string =
            'data-toggle="tooltip" ' +
            'data-container="body" ' +
            'data-title="' + title + '"';
            return `<div class="${key} tooltipOverflow" ${tooltip}>${text}</div>`;
        }).join("");
        return html;
    }

    private _replaceRowContent($row: JQuery, tableInfo: PbTblInfo): void {
        let html = this._renderRowContent(tableInfo);
        $row.html(html);
    }

    private _getStatusCellContent(
        tableInfo: PbTblInfo,
        text: string
    ): HTML {
        let html: HTML = "";
        if (tableInfo.state === PbTblState.Activating) {
            html = this._getInActionHTML(DSTStr.DSActivating);
        } else if (tableInfo.state === PbTblState.Deactivating) {
            html = this._getInActionHTML(DSTStr.DSDeactivating);
        } else {
            let isActive: boolean = tableInfo.active;
            let title = (isActive ? TblTStr.ToDeactivate : TblTStr.ToActivate);
            let action = (isActive ? "deactivate" : "activate");
            html =
            '<span class="' + action + '"' +
            ' data-toggle="tooltip"' +
            ' data-container="body"' +
            ' data-title="' + title + '"' +
            '">' +
                text +
            '</span>';
        }
        return html;
    }

    private _getInActionHTML(text: string): HTML {
        let html: string =
        '<div class="animatedEllipsisWrapper">' +
            '<div class="text">' +
                text +
            '</div>' +
            '<div class="animatedEllipsis staticEllipsis">' +
                '<div>.</div>' +
                '<div>.</div>' +
                '<div>.</div>' +
            '</div>' +
        '</div>';
        return html;
    }

    private _unSelectTableList(): void {
        this._getMainContent().find(".row.selected").removeClass("selected");
    }

    private _selectTableList($row: JQuery): void {
        if ($row.hasClass("selected")) {
            return;
        }
        this._unSelectTableList();
        $row.addClass("selected");

        let tableInfo = this._getTableInfoFromRowEl($row);
        this._updateActions(tableInfo);
    }

    private _updateActions(tableOnFocus: {active: boolean}): void {
        const $section = this._getTopSection();
        const $btnForActive = $section.find(".viewSchema")
        .add($section.find(".deactivate"));
        const $btnForInactive = $section.find(".activate");

        if (!tableOnFocus) {
            // no table
            $btnForActive.addClass("xc-disabled");
            $btnForInactive.addClass("xc-disabled");
        } else if (tableOnFocus.active) {
            // table is active
            $btnForActive.removeClass("xc-disabled");
            $btnForInactive.addClass("xc-disabled");
        } else {
            // table is inactive
            $btnForActive.addClass("xc-disabled");
            $btnForInactive.removeClass("xc-disabled");
        }
    }

    private _filterTables(): void {
        const $input = this._getSearchInput();
        const $rows = this._getMainContent().find(".row");
        let keyword: string = $input.val().trim();
        if (!keyword) {
            $rows.removeClass("xc-hidden");
            return;
        }

        keyword = keyword.toLowerCase();
        $rows.each((_index, el) => {
            const $row = $(el);
            if ($row.find(".name").text().toLowerCase().includes(keyword)) {
                $row.removeClass("xc-hidden");
            } else {
                $row.addClass("xc-hidden");
            }
        });
    }

    private _showSchema(): void {
        const $row = this._getMainContent().find(".row.selected");
        if ($row.length === 0) {
            return;
        }
        const index: number = Number($row.data("index"));
        const tableInfo = this._getTableInfoFromIndex(index);
        SQLResultSpace.Instance.showSchema(tableInfo);
    }

    private _sortAction(sortKey): void {
        if (sortKey !== this._sortKey) {
            this._sortKey = sortKey;
            this._reverseSort = false; // asc sort
        } else if (this._reverseSort === false) {
            this._reverseSort = true; // des sort
        } else {
            this._reverseSort = null; // no sort
            this._sortKey = null;
        }
        let $row: JQuery = this._getMainSection().find(".header .row");
        let rowWidth: number[] = this._getColumnsWidth($row);
        this._render();
        this._resizeColums(rowWidth);
    }

    private _sortTables(tableInfos: PbTblInfo[]): PbTblInfo[] {
        if (this._sortKey == null) {
            return tableInfos;
        }
        let tables = tableInfos.map((table) => table);
        // sort by name first
        tables.sort((a, b) => {
            let aName = a.name.toLowerCase();
            let bName = b.name.toLowerCase();
            return (aName < bName ? -1 : (aName > bName ? 1 : 0));
        });

        let key = this._sortKey;
        if (key === "createTime" ||
            key === "rows" ||
            key === "size"
        ) {
            tables.sort((a, b) => {
                let aVal = a[key];
                let bVal = b[key];
                if (aVal == null && bVal == null) {
                    return 0;
                }
                if (bVal == null) {
                    return 1;
                }
                if (aVal == null) {
                    return -1;
                }
                return aVal - bVal;
            });
        } else if (key === "status") {
            tables.sort((a, b) => {
                let aVal = a.active ? 1 : 0;
                let bVal = b.active ? 1 : 0;
                return aVal - bVal;
            });
        }

        if (this._reverseSort) {
            tables = tables.reverse();
        }
        return tables;
    }

    private _addEventListeners(): void {
        const $mainSection = this._getMainSection();
        $mainSection.find(".header").on("click", ".title .label, .title .sort", (event) => {
            let sortKey = $(event.currentTarget).closest(".title").data("key");
            this._sortAction(sortKey);
        });

        const $mainContent = this._getMainContent();
        $mainContent.on("click", ".row", (event) => {
            this._selectTableList($(event.currentTarget));
        });

        $mainContent.on("click", ".activate", (event) => {
            xcTooltip.hideAll();
            let $row = $(event.currentTarget).closest(".row");
            this._activateTable($row);
        });

        $mainContent.on("click", ".deactivate", (event) => {
            xcTooltip.hideAll();
            let $row = $(event.currentTarget).closest(".row");
            this._deactivateTable($row);
        });

        $mainContent.on("mouseenter", ".tooltipOverflow", function() {
            xcTooltip.auto(this);
        });

        $mainContent.on("click", ".createTable", (event) => {
            $(event.currentTarget).blur();
            MainMenu.openPanel("datastorePanel", "sourceTblButton");
            DSForm.show(true);
        });

        const $topSection = this._getTopSection();
        $topSection.find(".refresh").click(() => {
            this._listTables(true);
        });

        $topSection.find(".searchbarArea input").on("input", () => {
            this._filterTables();
        });

        $topSection.find(".viewSchema").click(() => {
            this._showSchema();
        });
    }

    private _resizeEvents(): void {
        const $mainSection = this._getMainSection();
        $mainSection.find(".row").each((_i, el) => {
            let $row = $(el);
            $row.find("> div").each((index, el) => {
                if (index !== 0) {
                    this._addResizeEvent($(el));
                }
            });
        });
    }

    private _addResizeEvent($section: JQuery): void {
        // resizable left part of a column
        let $prev: JQuery = null;
        const minWidth: number = 80;
        let totalWidth: number = null;

        $section.resizable({
            handles: "w",
            minWidth: minWidth,
            alsoResize: $prev,
            start: (_event, _ui) => {
                $prev = $section.prev();
                totalWidth = $section.outerWidth() + $prev.outerWidth();
                this._getMainSection().addClass("resizing");
            },
            resize: (_event, ui) => {
                let left: number = ui.position.left;
                let sectionW: number = $section.outerWidth() - left;
                let prevWidth: number = totalWidth - sectionW;
                if (sectionW <= minWidth) {
                    sectionW = minWidth;
                    prevWidth = totalWidth - sectionW;
                } else if (prevWidth <= minWidth) {
                    prevWidth = minWidth;
                    sectionW = totalWidth - prevWidth;
                }

                $prev.outerWidth(prevWidth);
                $section.outerWidth(sectionW);
                $section.css("left", 0);

                let rowWidth: number[] = this._getColumnsWidth($section.closest(".row"));
                this._resizeColums(rowWidth);
            },
            stop: () => {
                this._getMainSection().removeClass("resizing");
            }
        });
    }

    private _getColumnsWidth($row: JQuery): number[] | null {
        let $columns: JQuery = $row.find("> div");
        if ($columns.length === 0) {
            return null;
        }
        let rowWidth: number[] = [];
        $columns.each((_index, el) => {
            rowWidth.push($(el).outerWidth());
        });
        return rowWidth;
    }

    private _resizeColums(rowWidth: number[] | null): void {
        if (rowWidth == null) {
            return;
        }
        let $section = this._getMainSection();
        $section.find(".row").each((_inex, el) => {
            let $row = $(el);
            $row.find("> div").each((index, el) => {
                $(el).outerWidth(rowWidth[index]);
            });
        });
    }
}