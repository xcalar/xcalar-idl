import dict from "../lang";

export interface TableAttrs {
    "tableId": string,
    "name": string,
    "size": number,
    "sizeText": string,
    "locked": boolean,
    "checked": boolean,
    "date": string,
    "dateTip": object
}

export const id: string = "deleteTableModal";
const ResultSetTStr = dict.ResultSetTStr;
const UNKNWON_TIME: number = -1;

class DeleteTableModalService {
    public getTableList(): Promise<TableAttrs[]> {
        let XcalarGetTables = window["XcalarGetTables"];
        let xcHelper = window["xcHelper"];
        let DagTblManager = window["DagTblManager"];
        return new Promise((resolve, reject) => {
            XcalarGetTables("*")
            .then((result) => {
                let numNodes = result.numNodes;
                let nodeInfo = result.nodeInfo;
                let tables: TableAttrs[] = [];
                for (let i = 0; i < numNodes; i++) {
                    let node = nodeInfo[i];
                    tables.push({
                        "tableId": node.dagNodeId,
                        "name": node.name,
                        "size": node.size,
                        "sizeText": xcHelper.sizeTranslator(node.size),
                        "locked": DagTblManager.Instance.hasLock(node.name),
                        "checked": false,
                        ...this._getDateInfo(node.name)
                    });
                }
                resolve(tables);
            })
            .fail((error) => {
                reject(error);
            });
        });
    }

    public deleteTablesConfirm(tableNames: string[]) {
        if (tableNames.length === 0) {
            return new Promise((resolve) => {
                resolve();
            });
        } else {
            let Alert = window["Alert"];
            return new Promise((resolve, reject) => {
                Alert.show({
                    "title": ResultSetTStr.Del,
                    "msg": ResultSetTStr.DelMsg,
                    "highZindex": true,
                    "onCancel": () => {
                        reject(true);
                    },
                    "onConfirm": () => {
                        resolve();
                    }
                });
            });
        }
    }

    public deleteTables(tableNames: string[]) {
        // XXX TODO: remove window hack
        let DagTblManager = window["DagTblManager"];
        let MemoryAlert = window["MemoryAlert"];
        tableNames.forEach((tableName) => DagTblManager.Instance.deleteTable(tableName, false, false));

        if (tableNames.length === 0) {
            return new Promise((resolve) => {
                resolve()
            });
        } else {
            return new Promise((resolve, reject) => {
                DagTblManager.Instance.forceDeleteSweep()
                .then(() => {
                    resolve();
                })
                .fail(() => {
                    reject();
                })
                .always(() => {
                    // should re-dected memory usage
                    MemoryAlert.Instance.check();
                });
            });
        }
    }

    public sortTables(
        tables: TableAttrs[] = [],
        sortKey: string,
        reverseSort: boolean
    ): TableAttrs[] {
        if (tables == null || tables.length === 0) {
            return tables;
        }
        tables = this._sortTables(tables, sortKey);
        if (reverseSort) {
            tables.reverse();
        }

        return tables;
    }

    private _getDateInfo(tableName): {date: string, dateTip: object} {
        let DagTblManager = window["DagTblManager"];
        let xcTimeHelper = window["xcTimeHelper"];
        let moment = window["moment"];
        let date: string | number = DagTblManager.Instance.getTimeStamp(tableName);
        let container = `#${id}`;
        let date_str: string;
        let dateTip: object = {};

        if (date !== -1) {
            let time = moment(date);
            dateTip = xcTimeHelper.reactGetDateTip(time, {
                container: container
            });
            date_str = time.calendar();
        } else {
            date_str = "--";
        }
        return {
            date: date_str,
            dateTip
        }
    }

    private _sortTables(
        tables: TableAttrs[],
        sortKey: string
    ): TableAttrs[] {
        // sort by name first, no matter what case
        tables.sort((a, b) =>  a.name.localeCompare(b.name));

        // temoprarily not support sort on size
        if (sortKey === "size") {
            tables.sort((a, b) => {
                let sizeA = a.size;
                let sizeB = b.size;
                if (sizeA === UNKNWON_TIME) {
                    sizeA = null;
                }

                if (sizeB === UNKNWON_TIME) {
                    sizeB = null;
                }

                if (sizeA == null && sizeB == null) {
                    return 0;
                } else if (sizeA == null) {
                    return -1;
                } else if (sizeB == null) {
                    return 1;
                } else if (sizeA === sizeB) {
                    return 0;
                } else if (sizeA > sizeB) {
                    return 1;
                } else {
                    return -1;
                }
            });
        } else if (sortKey === "date") {
            let DagTblManager = window["DagTblManager"];
            tables.sort((a, b) => {
                let tA = DagTblManager.Instance.getTimeStamp(a.name);
                let tB = DagTblManager.Instance.getTimeStamp(b.name);
                if (tA === UNKNWON_TIME) {
                    tA = null;
                }

                if (tB === UNKNWON_TIME) {
                    tB = null;
                }

                if (tA == null && tB == null) {
                    return 0;
                } else if (tA == null) {
                    return -1;
                } else if (tB == null) {
                    return 1;
                } else if (tA === tB) {
                    return 0;
                } else if (tA > tB) {
                    return 1;
                } else {
                    return -1;
                }
            });
        }
        return tables;
    }
}

export default new DeleteTableModalService();