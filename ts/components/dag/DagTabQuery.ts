class DagTabQuery extends DagTabProgress {
    public static readonly PATH = "Abandoned executions/";
    private static _abandonedQueryPrefix;
    private _createdTime: number = null;
    private _isSDK: boolean;

    constructor(options: {
        id: string,
        name: string,
        queryName: string
    }) {
        super(options);
        this._queryName = options.queryName;
        if (this._queryName.startsWith(DagTabQuery.abandonedQueryPrefix)) {
            let timeStr: string = this._queryName.slice(this._queryName.lastIndexOf("#t_") + 3);
            timeStr = timeStr.slice(0, timeStr.indexOf("_"));
            if (timeStr.length) {
                let time = parseInt(timeStr);
                if (!isNaN(time)) {
                    this._createdTime = time;
                }
            }
            this._isSDK = true;
        } else {
            this._isSDK = false;
        }
    }

    public static get abandonedQueryPrefix() {
        return this._abandonedQueryPrefix || (this._abandonedQueryPrefix = this._getAbandonedQueryPrefix())
    }

    private static _getAbandonedQueryPrefix() {
        const activeWKBNK: string = WorkbookManager.getActiveWKBK();
        const workbook: WKBK = WorkbookManager.getWorkbook(activeWKBNK);
        return "table_DF2_" + workbook.sessionId + "_";
    }

    public getPath(): string {
        return DagTabQuery.PATH + this.getName();
    }

    public getCreatedTime(): number {
        return this._createdTime;
    }

    public isSDK(): boolean {
        return this._isSDK;
    }

    public load(): XDPromise<void> {
        const deferred: XDDeferred<void> = PromiseHelper.deferred();
        this._isDoneExecuting = false;

        XcalarQueryState(this._queryName)
        .then((graph) => {
            this._dagGraph = this._constructGraphFromQuery(graph.queryGraph.node);
            this._dagGraph.startExecution(graph.queryGraph.node, null);
            this.setGraph(this._dagGraph);
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    }

    public delete(): XDPromise<any> {
        const deferred = PromiseHelper.deferred();
        this._isDoneExecuting = false;
        this._isFocused = false;
        this._isDeleted = true;
        this._queryCheckId++;

        XcalarQueryDelete(this._queryName)
        .then(deferred.resolve)
        .fail((error) => {
            this._isDeleted = false;
            deferred.reject(error);
        });

        return deferred.promise();
    }
}