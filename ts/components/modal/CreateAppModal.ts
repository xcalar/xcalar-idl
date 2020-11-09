class CreateAppModal {
    private static _instance: CreateAppModal;
    private _modalHelper: ModalHelper;
    private _graphMap: Map<number, Set<DagNodeModule>>
    private _isOpen =false;
    private _cachedTabs: DagTabUser[];

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private constructor() {
        this._modalHelper = new ModalHelper(this._getModal(), {
            noBackground: true,
            offscreenDraggable: true
        });
        this._addEventListeners();
        this._cachedTabs = [];
    }

    /**
     * CreateAppModal.Instance.show
     */
    public async show(activeTab: DagTab): Promise<void> {
        if (this._isOpen) {
            return;
        }
        this._modalHelper.setup();
        this._isOpen = true;

        const timer = setTimeout(() => {
            this._getModal().addClass("load");
        }, 500);
        await this._loadUnopenedTabs();
        let { disjointGraphs } = DagViewManager.Instance.getDisjointGraphs();
        disjointGraphs = this._filterDisjointGraphs(activeTab, disjointGraphs);
        this._renderGraphList(disjointGraphs);
        let index = 0;
        this._graphMap = new Map();
        disjointGraphs.forEach((moduleNodes) => {
            this._graphMap.set(index, moduleNodes);
            index++;
        });
        clearTimeout(timer);
        this._getModal().removeClass("load");
        if (index === 1) {
            // only one graph exist
            this._getModal().find(".graphList .checkbox").eq(0).click();
        }
    }

    private _filterDisjointGraphs(
        activeTab: DagTab,
        disjointGraphs: Set<Set<DagNodeModule>>
    ): Set<Set<DagNodeModule>> {
        if (activeTab == null) {
            return;
        }
        const filteredSet: Set<Set<DagNodeModule>> = new Set();
        disjointGraphs.forEach((graphSet) => {
            let isInTab = false;
            graphSet.forEach(( dagNode: DagNodeModule ) => {
                if (dagNode.getTabId() === activeTab.getId()) {
                    isInTab = true; 
                }
            });

            if (isInTab) {
                filteredSet.add(graphSet);
            }
        });

        return filteredSet;
    }

    private _getModal() {
        return $("#createAppModal");
    }

    private _close() {
        this._reset();
        this._modalHelper.clear();
        this._isOpen = false;
        this._cachedTabs.forEach((dagTab) => DagTabManager.Instance.removeTabCache(dagTab));
        this._cachedTabs = [];
        this._getModal().removeClass("load");
    }

    private _reset() {
        let $modal = this._getModal();
        $modal.find(".graphList").empty();
        $modal.find(".newName").val("");
        this._graphMap = null;
    }

    private _loadUnopenedTabs(): XDPromise<void> {
        const promises = [];
        DagList.Instance.getAllDags().forEach((dagTab) => {
            if (dagTab.getType() !== DagTabType.User) {
                return;
            }
            if (dagTab.getApp() !== null) {
                return;
            }
            if (DagTabManager.Instance.getTabById(dagTab.getId()) == null) {
                this._cachedTabs.push(<DagTabUser>dagTab);
                // when tab is closed it may still have the graph
                if (dagTab.getGraph() == null) {
                    promises.push(dagTab.load());
                }
            }
        });

        const deferred: XDDeferred<void> = PromiseHelper.deferred();
        PromiseHelper.when(...promises)
        .then(() => {
            this._cachedTabs.forEach((dagTab) => DagTabManager.Instance.addTabCache(dagTab));
            deferred.resolve();
        })
        .fail(() => {
            deferred.resolve(); // still resolve it
        });

        return deferred.promise();
    }

    private _addEventListeners() {
        let $modal = this._getModal();
        $modal.on("click", ".close, .cancel", () => {
            this._close();
        });

        $modal.on("click", ".listWrap .listInfo", (event) => {
            const $list = $(event.currentTarget).closest(".listWrap");
            $list.toggleClass("active");
        });

        $modal.on("click", ".graphList .checkbox", (event) => {
            const $checkbox = $(event.target).closest(".checkbox");
            if ($checkbox.hasClass("checked")) {
                $checkbox.removeClass("checked");
            } else {
                $modal.find(".graphList .checkbox").removeClass("checked");
                $checkbox.addClass("checked");
            }
        });

        $modal.on("click", ".confirm", () => {
            this._submit();
        });

        $modal.on("click", ".fn", (event) => {
            const tabId = $(event.target).closest(".fn").data("tabid");
            const dagTab = DagList.Instance.getDagTabById(tabId);
            DagTabManager.Instance.loadTab(dagTab);
        });
    }

    private _renderGraphList(disjointGraphs) {
        let html: HTML = "";
        let index = 0;
        disjointGraphs.forEach((moduleNodes) => {
            html += `<div class="row" data-index=${index}>
                        <div class="checkbox">
                            <i class="icon xi-ckbox-empty"></i>
                            <i class="icon xi-ckbox-selected"></i>
                        </div>
                        <div class="graphInfo listWrap xc-expand-list active">
                            <div class="graphName listInfo">
                                <span class="text">Logical Plan ${index + 1}</span>
                                <span class="expand">
                                    <i class="icon xi-down fa-12"></i>
                                </span>
                            </div>
                            <ul class="graphSubList">`;

            // list all modules that are part of the disjointGraph
            moduleNodes.forEach((moduleNode) => {
                const tabId = moduleNode.getTabId();
                const fnName = moduleNode.getFnName();
                html += `<li class="fn" data-tabid="${tabId}">
                            <i class="icon xi-show"></i>
                            <div class="name">${fnName}<div>
                        </li>`;
            });
            html += `</ul></div></div>`;
            index++;
        });
        if (!html) {
            html = `<div class="emptyMsg">${AppTStr.EmptyMsg}</div>`;
        }
        this._getModal().find(".graphList").html(html);
    }

    private _submit() {
        const $modal = this._getModal();
        const $input = $modal.find(".newName");
        const $checkbox = $modal.find(".graphList .checkbox.checked");
        if (!$checkbox.length) {
            StatusBox.show(AppTStr.NoLogicalPlan, $modal.find(".modalMain"));
            return false;
        }

        const newName: string = $input.val().trim();

        const error: string = AppList.Instance.validateName(newName);
        if (error) {
            StatusBox.show(error, $input);
            return false;
        }
        const moduleNodes = this._graphMap.get($checkbox.closest(".row").data("index"));
        const appId = AppList.Instance.createApp(newName, moduleNodes);
        if (appId != null) {
            AppList.Instance.download(appId);
        } else {
            xcUIHelper.showFail(AppTStr.CreateFailed);
        }
        this._close();
        return true;
    }
}