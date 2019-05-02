// This is the Typescript shape of xcrpc JS client code(assets/js/xcrpc/*)

// === Service definitions: Begin ===
declare module 'xcalar' {
    export class XceClient {
        constructor(endpoint: string);
    }

    export class KvStoreService {
        constructor(client: XceClient);
        lookup(request: proto.xcalar.compute.localtypes.KvStore.LookupRequest): Promise<proto.xcalar.compute.localtypes.KvStore.LookupResponse>;
    }

    export class LicenseService {
        constructor(client: XceClient);
        get(request: proto.xcalar.compute.localtypes.License.GetRequest): XDPromise<proto.xcalar.compute.localtypes.License.GetResponse>;
        update(request: proto.xcalar.compute.localtypes.License.UpdateRequest): XDPromise<void>;
    }

    export class QueryService {
        constructor(client: XceClient);
        list(request: proto.xcalar.compute.localtypes.Query.ListRequest): XDPromise<proto.xcalar.compute.localtypes.Query.ListResponse>;
    }

    export class ResultSetService {
        constructor(client: XceClient);
    }
}
// === Service definitions: End ===

// === Data structure definitions: Begin ===
declare namespace proto.xcalar.compute.localtypes {
    export namespace Workbook {
        export class WorkbookScope {
            setGlobl(value: GlobalSpecifier): void;
            setWorkbook(value: WorkbookSpecifier): void;
        }

        export class GlobalSpecifier {}

        export class WorkbookSpecifier {
            setName(value: WorkbookSpecifier.NameSpecifier): void;
        }
        export namespace WorkbookSpecifier {
            export class NameSpecifier {
                setUsername(value: string): void;
                setWorkbookname(value: string): void;
            }
        }

        export const ScopeType: {
            GLOBALSCOPETYPE: number, WORKBOOKSCOPETYPE: number
        }
    }

    export namespace KvStore {
        export class LookupRequest {
            setKey(value: ScopedKey): void;
        }
        export class LookupResponse {
            getValue(): KeyValue;
        }
        export class KeyValue {
            getText(): string;
        }
        export class ScopedKey {
            setName(value: string): void;
            setScope(value: Workbook.WorkbookScope): void;
        }
    }

    export namespace License {
        export class GetRequest {}
        export class GetResponse {
            getExpiration(): string;
            getNodecount(): number;
            getUsercount(): number;
            getLicensee(): string;
            getCompressedlicense(): string;
            getExpired(): boolean;
        }
        export class UpdateRequest {
            setLicensevalue(value: LicenseValue): void;
        }
        export class LicenseValue {
            setValue(value: string): void;
        }
    }

    export namespace ResultSet {
        export class ResultSetMakeRequest {
            setName(value: string): void;
            setScope(value: Workbook.WorkbookScope): void;
            setErrorDataset(value: boolean): void;
        }
        export class ResultSetMakeResponse {
            getResultSetId(): number;
            getNumRows(): number;
            getTableMeta(): TableMeta.GetTableMetaProto;
        }
    }

    export namespace TableMeta {
        export class GetTableMetaProto {
        }
    }

    export namespace Query {
        export class ListRequest {
            setNamePattern(value: string): void;
        }
        export class ListResponse {
            getQueriesList(): QueryInfo[];
        }

        export class QueryInfo {
            getName(): string;
            getMillisecondsElapsed(): number;
            getState(): string;
        }
    }
}
// === Data structure definitions: End ===