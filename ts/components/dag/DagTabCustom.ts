class DagTabCustom extends DagTab {
    private _customNode: DagNodeCustom;

    constructor(options: {
        id: string,
        name: string,
        customNode: DagNodeCustom
    }) {
        super(options);
        this._customNode = options.customNode;
    }

    /**
     * Saves this Tab in the kvStore
     */
    public save(): XDPromise<void> {
        return DagTabManager.Instance.saveParentTab(this.getId());
    }

    /**
     * gets the DagGraph for this tab
     * @returns {DagGraph}
     */
    public getGraph(): DagGraph {
        return this._customNode.getSubGraph();
    }

    // do nothing
    public load(): XDPromise<void> {
        return PromiseHelper.resolve();
    }

    // do nothing
    public delete(): XDPromise<void> {
        return PromiseHelper.resolve();
    }

    // do nothing
    public download(): XDPromise<void> {
        return PromiseHelper.reject({error: "Not support"});
    }

    // do nothing
    public upload(): XDPromise<DagTab> {
        return PromiseHelper.reject({error: "Not support"});
    }
}