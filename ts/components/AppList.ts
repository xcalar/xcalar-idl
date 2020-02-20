class AppList extends Durable {
    private static _instance: AppList;
    private static _uid: XcUID;

    public static generateId(): string {
        this._uid = this._uid || new XcUID("App");
        return this._uid.gen();
    }

    public static get Instance() {
        return this._instance || (this._instance = new AppList());
    }

    private _apps: AppDurable[];

    private constructor() {
        super(null);
        this._apps = [];
    }

    /**
     * AppList.Instance.list
     */
    public list(): AppDurable[] {
        return this._apps;
    }

    /**
     * AppList.Instance.restore
     */
    public restore(): Promise<void> {
        return this._restore();
    }

    /**
     * AppList.Instance.createApp
     */
    public createApp(name: string,moduleNodes: Set<DagNodeModule>): boolean {
        return this._createApp(name, moduleNodes);
    }

    /**
     * AppList.Instance.delete
     */
    public delete(appId: string): void {
        const app: AppDurable = this._getAppById(appId);
        if (app == null) {
            return;
        }
        const msg = `Are you sure you want to delete app "${app.name}"?`;
        Alert.show({
            title: "Delete App",
            msg,
            onConfirm: () => {
                this._deleteApp(app.id);
            }
        });
    }

    /**
     * AppList.Instance.getAppPath
     * @param appId
     * @param name
     */
    public getAppPath(appId: string, name: string): string {
        for (let app of this._apps) {
            if (app.id === appId) {
                return `/${app.name}/${name}`;
            }
        }
        return name;
    }

    /**
     * AppList.Instance.getValidName
     * @param name
     */
    public getValidName(name: string | null): string {
        let cnt = 0;
        let validName = name;
        if (name == null) {
            name = "app";
            cnt = 1;
            validName = name + cnt;
        }
        let set: Set<string> = new Set();
        for (let app of this._apps) {
            set.add(app.name);
        }
        while (set.has(validName)) {
            cnt++;
            validName = name + cnt;
        }
        return validName;
    }

    /**
     * AppList.Instance.validateName
     * @param name
     */
    public validateName(name): string {
        if (!name) {
            return ErrTStr.NoEmpty;
        }

        for (let app of this._apps) {
            if (name === app.name) {
                return "App name already in use.";
            }
        }

        const category = PatternCategory.Dataflow;
        if (!xcHelper.checkNamePattern(category, PatternAction.Check, name)) {
            return ErrTStr.DFNameIllegal;
        }
        return null;
    }

    public serialize(): string {
        return JSON.stringify(this._getDurable());
    }

    protected _getDurable(): AppListDurable {
        return {
            apps: this._apps
        };
    }

    private async _restore(): Promise<void> {
        const res = await this._getKVStore().getAndParse()
        if (res != null) {
            this._apps = res.apps;
        }
    }

    private async _save(): Promise<void> {
        const jsonStr = this.serialize();
        return this._getKVStore().put(jsonStr, true);
    }

    private _has(name: string): boolean {
        for (let app of this._apps) {
            if (app.name === name) {
                return true;
            }
        }
        return false;
    }

    private _getAppById(id: string): AppDurable | null {
        for (let app of this._apps) {
            if (app.id === id) {
                return app;
            }
        }
        return null;
    }

    private _getKVStore(): KVStore {
        const key: string = KVStore.getKey("gAppListKey");
        return new KVStore(key, gKVScope.WKBK);
    }

    private _deleteApp(appId: string): void {
        DagList.Instance.deleteDataflowsByApp(appId);
        SQLSnippet.Instance.deleteByApp(appId);
        for (let i = 0; i < this._apps.length; i++) {
            if (this._apps[i].id === appId) {
                this._apps.splice(i, 1);
                this._save();
                break;
            }
        }
        this._refreshMenuList();
    }

    private _refreshMenuList(): void {
        DagList.Instance.refreshMenuList(ResourceMenu.KEY.App);
    }

    private _createApp(name: string, moduleNodes: Set<DagNodeModule>): boolean {
        if (this._has(name)) {
            return;
        }
        let appId: string = null
        try {
            appId = this._newApp(name);
            const moduleNodesInApp = this._moveModulesToApp(appId, moduleNodes);
            this._createMainTab(appId, moduleNodesInApp);
            this._save();
            this._refreshMenuList();
            return true;
        } catch (e) {
            console.error(e);
            this._deleteApp(appId);
            return false;
        }
    }

    private _newApp(name): string {
        const id: string = AppList.generateId();
        this._apps.push({
            id,
            name
        });
        return id;
    }

    private _moveModulesToApp(appId: string, moduleNodes: Set<DagNodeModule>): Set<DagNodeModule> {
        const tabToModuleMap: Map<string, DagNodeModule[]> = this._getTabToModuleMap(moduleNodes);
        const {idToTabMap, oldIdToNewIdMap} = this._cloneTabs(appId, tabToModuleMap);
        tabToModuleMap.forEach((modules, oldTabId) => {
            const tabId = oldIdToNewIdMap.get(oldTabId);
            const tab = idToTabMap.get(tabId);
            return this._removeUnusedFunctionInTab(tab, modules);
        });
        idToTabMap.forEach((tab) => this._updateLinkingInClonedTab(tab, oldIdToNewIdMap));
        const newModuleSet: Set<DagNodeModule> = new Set();
        tabToModuleMap.forEach((oldModules, oldTabId) => {
            const tabId = oldIdToNewIdMap.get(oldTabId);
            const tab = idToTabMap.get(tabId);
            const newModules = this._getClonedNodeModules(tab, oldModules);
            newModules.forEach((newModule) => newModuleSet.add(newModule));
        });
        this._saveClonedTab(idToTabMap);
        return newModuleSet;
    }

    private _cloneTabs(appId:string, tabMap: Map<string, any>): {
        idToTabMap: Map<string, DagTabUser>,
        oldIdToNewIdMap: Map<string, string>,
    } {
        const idToTabMap: Map<string, DagTabUser> = new Map();
        const oldIdToNewIdMap = new Map();
        tabMap.forEach((_v, tabId) => {
            const tab: DagTabUser = <DagTabUser>DagList.Instance.getDagTabById(tabId);
            // XXX a strong assumption may need to fix later
            if (tab == null || tab.getType() !== DagTabType.User) {
                throw new Error("Invalid module to clone");
            }
            const clonedTab = tab.clone();
            clonedTab.setApp(appId);
            oldIdToNewIdMap.set(tabId, clonedTab.getId());
            idToTabMap.set(clonedTab.getId(), clonedTab);
        });

        return {
            idToTabMap,
            oldIdToNewIdMap
        }
    }

    private _removeUnusedFunctionInTab(
        tab: DagTabUser,
        usedModules: DagNodeModule[]
    ): void {
        const graph = tab.getGraph();
        // use module head to mark all used node
        const usedNode: Set<string> = new Set();
        usedModules.forEach((moduleNode) => {
            const headNode: DagNodeIn = moduleNode.headNode;
            const nodes = graph.getConnectedNodesFromHead(headNode.getId());
            nodes.forEach((nodeId) => usedNode.add(nodeId));
        });
        // figue out unused node
        const unusedNode: Set<string> = new Set();
        graph.getAllNodes().forEach((node) => {
            const nodeId = node.getId();
            if (!usedNode.has(nodeId)) {
                unusedNode.add(nodeId);
            }
        });
        // remove unused node
        unusedNode.forEach((nodeId) => {
            graph.removeNode(nodeId, false, false);
        });
    }

    private _updateLinkingInClonedTab(
        tab: DagTabUser,
        oldIdToNewIdMap: Map<string, string>
    ): void {
        const graph = tab.getGraph();
        graph.getAllNodes().forEach((node) => {
            if (node instanceof DagNodeDFIn) {
                const param = <DagNodeDFInInputStruct>node.getParam();
                if (param.dataflowId !== DagNodeDFIn.SELF_ID) {
                    const newDataflowId = oldIdToNewIdMap.get(param.dataflowId);
                    node.setParam({
                        ...param,
                        dataflowId: newDataflowId
                    });
                }
            }
        });
    }

    // XXX As we already remove unused nodes,
    // if the logic is correct, it can just return all exisiting modules
    // and the result should be correct
    private _getClonedNodeModules(
        tab: DagTabUser,
        oldModules: DagNodeModule[],
    ): DagNodeModule[] {
        const modules = tab.getAppModules();
        const headSet: Set<string> = new Set();
        oldModules.forEach((oldModule) => {
            headSet.add(oldModule.headNode.getId());
        });
        
        const usedModules = modules.filter((moduleNode) => {
            return headSet.has(moduleNode.headNode.getId());
        });
        return usedModules;
    }

    private _saveClonedTab(tabMap: Map<string, DagTabUser>): void {
        const tabs: DagTabUser[] = [];
        tabMap.forEach((tab) => {
            tab.save();
            tabs.push(tab);
        });
        DagList.Instance.addUserDags(tabs);
    }

    private _createMainTab(app: string, moduleNodes: Set<DagNodeModule>): void {
        const graph = this._buildMainAppGraph(moduleNodes);
        const name: string = DagList.Instance.getValidName("Main", undefined, undefined, undefined, app);
        // graph.addMainNode();
        const mainTab: DagTabMain = new DagTabMain({
            app,
            name: name,
            dagGraph: graph,
            createdTime: xcTimeHelper.now()
        });
        if (!DagList.Instance.addDag(mainTab)) {
            return;
        }
        mainTab.save();
    }

    private _buildMainAppGraph(moduleNodes: Set<DagNodeModule>): DagGraph {
        // add to add the tab to cache for buildModuleGraph logic to find link/link out
        const tabSet: Set<DagTabUser> = new Set();
        moduleNodes.forEach((moduleNode) => {
            const tab: DagTabUser = moduleNode.tab;
            if (!tabSet.has(tab)) {
                tabSet.add(tab);
                DagTabManager.Instance.addSQLTabCache(tab);
            }
        });
        const tabToModuleMap = this._getTabToModuleMap(moduleNodes);
        const graph = DagViewManager.Instance.buildModuleGraph(tabToModuleMap);
        tabSet.forEach((tab) => {
            DagTabManager.Instance.removeSQLTabCache(tab);
        });
        return graph;
    }

    private _getTabToModuleMap(moduleNodes: Set<DagNodeModule>): Map<string, DagNodeModule[]> {
        const moduleMap: Map<string, DagNodeModule[]> = new Map();
        moduleNodes.forEach(moduleNode => {
            let dagTab = moduleNode.getTab();
            if (!moduleMap.get(dagTab.getId())) {
                moduleMap.set(dagTab.getId(), []);
            }
            moduleMap.get(dagTab.getId()).push(moduleNode);
        });
        return moduleMap;
    }

}