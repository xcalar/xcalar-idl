class SQLExecutor {
    private _sql: string;
    private _sqlNode: DagNodeSQL;
    private _IMDNodes: DagNodeIMDTable[];
    private _tempTab: DagTabUser;
    private _tempGraph: DagGraph;
    private _identifiers: {};
    private _identifiersOrder: number[];
    private _schema: {};

    public constructor(sql: string) {
        this._sql = sql.replace(/;+$/, "");
        this._IMDNodes = [];
        this._identifiersOrder = [];
        this._identifiers = {};
        this._schema = {};
        const tables: string[] = Array.from(XDParser.SqlParser.getTableIdentifiers(sql));
        const allPubTables = PTblManager.Instance.getTables();
        const allSchemas = {};
        allPubTables.forEach((pubTable) => {
            const columns = [];
            pubTable.columns.forEach((column) => {
                const upperName = column.name.toUpperCase();
                if (!upperName.startsWith("XCALARRANKOVER") &&
                    !upperName.startsWith("XCALAROPCODE") &&
                    !upperName.startsWith("XCALARBATCHID") &&
                    !upperName.startsWith("XCALARROWNUMPK")) {
                    columns.push(column);
                }
            });
            allSchemas[pubTable.name.toUpperCase()] = columns;
        });
        tables.forEach((identifier, idx) => {
            const pubTableName = identifier.toUpperCase();
            if (allSchemas.hasOwnProperty(pubTableName)) {
                this._schema[pubTableName] = allSchemas[pubTableName];
            }
            const IMDNode = <DagNodeIMDTable>DagNodeFactory.create({
                type: DagNodeType.IMDTable
            });
            this._IMDNodes.push(IMDNode);
            this._identifiersOrder.push(idx + 1);
            this._identifiers[idx + 1] = identifier;
        });

        this._sqlNode = <DagNodeSQL>DagNodeFactory.create({
            type: DagNodeType.SQL
        });
        this._createDataflow();
    }

    public execute(): XDPromise<void> {
        const deferred: XDDeferred<void> = PromiseHelper.deferred();

        try {
            const publishedTableNodes: DagNodeIMDTable[] = this._IMDNodes;
            this._addPublishedTableNodes(publishedTableNodes)
            this._configurePublishedTableNode()
            .then(() => {
                return this._configureSQLNode();
            })
            .then(() => {
                return this._tempGraph.execute([this._sqlNode.getId()]);
            })
            .then(() => {
                // XXX TO-DO show result
                // console.log(this._sqlNode.getNewTableName());
                return this._tempTab.save();
            })
            .then(deferred.resolve)
            .fail(deferred.reject);
        } catch (e) {
            deferred.reject({error: e.mesaage});
        }

        return deferred.promise();
    }

    private _createDataflow(): void {
        this._tempGraph = new DagGraph();
        const name: string = ".tempSQL" + DagTab.generateId();
        this._tempTab = new DagTabUser(name, null, this._tempGraph, false, xcTimeHelper.now());
        this._tempGraph.addNode(this._sqlNode);
    }

    private _addPublishedTableNodes(nodes: DagNodeIMDTable[]): void {
        const sqlNodeId: DagNodeId = this._sqlNode.getId();
        nodes.forEach((node, index) => {
            this._tempGraph.addNode(node);
            this._tempGraph.connect(node.getId(), sqlNodeId, index);
        });
    }

    private _configurePublishedTableNode(): XDPromise<void> {
        const promiseArray = [];
        this._IMDNodes.forEach((IMDNode, idx) => {
            const pubTableName = this._identifiers[idx + 1];
            const schema: ColSchema[] = this._schema[pubTableName.toUpperCase()];
            const dagNodeIMDInput: DagNodeIMDTableInputStruct = {
                source: pubTableName,
                version: -1,
                schema: schema
            }
            promiseArray.push(IMDNode.setParam(dagNodeIMDInput));
        });
        return PromiseHelper.when.apply(window, promiseArray);
    }

    private _configureSQLNode(): XDPromise<any> {
        this._sqlNode.setParam({
            sqlQueryStr: this._sql,
            identifiers: this._identifiers,
            identifiersOrder: this._identifiersOrder
        }, true);
        const queryId = xcHelper.randName("sqlQuery", 8);
        const identifiers = new Map<number, string>();
        this._identifiersOrder.forEach((idx) => {
            identifiers.set(idx, this._identifiers[idx]);
        });
        return this._sqlNode.compileSQL(this._sql, queryId, identifiers);
    }
}