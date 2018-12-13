class DagTable {
    private static _instance: DagTable;
    private readonly _container: string = "dagViewTableArea";
    private _searchBar: DagTableSearchBar;

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    // map key is dataflow tab id
    private _viewers: Map<string, XcViewer>;
    private _currentViewer: XcViewer;

    private constructor() {
        this._addEventListeners();
        this._searchBar = new DagTableSearchBar(this._container);
        this._viewers = new Map();
    }

    public previewTable(tabId: string, dagNode: DagNode): XDPromise<void> {
        const table: TableMeta = XcTableViewer.getTableFromDagNode(dagNode);
        const viewer: XcTableViewer = new XcTableViewer(tabId, dagNode, table);
        this._viewers.set(tabId, viewer);
        return this._show(viewer);
    }

    public previewDataset(dsId: string) {
        const viewer: XcDatasetViewer = new XcDatasetViewer(DS.getDSObj(dsId));
        return this._show(viewer);
    }

    public switchTab(tabId: string): void {
        if (this._currentViewer instanceof XcDatasetViewer) {
            // dataset viewer has higher priority
            return;
        }

        const viewer = this._viewers.get(tabId);
        if (viewer == null) {
            this._reset();
        } else {
            this._show(viewer);
        }
    }

    public replaceTable(table: TableMeta): XDPromise<void> {
        if (this._currentViewer instanceof XcDatasetViewer) {
            return PromiseHelper.resolve(); // invalid case
        }
        const currentViewer: XcTableViewer = <XcTableViewer>this._currentViewer;
        const viewer = currentViewer.replace(table);
        if (this._isSameViewer(viewer)) {
            return PromiseHelper.resolve();
        }
        this._viewers.set(currentViewer.getDataflowTabId(), viewer);
        return this._show(viewer);
    }

    public getTable(): string {
        return this._currentViewer ? this._currentViewer.getId() : null;
    }

    public getView(): JQuery {
        return this._currentViewer ? this._currentViewer.getView() : null;
    }

    public getBindNode(): DagNode {
        if (this._currentViewer != null && this._currentViewer instanceof XcTableViewer) {
            return this._currentViewer.getNode();
        } else {
            return null;
        }
    }

    public getBindNodeId(): DagNodeId {
        if (this._currentViewer != null && this._currentViewer instanceof XcTableViewer) {
            return this._currentViewer.getNodeId();
        } else {
            return null;
        }
    }

    public getSearchBar(): DagTableSearchBar {
        return this._searchBar;
    }


    public closeDatasetPreview(): void {
        if (this._currentViewer instanceof XcDatasetViewer) {
            this.close();
        }
    }

    /**
     * close the preview
     */
    public close(): void {
        if (this._currentViewer instanceof XcTableViewer) {
            this._viewers.delete(this._currentViewer.getDataflowTabId());
        }
        this._getContainer().addClass("xc-hidden").parent().removeClass("tableViewMode").addClass("noPreviewTable");
        this._reset();
        Log.updateUndoRedoState(); // update the state to skip table related undo/redo
    }

    public isTableFromTab(tabId: string): boolean {
        return this._currentViewer instanceof XcTableViewer &&
                this._currentViewer.getDataflowTabId() === tabId;
    }

    public updateTableName(tabId: string): void {
        const viewer = this._viewers.get(tabId);
        if (viewer === this._currentViewer) {
            this._renderTableNameArea(viewer);
        }
    }

    private _show(viewer: XcViewer): XDPromise<void> {
        if (this._isSameViewer(viewer)) {
            return PromiseHelper.resolve();
        }

        this._reset();
        this._currentViewer = viewer;
        return this._showViewer();
    }

    private _showViewer(): XDPromise<void> {
        const deferred: XDDeferred<void> = PromiseHelper.deferred();
        const $container: JQuery = this._getContainer();
        $container.parent().removeClass("noPreviewTable").addClass("tableViewMode");
        $container.removeClass("xc-hidden").addClass("loading");
        const viewer = this._currentViewer;
        if (viewer instanceof XcDatasetViewer) {
            $container.addClass("dataset");
        } else {
            $container.removeClass("dataset");
        }
        this._renderTableNameArea(viewer);
        viewer.render(this._getContainer())
        .then(() => {
            $container.removeClass("loading");
            TblFunc.alignScrollBar($container.find(".dataTable").eq(0));
            deferred.resolve();
        })
        .fail((error) => {
            this._error(error);
            deferred.reject(error);
        });

        const promise = deferred.promise();
        xcHelper.showRefreshIcon($container, true, promise);
        return promise;
    }

    private _addEventListeners(): void {
        const $container: JQuery = this._getContainer();
        $container.on("click", ".close", () => {
            this.close();
        });

        const $tableBar = $container.find(".tableBar");
        $tableBar.on("click", ".tableMenu", (event) => {
            const options: xcHelper.DropdownOptions = {
                classes: "tableMenu",
                tableId: xcHelper.getTableId(this.getTable())
            };
            const tableMenu: TableMenu = TableComponent.getMenu().getTableMenu();
            tableMenu.setUnavailableClasses();
            xcHelper.dropdownOpen($(event.target), $("#tableMenu"), options);
        });
    }

    private _getContainer(): JQuery {
        return $("#" + this._container);
    }

    private _reset(): void {
        this._resetViewer();
        this._clearTableNameArea();
        const $container: JQuery = this._getContainer();
        $container.removeClass("loading").removeClass("error");
        $container.find(".errorSection").empty();
    }

    private _resetViewer(): void {
        if (this._currentViewer != null) {
            this._currentViewer.clear();
            this._currentViewer = null;
        }
    }

    private _error(error: any): void {
        const $container: JQuery = this._getContainer();
        $container.removeClass("loading").addClass("error");
        const errStr: string = (typeof error === "string") ?
        error : JSON.stringify(error);
        $container.find(".errorSection").text(errStr);
    }

    private _isSameViewer(viewer: XcViewer): boolean {
        const currentViewer = this._currentViewer;
        if (currentViewer == null) {
            return false;
        }
        if (currentViewer.getId() != viewer.getId()) {
            return false;
        }

        if (viewer instanceof XcTableViewer && currentViewer instanceof XcTableViewer) {
            if (viewer.getDataflowTabId() !== currentViewer.getDataflowTabId()) {
                return false;
            }
            if (viewer.getNodeId() !== currentViewer.getNodeId()) {
                return false;
            }
        }
        return true;
    }

    private _getTableNameArea(): JQuery {
        return this._getContainer().find(".tableNameArea");
    }

    private _renderTableNameArea(viewer: XcViewer): void {
        const $nameArea: JQuery = this._getTableNameArea();
        $nameArea.removeClass("xc-hidden");
        const type: string = viewer instanceof XcDatasetViewer ?
        "Dataset" : "Result";
        $nameArea.find(".name").text(type + ": " + viewer.getTitle());
    }

    private _clearTableNameArea(): void {
        const $nameArea = this._getTableNameArea();
        $nameArea.addClass("xc-hidden");
        $nameArea.find(".name").empty();
    }
}