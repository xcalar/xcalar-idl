import request = require("request");
import * as xcConsole from "../utils/expServerXcConsole";

class SqlManager {
    private static _instance = null;
    public static get getInstance(): SqlManager {
        return this._instance || (this._instance = new this());
    }

    public SqlUtil: any;

    private _sqlQueryObjects: any;
    private _workerFlag: boolean;
    private _sqlWorkerPool: any;
    private _idNum: number;
    private _gTurnSelectCacheOn: boolean;

    private jQuery: any;

    private constructor() {
        this._sqlQueryObjects= {};
        this._workerFlag = process.env.EXP_WORKER != null &&
                    process.env.EXP_WORKER.toUpperCase() !== "FALSE" ?
                    true : false;
        this._sqlWorkerPool = this._workerFlag ?
            new (require("./worker/workerPool.js"))({fileName: './sqlWorker.js',
                                                           max: 9}) : undefined;
        this._idNum = 0;
        this._gTurnSelectCacheOn = false;

        require("jsdom/lib/old-api").env("", (err, window) => {
            console.log("initting jQuery");
            if (err) {
                console.error(err);
                return;
            }
            global['jQuery'] = this.jQuery = require("jquery")(window);
            global['$'] = this.jQuery;
            this.SqlUtil = require("../utils/sqlUtils.js").SqlUtil;
            this.jQuery.md5 = require(
                                '../../../3rd/jQuery-MD5-master/jquery.md5.js');
        });
    }

    // Start a worker for CPU intensive jobs
    private startWorker(data: SQLWorkerData): JQueryPromise<any> {
        if (this._sqlWorkerPool) {
            let deferred: any = PromiseHelper.deferred();
            this._sqlWorkerPool.submit(deferred, data);
            return deferred.promise();
        }
    }

    private generateTablePrefix(
        userName: string,
        wkbkName: string
    ): string {
        let curNum = this._idNum;
        this._idNum++;
        // Avoid # symbol in table name
        // cause it might be potential table publish issue
        // return userName + "_wkbk_" + wkbkName + "_" + Date.now() + "_" + curNum;
        return userName + "_wkbk_" + wkbkName + "_" + Date.now() + "_" + curNum;
    }

    private getUserIdUnique(
        name: string,
        hashFunc: any
    ): number {
        // XXX This should be removed when we don't need userIdUnique
        // after xcrpc migration
        const hash = hashFunc(name);
        const len = 5;
        const id = parseInt("0x" + hash.substring(0, len)) + 4000000;
        return id;
    }

    private connect(
        hostname: string,
    ): JQueryPromise<any> {
        let deferred = PromiseHelper.deferred();
        const url: string = "https://" + hostname + "/app/service/xce";
        let newThrift: boolean = false;
        Xcrpc.createClient(Xcrpc.DEFAULT_CLIENT_NAME, url);
        if (getTHandle() == null) {
            setupThrift(hostname);
            newThrift = true;
        }
        XcalarGetVersion()
        .then((version) => {
            deferred.resolve(
                {
                    xcalarVersion: version,
                    newThrift: newThrift,
                }
            )
        })
        .fail(deferred.reject)

        return deferred.promise();
    };

    private activateWkbk(
        activeSessionNames: string[],
        sessionInfo: SessionInfo
    ):JQueryPromise<any> {
        let deferred = PromiseHelper.deferred();
        let {userName, userId, sessionName} = sessionInfo;
        if (activeSessionNames.indexOf(sessionName) < 0) {
            this.SqlUtil.setSessionInfo(userName, userId, sessionName);
            XcalarActivateWorkbook(sessionName)
            .then(() => {
                deferred.resolve("newly activated");
            })
            .fail(() => {
                deferred.reject("activation failed");
            });
        } else {
            deferred.resolve("already activated");
        }
        return deferred.promise();
    }

    private goToSqlWkbk(sessionInfo: SessionInfo): JQueryPromise<any> {
        let deferred: any = PromiseHelper.deferred();
        let activeSessionNames: string[] = [];
        let sqlSession: any = null;
        let {userName, userId, sessionName} = sessionInfo;

        this.SqlUtil.setSessionInfo(userName, userId, sessionName);
        XcalarListWorkbooks("*", true)
        .then((res: XcalarApiSessionListOutput): any => {
            res.sessions.forEach((session) => {
                if (session.name === sessionName) {
                    sqlSession = session;
                }
                if (session.state === "Active") {
                    activeSessionNames.push(session.name);
                }
            });
            if (sqlSession == null) {
                this.SqlUtil.setSessionInfo(userName, userId, sessionName);
                return XcalarNewWorkbook(sessionName, false);
            }
        })
        .then(() => {
            return this.activateWkbk(activeSessionNames, sessionInfo);
        }, (error: any): any => {
            if (error.status === StatusT.StatusSessionExists) {
                return this.activateWkbk(activeSessionNames, sessionInfo);
            } else {
                return PromiseHelper.reject(error);
            }
        })
        .then((ret: any) => {
            xcConsole.log("Activated workbook " + sessionName + ": ", ret);
            setSessionName(sessionName);
            deferred.resolve(ret);
        })
        .fail((err) => {
            deferred.reject(err);
        });

        return deferred.promise();
    }

    private setupConnection(
        userIdName: string,
        userIdUnique: number,
        wkbkName: string
    ): JQueryPromise<any> {
        let deferred: any = this.jQuery.Deferred();
        this.connect("localhost")
        .then((ret) => {
            xcConsole.log("connected  to localhost");
            let sessionInfo = this.SqlUtil.setSessionInfo(userIdName,
                                                        userIdUnique, wkbkName)
            if (ret.newThrift) {
                Admin.addNewUser(sessionInfo.userName);
            }
            return this.goToSqlWkbk(sessionInfo);
        })
        .then(deferred.resolve)
        .fail(deferred.reject);
        return deferred.promise();
    }

    private listAllTables(
        pattern: string,
        pubTables: Map<string, string>,
        xdTables: Map<string, string>,
        sessionInfo: SessionInfo
    ): JQueryPromise<any> {
        let deferred: any = PromiseHelper.deferred();
        let patternMatch: string = pattern || "*";
        let tableListPromiseArray: JQueryPromise<any>[] = [];
        let {userName, userId, sessionName} = sessionInfo;
        this.SqlUtil.setSessionInfo(userName, userId, sessionName);
        tableListPromiseArray.push(XcalarListPublishedTables(patternMatch));
        tableListPromiseArray.push(XcalarGetTables(patternMatch));
        PromiseHelper.when.apply(this, tableListPromiseArray)
        .then((res: any): void => {
            let pubTablesRes: XcalarApiListTablesOutput = res[0];
            let xdTablesRes: any = res[1];
            pubTablesRes.tables.forEach((table: any): void => {
                if (table.active) {
                    pubTables.set(table.name.toUpperCase(), table.name);
                }
            });
            xdTablesRes.nodeInfo.forEach((node: any): void => {
                xdTables.set(node.name.toUpperCase(), node.name);
            });
            deferred.resolve({pubTablesRes: pubTablesRes});
        })
        .fail((args): void => {
            let error: any = null;
            for (let i: number = 0; i < args.length; i++) {
                if (args[i] && (args[i].error ||
                    args[i] === StatusTStr[StatusT.StatusCanceled])) {
                    error = args[i];
                    break;
                }
            }
            deferred.reject(error);
        });
        return deferred.promise();
    }

    private listPublishedTables(pattern: string): JQueryPromise<any> {
        let deferred: any = PromiseHelper.deferred();
        let pubPatternMatch: string = pattern || "*";
        XcalarListPublishedTables(pubPatternMatch)
        .then((res: XcalarApiListTablesOutput): void => {
            let publishedTables: string[] = [];
            for (let i: number = 0; i < res.tables.length; i++) {
                if (res.tables[i].active) {
                    var table = res.tables[i];
                    publishedTables.push(table.name);
                }
            }
            deferred.resolve({
                pubTablesRes: res,
                publishedTables: publishedTables
            });
        })
        .fail(deferred.reject);
        return deferred.promise();
    };

    private sendToPlanner(
        sessionPrefix: string,
        requestStruct: RequestInput,
        username: string,
        wkbkName: string
    ): JQueryPromise<any> {
        let type: string = requestStruct.type;
        let method: string = requestStruct.method;
        let data: any = requestStruct.data;
        if (!username) {
            username = "xcalar-internal-sql";
            wkbkName = "sql-workbook";
        }
        let deferred: any = PromiseHelper.deferred();
        let url: string = "http://localhost:27000/xcesql/" + type;
        if (type !== "sqlparse") {
            url += "/" + encodeURIComponent(encodeURIComponent(sessionPrefix +
                                                username + "-wkbk-" + wkbkName));
            if (type === "sqlquery") {
                url += "/true/true"
            }
        }

        request({
            method: method,
            url: url,
            json: true,
            body: data
            },
            (error: any, response: any, body: any): void => {
                if (!error && response.statusCode == 200) {
                    if (type === "sqlquery") {
                        deferred.resolve(JSON.parse(body.sqlQuery));
                    } else {
                        deferred.resolve(body);
                    }
                } else {
                    if(body && body.exceptionName && body.exceptionMsg) {
                        error = {errorType: body.exceptionName,
                                    errorMsg: body.exceptionMsg};
                    }
                    deferred.reject(error);
                }
            }
        );
        return deferred.promise();
    }

    private getTablesFromParserResult(
        identifiers: string[],
        setOfPubTables: Map<string, string>,
        setOfXDTables: Map<string, string>
    ): string[][] | string  {
        let imdTables: string[] = [];
        let xdTables: string[] = [];
        let errorTables: string[] = [];
        setOfXDTables = setOfXDTables || new Map();
        identifiers.forEach((identifier) => {
            identifier = identifier.toUpperCase();
            let slicedIdentifier: string = identifier.slice(1, -1);
            if (setOfXDTables.has(identifier)){
                xdTables.push(setOfXDTables.get(identifier));
            }
            else if (identifier[0] === "`"
                && identifier[identifier.length - 1] === "`"
                && setOfXDTables.has(slicedIdentifier)) {
                    xdTables.push(setOfXDTables.get(slicedIdentifier));
            }
            else if(setOfPubTables.has(identifier)){
                imdTables.push(setOfPubTables.get(identifier));
            }
            else if (identifier[0] === "`"
                && identifier[identifier.length - 1] === "`"
                && setOfPubTables.has(slicedIdentifier)) {
                    imdTables.push(setOfPubTables.get(slicedIdentifier));
            }
            else {
                errorTables.push(identifier);
            }
        });
        if (errorTables.length > 0) {
            return "Tables not found: " +
                JSON.stringify(errorTables);
        }
        return [imdTables, xdTables];
    }

    private findPubTableByName(
        pubList: XcalarApiListTablesOutput,
        pubName: string
    ): XcalarApiTableInfo {
        for (let pubTable of pubList.tables) {
            if (pubTable.name === pubName) {
                return pubTable;
            }
        }
    }

    private getInfoForPublishedTable(
        pubTableReturn: any,
        pubTableName: string
    ): TableInfo {

        let tableStruct: TableInfo=
            this.findPubTableByName(pubTableReturn, pubTableName);
        let columns: XcalarApiColumnInfo[] = tableStruct.values;
        let schema: any = [];
        for (var i = 0; i < columns.length; i++) {
            let colStruct: any = {};
            let column: XcalarApiColumnInfo = columns[i];
            let type: ColumnType = xcHelper.convertFieldTypeToColType(
                DfFieldTypeTFromStr[column.type]);
            colStruct[column.name] = type;
            schema.push(colStruct);
        }
        tableStruct.schema = schema;

        return tableStruct;
    }

    private getInfoForXDTable(
        tableName: string,
        sessionInfo: SessionInfo
    ): JQueryPromise<XDTableInfo> {
        let deferred: any = PromiseHelper.deferred();
        let {userName, userId, sessionName} = sessionInfo;
        this.SqlUtil.setSessionInfo(userName, userId, sessionName);
        XcalarGetTableMeta(tableName)
        .then((ret: XcalarApiGetTableMetaOutput) => {
            let columns: DfFieldAttrHeader[] = ret.valueAttrs;
            let schema: any = [];
            let colInfos: ColRenameInfo[] = columns.map((column) => {
                let colStruct: any = {};
                let columnName: string = column.name.toUpperCase();
                let colType: ColumnType
                    = xcHelper.convertFieldTypeToColType(column.type);
                if (colType !== 'integer' && colType !== 'float' &&
                    colType !== 'boolean' && colType !== 'timestamp' &&
                    colType !== "string" && colType !== 'money') {
                    // can't handle other types in SQL
                    return deferred.reject("Invalid column type, cannot handle "
                                                + colType);
                }
                colStruct[columnName] = colType;
                schema.push(colStruct);
                return xcHelper.getJoinRenameMap(column.name,
                        columnName, column.type);
            });
            let txId: number = Transaction.start({"simulate": true});
            XIApi.synthesize(txId, colInfos, tableName)
            .then((finalizedTableName: string): JQueryPromise<XDTableInfo> => {
                let query: string = Transaction.done(txId);
                if(query.slice(-1) === ','){
                    query = query.slice(0, -1);
                }
                let jsonQuery: any = JSON.parse(query);
                return deferred.resolve({
                        "pubTableName": tableName,
                        "tableName": finalizedTableName,
                        "query": jsonQuery,
                        "schema":schema,
                        "isIMD": false
                    });
            })
            .fail(deferred.reject)
        })
        .fail(deferred.reject);
        return deferred.promise();
    };

    public selectPublishedTables(
        args: SQLPublishInput[],
        allSchemas: any,
        batchIdMap?: any
    ): XcalarSelectQuery[] {
        let queryArray: XcalarSelectQuery[] = [];
        for (let i: number = 0; i < args.length; i++) {
            let renameMap: XcalarTableColumn[] = [];
            for(let j: number = 0; j < allSchemas[args[i].publishName].length;) {
                let obj = allSchemas[args[i].publishName][j];
                var colName = Object.keys(obj)[0];
                var upColName = colName.toUpperCase();
                if (!upColName.startsWith("XCALARRANKOVER") &&
                    !upColName.startsWith("XCALAROPCODE") &&
                    !upColName.startsWith("XCALARBATCHID") &&
                    !upColName.startsWith("XCALARROWNUMPK")) {
                    renameMap.push({sourceColumn: colName, destColumn: upColName,
                                    columnType: DfFieldTypeTStr[xcHelper
                                        .convertColTypeToFieldType(obj[colName])]});
                    var newColObj = {};
                    newColObj[upColName] = obj[colName];
                    allSchemas[args[i].publishName][j] = newColObj;
                    j++;
                } else {
                    allSchemas[args[i].publishName].splice(j, 1);
                }
            }
            let query: XcalarSelectQuery = {
                "operation": "XcalarApiSelect",
                "args": {
                    "source": args[i].publishName,
                    "dest": args[i].importTable,
                    "minBatchId": -1,
                    // "maxBatchId": batchIdMap ? batchIdMap[args[i].publishName] : -1,
                    "maxBatchId": -1,
                    "columns": renameMap
                }
            }
            queryArray.push(query);
        }
        return queryArray;
    }

    private findValidLastSelect(
        selects: XcalarApiSelectInput[],
        nextBatchId: number
    ): string {
        for (let select of selects) {
            if (select.maxBatchId + 1 === nextBatchId &&
                select.minBatchId === 0) {
                return select.dest;
            }
        }
    }

    private tableValid(
        pubTableName: string,
        tableName: string,
        sessionInfo: SessionInfo
    ): JQueryPromise<XDTableInfo> {
        let deferred = this.jQuery.Deferred();
        let {userName, userId, sessionName} = sessionInfo;
        if (!this._gTurnSelectCacheOn) {
            return PromiseHelper.resolve({
                "pubTableName": pubTableName,
                "tableName": tableName,
                "found": false,
                "isIMD": true
            });
        }
        this.SqlUtil.setSessionInfo(userName, userId, sessionName);
        XcalarGetTableMeta(tableName)
        .then(() => {
            deferred.resolve({
                "pubTableName": pubTableName,
                "tableName": tableName,
                "found": true,
                "isIMD": true
            });
        })
        .fail(() => {
            deferred.resolve({
                "pubTableName": pubTableName,
                "tableName": tableName,
                "found": false,
                "isIMD": true
            });
        });
        return deferred.promise();
    }

    private collectTablesMetaInfo(
        queryStr: string,
        tablePrefix: string,
        type: string,
        sessionInfo: SessionInfo
    ): JQueryPromise<any> {
        let {userName, userId, sessionName} = sessionInfo;
        let allSchemas: any = {};
        let allSelects: any = {};
        let deferred: any = this.jQuery.Deferred();
        let batchIdMap: any = {};
        let pubTablesMap: Map<string, string> = new Map();
        let xdTablesMap: Map<string, string> = new Map();
        let pubTableRes: any;

        let prom: any;
        let whenCallSent: boolean = false;
        let whenCallReturned: boolean = false;
        //XXX Doing this not to mess up with odbc calls
        // but works without doing this for odbc, need to remove
        // this when we unify sdk and odbc code paths
        if (type === 'odbc') {
            prom = this.listPublishedTables('*');
        }
        else {
            prom = this.listAllTables('*', pubTablesMap, xdTablesMap,
                                        sessionInfo);
        }
        prom
        .then((ret: any) => {
            //XXX converting pubTables array to Map
            // making xdTables to empty Map
            pubTableRes = ret.pubTablesRes;
            if (type === 'odbc') {
                const retPubTables: string[] = ret.publishedTables;
                for (let pubTable of retPubTables) {
                    pubTablesMap.set(pubTable.toUpperCase(), pubTable);
                }
            }
            let requestStruct: RequestInput = {
                type: "sqlparse",
                method: "POST",
                data: {
                    sqlQuery: queryStr,
                    ops: ["identifier"],
                    isMulti: false
                }
            }
            return this.sendToPlanner(tablePrefix, requestStruct,
                                                userName, sessionName);
        })
        .then((data: any): JQueryPromise<any> => {
            let retStruct: any[] = data.ret;
            if (retStruct.length > 1) {
                return PromiseHelper.reject("Multiple queries not supported yet");
            }
            let identifiers: string[] = retStruct[0].identifiers;
            if (identifiers.length === 0) {
                return PromiseHelper.reject("Failed to get identifiers " +
                                                "from invalid SQL");
            }
            let allTables: any =
                this.getTablesFromParserResult(identifiers, pubTablesMap,
                                                        xdTablesMap);
            if (typeof(allTables) !== "object") {
                console.log(allTables);
                return PromiseHelper.reject(SQLErrTStr.NoPublishedTable);
            }
            let imdTables: string[] = allTables[0];
            let xdTables: string[] = allTables[1];
            console.log("IMD tables are", imdTables);
            console.log("XD tables are", xdTables);
            let tableValidPromiseArray: JQueryPromise<XDTableInfo>[] = [];
            for (let imdTable of imdTables) {
                let tableStruct: TableInfo =
                    this.getInfoForPublishedTable(pubTableRes, imdTable);
                // schema must exist because getListOfPublishedTables ensures
                // that it exists
                allSchemas[imdTable] = tableStruct.schema;
                batchIdMap[imdTable] = tableStruct.nextBatchId - 1;
                let candidateSelectTable: string =
                    this.findValidLastSelect(tableStruct.selects,
                                            tableStruct.nextBatchId);
                allSelects[imdTable] = candidateSelectTable;
                tableValidPromiseArray.push(this.tableValid(imdTable,
                                                          candidateSelectTable,
                                                          sessionInfo));
            }

            for (let xdTable of xdTables) {
                tableValidPromiseArray.push(this.getInfoForXDTable(xdTable,
                                                                    sessionInfo));
            }
            whenCallSent = true;
            return PromiseHelper.when(...tableValidPromiseArray);
        })
        .then((res: any): void => {
            let returns: any = res;
            whenCallReturned = true;
            // XXX FIX ME We need to make sure from when we check to when we run
            // this call, that the table still exists and that no one has dropped
            // it in the meantime. Alternatively, we can just put in a backup clause
            let xdTableReturns: XDTableInfo[] = [];
            for (let retStruct of returns) {
                if (retStruct.isIMD && !retStruct.found) {
                    allSelects[retStruct.pubTableName] = undefined;
                }
                else if (!retStruct.isIMD) {
                    xdTableReturns.push(retStruct);
                }
            }
            //imd tables information gathering
            let toSelect: SQLPublishInput[] = [];
            for (let pubTable in allSelects) {
                if (!allSelects[pubTable]) {
                    let xcalarTableName: string = xcHelper.randName(tablePrefix) +
                        Authentication.getHashId();
                    toSelect.push({
                        importTable: xcalarTableName,
                        publishName: pubTable
                    });
                    allSelects[pubTable] = xcalarTableName;
                }
            }
            let query_array: XcalarSelectQuery[] =
                this.selectPublishedTables(toSelect, allSchemas, batchIdMap);

            //xd tables information gathering
            xdTableReturns.forEach((xdTableStruct) => {
                let xdTable: string = xdTableStruct.tableName;
                let pubTable: string = xdTableStruct.pubTableName;
                allSelects[pubTable] = xdTable;
                query_array.push(xdTableStruct.query);
                allSchemas[pubTable] = xdTableStruct.schema;
            });

            deferred.resolve(query_array, allSchemas, allSelects);
        })
        .fail((args) => {
            if (whenCallSent && !whenCallReturned) {
                let error: any = null;
                for (let i: number = 0; i < args.length; i++) {
                    if (args[i] && (args[i].error ||
                        args[i] === StatusTStr[StatusT.StatusCanceled])) {
                        error = args[i];
                        break;
                    }
                }
                deferred.reject(error);
            } else {
                deferred.reject(args);
            }
        });
        return deferred.promise();
    }

    private cancelQuery(
        queryName: string,
        sessionInfo: SessionInfo
    ): any {
        let deferred: any = PromiseHelper.deferred();
        let sqlQueryObj = this._sqlQueryObjects[queryName];
        let {userName, userId, sessionName} = sessionInfo;
        this.SqlUtil.setSessionInfo(userName, userId, sessionName);
        if (sqlQueryObj) {
            return sqlQueryObj.setStatus(SQLStatus.Cancelled);
        } else {
            XcalarQueryCancel(queryName)
            .then(() => {
                let sqlHistoryObj: SQLHistoryObj = {
                    queryId: queryName,
                    status: SQLStatus.Cancelled,
                    endTime: new Date()
                };
                let info = this.SqlUtil.setSessionInfo(userName, userId, sessionName);
                SqlQueryHistory.getInstance().upsertQuery(sqlHistoryObj, {userName: info.userName, workbookName: info.sessionName});
                deferred.resolve();
            })
            .fail((error) => {
                deferred.reject({error: error});
            });
            return deferred.promise();
        }
    };

    public executeSql(
        params: SQLQueryInput,
        type?: string
    ) {
        let deferred: any = PromiseHelper.deferred();
        let optimizations: SQLOptimizations = params.optimizations;
        let sessionInfo: SessionInfo = this.SqlUtil.setSessionInfo(
                                            params.userName, params.userId,
                                            params.sessionName);
        let tablePrefix: string = params.tablePrefix ||
                            this.generateTablePrefix(
                                sessionInfo.userName, sessionInfo.sessionName);
        tablePrefix = this.SqlUtil.cleansePrefix(tablePrefix);
        params.usePaging = params.usePaging || false;
        let allSelects: any = {};
        let queryId: string = params.queryName || xcHelper.randName("sql");

        let selectQuery: string | XcalarSelectQuery[] = "";

        let sqlHistoryObj: SQLHistoryObj = {
            queryId: queryId,
            status: SQLStatus.Compiling,
            queryString: params.queryString
        };
        let sqlQueryObj: any;

        this.setupConnection(sessionInfo.userName, sessionInfo.userId,
            sessionInfo.sessionName)
        .then(() => {
            sqlHistoryObj["startTime"] = new Date();
            let info = this.SqlUtil.setSessionInfo(sessionInfo.userName, sessionInfo.userId,
                                        sessionInfo.sessionName);
            SqlQueryHistory.getInstance().upsertQuery(sqlHistoryObj,
                {userName: info.userName, workbookName: info.sessionName});
            return this.collectTablesMetaInfo(params.queryString, tablePrefix,
                                                        type, sessionInfo);
        })
        .then((sqlQuery: XcalarSelectQuery[], schemas: any, selects: any):
            JQueryPromise<any> => {
            allSelects = selects;
            selectQuery = sqlQuery;
            let schemasToSendToSqlDf: any[] = [];
            for (let pubTable in schemas) {
                schemasToSendToSqlDf.push({
                    tableName: pubTable,
                    tableColumns: schemas[pubTable],
                    xcTableName: selects[pubTable]
                });
            }
            let requestStruct: RequestInput = {
                type: "schemasupdate",
                method: "put",
                data: schemasToSendToSqlDf
            }
            return this.sendToPlanner(tablePrefix, requestStruct,
                                sessionInfo.userName, sessionInfo.sessionName);
        })
        .then((): JQueryPromise<any> => {
            // get logical plan
            let requestStruct: RequestInput = {
                type: "sqlquery",
                method: "post",
                data: {"sqlQuery": params.queryString}
            }
            return this.sendToPlanner(tablePrefix, requestStruct,
                                sessionInfo.userName, sessionInfo.sessionName);
        })
        .then((plan: string): JQueryPromise<any> => {
            sqlQueryObj = new SQLQuery(queryId, params.queryString, plan,
                                            optimizations);
            sqlQueryObj.tablePrefix = tablePrefix;
            sqlQueryObj.fromExpServer = true;
            if (type === "odbc") {
                sqlQueryObj.checkTime = params.checkTime;
            }
            this._sqlQueryObjects[queryId] = sqlQueryObj;
            if (this._workerFlag) {
                let workerData: SQLWorkerData = {
                    sqlQueryObj: sqlQueryObj,
                    selectQuery: selectQuery,
                    allSelects: allSelects,
                    params: params,
                    type: type
                }
                return this.startWorker(workerData);
            } else {
                return SQLCompiler.compile(sqlQueryObj);
            }
        })
        .then((compiledObj: any): JQueryPromise<any> => {
            xcConsole.log("Compilation finished");
            sqlQueryObj = compiledObj;
            this._sqlQueryObjects[queryId] = sqlQueryObj;
            if (!this._workerFlag) {
                if (optimizations.noOptimize) {
                    let selectString: string = JSON.stringify(selectQuery);
                    sqlQueryObj.xcQueryString =
                                selectString.substring(0, selectString.length - 1) +
                                "," + sqlQueryObj.xcQueryString.substring(1);
                } else {
                    try {
                        sqlQueryObj.xcQueryString = LogicalOptimizer.optimize(
                                                        sqlQueryObj.xcQueryString,
                                                        optimizations,
                                                        JSON.stringify(selectQuery))
                                                        .optimizedQueryString;
                    } catch(e) {
                        deferred.reject(e);
                        return;
                    }
                }
                // Auto-generate a name for the final table if not specified
                if(type !== "odbc" && !params.usePaging && !params.resultTableName) {
                    params.resultTableName = xcHelper.randName("res_") +
                                                    Authentication.getHashId();
                }
                let prefixStruct: SQLAddPrefixReturnMsg = this.SqlUtil.addPrefix(
                    JSON.parse(sqlQueryObj.xcQueryString),
                    allSelects,
                    sqlQueryObj.newTableName,
                    tablePrefix,
                    params.usePaging,
                    params.resultTableName);
                sqlQueryObj.xcQueryString = prefixStruct.query;
                sqlQueryObj.newTableName = prefixStruct.tableName;
            }
            // To show better performance, we only display duration of execution
            sqlHistoryObj["startTime"] = new Date();
            sqlHistoryObj["status"] = SQLStatus.Running;
            let info = this.SqlUtil.setSessionInfo(
                sessionInfo.userName, sessionInfo.userId, sessionInfo.sessionName
            );
            SqlQueryHistory.getInstance().upsertQuery(sqlHistoryObj,
                 {userName: info.userName, workbookName: info.sessionName});
            return SQLExecutor.execute(sqlQueryObj, {
                userName: sessionInfo.userName,
                workbookName: sessionInfo.sessionName
            });
        })
        .then((): JQueryPromise<any> => {
            xcConsole.log("Execution finished!");
            sqlHistoryObj["status"] = SQLStatus.Done;
            sqlHistoryObj["endTime"] = new Date();
            sqlHistoryObj["tableName"] = sqlQueryObj.newTableName;
            let info = this.SqlUtil.setSessionInfo(sessionInfo.userName, sessionInfo.userId,
                                            sessionInfo.sessionName);
            SqlQueryHistory.getInstance().upsertQuery(sqlHistoryObj,
                {userName: info.userName, workbookName: info.sessionName});
            // Drop schemas and nuke session on planner
            let requestStruct: RequestInput = {
                type: "schemasdrop",
                method: "delete"
            }
            return this.sendToPlanner(tablePrefix, requestStruct,
                                        sessionInfo.userName, sessionInfo.sessionName)
        })
        .then((): JQueryPromise<SQLResult> => {
            if (sqlQueryObj.status === SQLStatus.Cancelled) {
                // Query is done already
                return PromiseHelper.reject(SQLErrTStr.Cancel);
            }
            if (type === "odbc") {
                return this.SqlUtil.getResults(sqlQueryObj.newTableName,
                                        sqlQueryObj.allColumns, params.rowsToFetch,
                                        params.execid, params.usePaging, sessionInfo);
            } else {
                let result: SQLResult = {
                    tableName: sqlQueryObj.newTableName,
                    columns: sqlQueryObj.allColumns,
                    orderColumns: sqlQueryObj.orderColumns
                }
                return PromiseHelper.resolve(result);
            }
        })
        .then((res: SQLResult): void => {
            xcConsole.log("sql query finishes.");
            deferred.resolve(res);
        })
        .fail((err: any): any => {
            xcConsole.log("sql query error: ", err);
            sqlHistoryObj["endTime"] = new Date();
            let retObj: any = {error: err};
            if (err === SQLErrTStr.Cancel) {
                sqlHistoryObj["status"] = SQLStatus.Cancelled;
                retObj.isCancelled = true;
            } else {
                sqlHistoryObj["status"] = SQLStatus.Failed;
                sqlHistoryObj["errorMsg"] = err;
            }
            let info = this.SqlUtil.setSessionInfo(sessionInfo.userName, sessionInfo.userId,
                                            sessionInfo.sessionName);
            SqlQueryHistory.getInstance().upsertQuery(sqlHistoryObj,
                {userName: info.userName, workbookName: info.sessionName});
            deferred.reject(retObj);
        })
        .always((): void => {
            if (type == "odbc" || optimizations.dropAsYouGo) {
                this.SqlUtil.setSessionInfo(sessionInfo.userName,
                                            sessionInfo.userId,
                                            sessionInfo.sessionName);
                var deleteCompletely = true;
                XcalarDeleteTable(tablePrefix + "*", -1, undefined, deleteCompletely,
                                  {userName: sessionInfo.userName,
                                   workbookName: sessionInfo.sessionName});
            }
        });

        return deferred.promise();
    };

    public getXCquery(
        params: SQLQueryInput,
        type: string
    ): JQueryPromise<any> {
        let deferred: any = PromiseHelper.deferred();
        let optimizations: SQLOptimizations = params.optimizations;
        let sessionInfo: SessionInfo = {"userName": params.userName,
            "userId": params.userId, "sessionName": params.sessionName};
        let tablePrefix: string = params.tablePrefix ||
                            this.generateTablePrefix(sessionInfo.userName,
                                sessionInfo.sessionName);
        params.usePaging = params.usePaging || false;
        let option: any = {
            prefix: tablePrefix,
            checkTime: params.checkTime,
            sqlMode: true,
            queryString: params.queryString
        };
        let allSelects: any = {};
        let queryId: string = params.queryName || xcHelper.randName("sql");
        let sqlQueryObj: SQLQuery;

        let selectQuery: string | XcalarSelectQuery[] = "";

        this.setupConnection(sessionInfo.userName, sessionInfo.userId,
            sessionInfo.sessionName)
        .then((): JQueryPromise<any> => {
            return this.collectTablesMetaInfo(params.queryString, tablePrefix,
                                                    type, sessionInfo);
        })
        .then((sqlQuery: XcalarSelectQuery[], schemas: any, selects: any):
            JQueryPromise<any> => {
            allSelects = selects;
            selectQuery = sqlQuery;
            let schemasToSendToSqlDf: any[] = [];
            for (var pubTable in schemas) {
                schemasToSendToSqlDf.push({
                    tableName: pubTable,
                    tableColumns: schemas[pubTable],
                    xcTableName: selects[pubTable]
                });
            }
            var requestStruct: RequestInput = {
                type: "schemasupdate",
                method: "put",
                data: schemasToSendToSqlDf
            }
            return this.sendToPlanner(tablePrefix, requestStruct,
                                sessionInfo.userName, sessionInfo.sessionName);
        })
        .then((): JQueryPromise<any> => {
            // get logical plan
            let requestStruct: RequestInput = {
                type: "sqlquery",
                method: "post",
                data: {"sqlQuery": params.queryString}
            }
            return this.sendToPlanner(tablePrefix, requestStruct,
                                sessionInfo.userName, sessionInfo.sessionName);
        })
        .then((plan: string): JQueryPromise<any> => {
            sqlQueryObj = new SQLQuery(queryId, params.queryString, plan,
                                            optimizations);
            sqlQueryObj.tablePrefix = tablePrefix;
            sqlQueryObj.fromExpServer = true;
            if (type === "odbc") {
                sqlQueryObj.checkTime = params.checkTime;
            }
            this._sqlQueryObjects[queryId] = sqlQueryObj;
            return SQLCompiler.compile(sqlQueryObj);
        })
        .then((compiledObj: any): JQueryPromise<any> => {
            xcConsole.log("Compilation finished");
            sqlQueryObj = compiledObj;
            this._sqlQueryObjects[queryId] = sqlQueryObj;
            try {
                sqlQueryObj.xcQueryString = LogicalOptimizer.optimize(
                                                    sqlQueryObj.xcQueryString,
                                                    sqlQueryObj.optimizations,
                                                    JSON.stringify(selectQuery))
                                                    .optimizedQueryString;
            } catch(e) {
                deferred.reject(e);
                return;
            }
            let prefixStruct: SQLAddPrefixReturnMsg = this.SqlUtil.addPrefix(
                JSON.parse(sqlQueryObj.xcQueryString),
                allSelects,
                sqlQueryObj.newTableName,
                params.usePaging,
                params.resultTableName);
            sqlQueryObj.xcQueryString = prefixStruct.query;
            deferred.resolve({"prefixedQuery": sqlQueryObj.xcQueryString,
                            "orderedColumns": sqlQueryObj.allColumns});
        })
        .fail((err) => {
            xcConsole.log("sql query error: ", err);
            let retObj: any = {error: err};
            if (err === SQLErrTStr.Cancel) {
                retObj.isCancelled = true;
            }
            deferred.reject(retObj);
        })

        return deferred.promise();
    };

    public result(
        resultSetId: string,
        rowPosition: number,
        rowsToFetch: number,
        totalRows: number,
        schema: any,
        renameMap: SQLColumn,
        sessionInfo: SessionInfo
    ): JQueryPromise<any> {
        let deferred: any = PromiseHelper.deferred();
        let {userName, userId, sessionName} = sessionInfo;
        this.setupConnection(userName, userId, sessionName)
        .then(() => {
            return this.SqlUtil.fetchData(resultSetId, rowPosition, rowsToFetch,
                                totalRows, sessionInfo);
        })
        .then((data: any): void => {
            let result: any = this.SqlUtil.parseRows(data, schema, renameMap);
            deferred.resolve(result)
        })
        .fail(deferred.reject);
        return deferred.promise();
    };

    public getTable(
        tableName: string,
        rowPosition: number,
        rowsToFetch: number,
        sessionInfo: SessionInfo,
    ): JQueryPromise<any> {
        let deferred: any = PromiseHelper.deferred();
        let {userName, userId, sessionName} = sessionInfo;
        this.setupConnection(userName, userId, sessionName)
        .then((): JQueryPromise<any> => {
            return this.SqlUtil.getRows(tableName, rowPosition, rowsToFetch,
                                        false, sessionInfo);
        })
        .then((data: any): void => {
            let cleanedData: any[] = [];
            for (let row of data) {
                cleanedData.push(JSON.parse(row));
            }
            deferred.resolve(cleanedData);
        })
        .fail(deferred.reject);
        return deferred.promise();
    };

    public clean(
        tableName: string,
        resultSetId: string,
        sessionInfo: SessionInfo
    ): JQueryPromise<void> {
        let deferred: any = PromiseHelper.deferred();
        let {userName, userId, sessionName} = sessionInfo;
        this.setupConnection(userName, userId, sessionName)
        .then(() => {
            if (resultSetId) {
                const sessionInfo = this.SqlUtil.setSessionInfo(userName, userId,
                                                                sessionName);
                return XcalarSetFree(resultSetId,
                                    {userName: sessionInfo.userName,
                                    workbookName: sessionInfo.sessionName});
            } else {
                return PromiseHelper.resolve();
            }
        })
        .then((): JQueryPromise<void> => {
            let deleteCompletely: boolean = true;
            const sessionInfo = this.SqlUtil.setSessionInfo(userName, userId,
                                                            sessionName);
            return XcalarDeleteTable(tableName, -1, undefined, deleteCompletely,
                                     {userName: sessionInfo.userName,
                                      workbookName: sessionInfo.sessionName});
        })
        .then(deferred.resolve)
        .fail(deferred.reject);
        return deferred.promise();
    };

    public list(pattern: string): JQueryPromise<any> {
        let deferred: any = PromiseHelper.deferred();
        this.connect("localhost")
        .then((): JQueryPromise<any> => {
            xcConsole.log("connected");
            return this.listPublishedTables(pattern);
        })
        .then((ret: any) => {
            const results: XcalarApiListTablesOutput = ret.pubTablesRes;
            const tables: string[] = ret.publishedTables;
            let retStruct: any[] = [];

            for (let pubTable of tables) {
                let pubTableMeta: any = {};
                pubTableMeta["tableName"] = pubTable;
                pubTableMeta["tableColumns"] =
                    this.getInfoForPublishedTable(results, pubTable).schema;
                retStruct.push(pubTableMeta);
            }
            deferred.resolve(retStruct);
        })
        .fail(deferred.reject);
        return deferred.promise();
    };

    public cancel(
        queryName: string,
        sessionInfo: SessionInfo
    ): JQueryPromise<any> {
        let deferred: any = PromiseHelper.deferred();
        let {userName, userId, sessionName} = sessionInfo;
        this.setupConnection(userName, userId, sessionName)
        .then(() => {
            return this.cancelQuery(queryName, sessionInfo);
        })
        .then(deferred.resolve)
        .fail(deferred.reject)
        return deferred.promise();
    }
}

const sqlManager = SqlManager.getInstance;
export default sqlManager;