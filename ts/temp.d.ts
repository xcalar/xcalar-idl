/**
 * XXX This for is for temp declare of the modules
 * that has not been rewritten to ts yet.
 * Please remove these delcaration after rewrite
 * is done
 */
/// <reference path="../3rd/bower_components/moment/moment.d.ts" />
/// <reference path="../3rd/bower_components/CodeMirror/codemirror-custom.d.ts" />
/// <reference path="../node_modules/@types/codemirror/codemirror-showhint.d.ts" />
/* ============== TYPES ======================== */
type XDPromise<T> = JQueryPromise<T>;
type XDDeferred<T> = JQueryDeferred<T>;
type JoinType = JoinCompoundOperatorTStr | JoinOperatorT;
type HTML = string;
/* ============== INTERFACE ======================== */
interface Coordinate {
    x: number;
    y: number;
}

interface TableCell {
    isBlank: boolean;
    isMixed: boolean;
    type: string;
    isUndefined: boolean;
    isNull: boolean;
}

interface WindowSpec {
    winWidth: number;
    winHeight: number;
}

interface Dimensions {
    width: number,
    height: number,
    scale?: number
}

interface PrefixColInfo {
    prefix: string;
    name: string;
}

interface TableIndexCache {
    tableName: string;
    keys: string[];
    tempCols: string[];
}

interface ColRenameInfo {
    orig: string;
    new: string;
    type: DfFieldTypeT;
}

interface JoinTableInfo {
    columns: string[]; // array of back colum names to join
    casts?: ColumnType[]; // array of cast types ["string", "boolean", null] etc
    pulledColumns?: string[]; // columns to pulled out (front col name)
    tableName: string; // table's name
    rename?: ColRenameInfo[]; // array of rename object
    allImmediates?: string[]; // array of all immediate names for collision resolution
    removeNulls?: boolean; // sql use
}

interface JoinOptions {
    newTableName?: string; // final table's name, optional
    clean?: boolean; // remove intermediate table if set true
    evalString?: string; // cross join filter's eval string, now it applies to any join type
    existenceCol?: string;
    keepAllColumns?: boolean;
    nullSafe?: boolean;
}

interface AggColInfo {
    operator: string;
    aggColName: string;
    newColName: string;
    isDistinct?: boolean;
}

interface GroupByOptions {
    isIncSample?: boolean; // include sample or not
    sampleCols?: number[]; // sampleColumns to keep, only used when isIncSample is true
    icvMode?: boolean; // icv mode or not
    newTableName?: string; // dst table name, optional
    clean?: boolean; // remove intermediate table if set true
    groupAll?: boolean; // group by all rows to create single row if set true,
    newKeys?: string[]; // specify the new group by keys' name
    dhtName?: string; // dht to optimized skewd index
}

interface UnionColInfo {
    name: string;
    rename: string;
    type: ColumnType;
    cast: boolean;
}

interface UnionTableInfo {
    tableName: string;
    columns: UnionColInfo[];
}

interface ExportTableOptions {
    splitType: number;
    headerType: number;
    format: number;
    createRule: ExExportCreateRuleT;
    handleName: string;
    csvArgs: { fieldDelim: string, recordDelim: string };
}

interface GetNumRowsOptions {
    useConstant: boolean;
    txId: number;
    colName: string;
    constantName: string;
}

interface GlobalKVKeySet {
    gSettingsKey: string;
    gSharedDSKey: string;
}

interface UserKVKeySet {
    gUserKey: string;
    wkbkKey: string;
    gUserIMDKey: string;
}

interface WkbkKVKeySet {
    gStorageKey: string;
    gLogKey: string;
    gErrKey: string;
    gOverwrittenLogKey: string;
    gNotebookKey: string;
    gDagManagerKey: string;
    gDagTableManagerKey: string;
    gDagListKey: string;
    gSQLFuncListKey: string;
    gSQLSnippetKey: string;
    gSQLSnippetQueryKey: string;
    gTutorialKey: string;
    gStoredDatasetsKey: string;
}

interface XcalarEvalFnDescT {
    displayName?: string;
    fnName: string;
}

interface SQLInfo {
    retName?: string,
    tableId?: TableId,
    srcTables?: string[],
    tableName?: string,
    tableNames?: string[],
    lTableName?: string,
    rTableName?: string,
    operation?: string
}

interface XCThriftError {
    error: string,
    log: string
}

interface DFProgressData {
    pct: number,
    curOpPct: number,
    opTime: number,
    numCompleted: number
}

interface PbTblDisplayInfo {
    index: number;
    name: string;
    rows: string;
    size: string;
    createTime: string;
    status: PbTblStatus;
}

interface PbTblColSchema {
    name: string;
    type: ColumnType;
    primaryKey: string;
}

interface XcLogOptions {
    operation: string,
    func: string,
    retName?: string
}

interface DatepickerOptions {
    format?: string;
    weekStart?: number;
    startDate?: Date;
    endDate?: Date;
    autoclose?: boolean;
    startView?: number;
    todayBtn?: boolean;
    todayHighlight?: boolean;
    keyboardNavigation?: boolean;
    language?: string;
    dateFormat?: string,
    beforeShow?: Function
}
interface JQuery {
    datepicker(): JQuery;
    datepicker(methodName: string): JQuery;
    datepicker(methodName: string, params: any): JQuery;
    datepicker(options: DatepickerOptions): JQuery;
    sort(fn?: Function): JQuery;
    scrollintoview(any): JQuery;
    caret(pos: number): JQuery;
    selectAll(): JQuery;
    range(startPos: number, endPos?: number): JQuery;
}

interface Object {
    values(any): Function
}

interface Element {
    blur(): Function
}

interface Event {
    clipboardData: {
        setData: Function,
        getData: Function
    }
}

interface LocalStorage {
    setItem(key: string, value: string): void;
    getItem(key: string): string | null;
    removeItem(key: string): string | null;
}

interface JQueryEventObject {
    keyTriggered: boolean;
}

interface ParsedEval {
    fnName: string,
    args: ParsedEvalArg[] | ParsedEval[],
    type: string,
    error?: string
}

interface ParsedEvalArg {
    value: string,
    type: string
}

interface ExtensionTypeCheck {
    columnType?: string[];
    integer?: boolean;
    min?: number;
    max?: number;
    multiColumn?: boolean;
    newAggName?: boolean;
    allowEmpty?: boolean;
    tableField?: string;
    newColumnName?: boolean;
    newTableName?: boolean;
}

interface ExtensionFieldInfo {
    type: string;
    name: string;
    fieldClass: string;
    autofill?: any;
    enums?: string[];
    typeCheck?: ExtensionTypeCheck;
    variableArg?: boolean;
}

interface ExtensionFuncInfo {
    fnName: string;
    buttonText: string;
    arrayOfFields: ExtensionFieldInfo[];
    instruction: string;
}

interface ExtensionInfo {
    name: string;
    buttons: ExtensionFuncInfo[];
    actionFn: Function;
    configParams: {notTableDependent: boolean};
}

interface ColSchema {
    name: string,
    type: ColumnType
}

interface AggregateInfo {
    value: string | number,
    dagName: string,
    aggName: string,
    tableId: string,
    backColName: string,
    op: number,
    node: string,
    graph: string
}

interface StoredPubInfo {
    pubName: string,
    pubKeys: string[],
    deleteDataset: boolean,
    dsName?: string
}

interface StoredDataset {
    loadArgs: string,
    publish?: StoredPubInfo
}

declare class d3 {
    public select(selector: string): d3;
    public selectAll(selector: string): d3;
    public data(callback: Function | any[]);
    public transition(): d3;
    public each(callback: Function): d3;
    public interpolateNumber(num: number, step: number): Function;
    public duration(time: number): d3;
    public ease(type: string): d3;
    public tween(type: string, callback: Function): d3;
    public append(selector: string): d3;
    public attr(options: object | string, options2?: string | number | Function): d3;
    public style(options: string, options2: string): d3;
    public text(text: string | Function): d3;
    public remove(): d3;
    public interpolate(current: any, a: any);
    public interpolateNumber(num: number, step: number): Function;
    public transition(): d3;
    public duration(): d3;
    public insert(type: string | Function, before?: string | HTMLElement): d3;
    public classed(names: string, value?: boolean | Function): d3;
    public empty(): boolean;
    public call(func: any): d3;
    public size(): number;
    public delay(func: Function): d3;
    public filter(func: Function): d3;
    public svg;
    public layout;
    public scale: any;
}

declare namespace d3 {
    export function interpolate(current: any, a: any);
    export function interpolateNumber(num: number, step: number): Function;
    export function select(selector: string | HTMLElement | Element): d3;
    export function transition(): d3;
    export function duration(): d3;
    export function append(selector: string): d3;
    export function max(data: any[], callback: Function): number;
    export var svg;
    export var layout;
    export var scale;
}

declare class Ajv {
    public compile(any);
}

declare var ajv: Ajv;

interface JQueryStatic {
    md5(str: string): string;
}

declare namespace pako {
    export function gzip(key: string, options: object): string;
}

interface CanvasRenderingContext2D {
    webkitBackingStorePixelRatio: number;
    mozBackingStorePixelRatio: number;
    msBackingStorePixelRatio: number;
    oBackingStorePixelRatio: number;
    backingStorePixelRatio: number;
}

interface Array<T> {
    includes(...args: any[]): boolean;
}

interface OpStatsDetails {
    numWorkCompleted: number,
    numWorkTotal: number
}
interface OpStatsOutput {
    opDetails: OpStatsDetails;
}

interface FileListerFolder{
    folders: {}; // to contain multitudes of folders
    files: {name: string, id: string, options?: object}[];
}

interface ListDSInfo {
    path: string,
    suffix: string,
    id: string
}

interface FileManagerPathNode {
    pathName: string;
    isDir: boolean;
    timestamp: number;
    size: number;
    isSelected: boolean;
    sortBy: FileManagerField;
    sortDescending: boolean;
    isSorted: boolean;
    parent: FileManagerPathNode;
    children: Map<string, FileManagerPathNode>;
}

interface FileManagerHistoryNode {
    path: string;
    prev: FileManagerHistoryNode;
    next: FileManagerHistoryNode;
}

interface FileManagerPathItem {
    pathName: string;
    timestamp: number;
    size: number;
}

declare namespace Base64 {
    function encode(input: string): string;
    function decode(input: string): string;
    function _utf8_encode(input: string): string;
    function _utf8_decode(input: string): string;
}
/* ============== GLOBAL VARIABLES ============= */
declare var nw: any; // nw js for XD CE
interface Window {
    gMinModeOn: boolean;
    xcLocalStorage: any;
    xcSessionStorage: any;
}

declare var csLookup: string;
declare var planServer: string;
declare var unitTestMode: boolean;
declare var isBrowserIE: boolean;
declare var isBrowserChrome: boolean;
declare var KB: number
declare var MB: number;
declare var GB: number;
declare var TB: number;
declare var PB: number;
declare var gScrollbarWidth: number;
declare var gMaxDivHeight: number;
declare var gMaxEntriesPerPage: number;
declare var gMinRowsPerScreen: number;
declare var gFirstRowPositionTop: number;
declare var gPrefixLimit: number;
declare var gMouseEvents: MouseEvents;
declare var gMouseStatus: string;
declare var gRescol: {
    minCellHeight: number
    cellMinWidth: number
    clicks: number
    delay: number
    timer: number
};
declare var gKVScope: {
    GLOB: number,
    USER: number,
    WKBK: number
};
declare var gTables: object;
declare var gOrphanTables: string[];
declare var gDroppedTables: object;
declare var gActiveTableId: TableId;
declare var gIsTableScrolling: boolean;
declare var gMinModeOn: boolean;
declare var gMutePromises: boolean;
declare var gAggVarPrefix: string;
declare var gColPrefix: string;
declare var gPrefixSign: string;
declare var gRetSign: string;
declare var gDSPrefix: string;
declare var gRetinaPrefix: string;
declare var gParamStart: string;
declare var gHiddenColumnWidth: number | string;
declare var gUploadChunkSize: number;
declare var gDefaultSharedRoot: string;
declare var gJoinLookup: object;
declare var gAlwaysDelete: boolean;
declare var gDefaultQDelim: string;
declare var gLongTestSuite: number;
declare var gMaxDSColsSpec: number;
declare var gMaxColToPull: number;
declare var gMaxSampleSize: number;
declare var gUdfDefaultNoCheck: boolean;
declare var gXcSupport: boolean;
declare var gXcalarRecordNum: string;
declare var gXcalarApiLrqExportPrefix: string;
declare var gDFSuffix: string;
declare var gShowSQLDF: boolean;

declare var gBuildNumber: number;
declare var gGitVersion: number;
declare var XcalarApisTStr: object;
declare var StatusTStr: { [key: string]: string };
declare var xcLocalStorage: XcStorage;
declare var xcSessionStorage: XcStorage;
declare var global: any;
declare var expHost: string;
declare var sqlMode: boolean;
declare var gPatchVersion: string;

declare var skRFPredictor: any;

declare var isBrowserSafari: boolean;
declare var isBrowserFirefox: boolean;
declare var isSystemMac: boolean;

declare var getTHandle: any;
declare var setupThrift: any;
declare var setupHostName: any;
declare var XcalarGetVersion: any;
declare var XcalarGetLicense: any;
declare var XcalarGetNodeName: any;
declare var XcalarUpdateLicense: any;
declare var XcalarPreview: any;
declare var XcalarParseDSLoadArgs: any;
declare var XcalarDatasetCreate: any;
declare var XcalarDatasetRestore: any;
declare var XcalarDatasetDelete: any;
declare var XcalarDatasetActivate: any;
declare var XcalarDatasetLoad: any;
declare var XcalarDatasetDeactivate: any;
declare var XcalarDatasetDeleteLoadNode: any;
declare var XcalarDatasetGetLoadArgs: any;
declare var XcalarAddLocalFSExportTarget: any;
declare var XcalarAddUDFExportTarget: any;
declare var XcalarRemoveExportTarget: any;
declare var XcalarListExportTargets: any;
declare var XcalarExport: any;
declare var XcalarDriverCreate: any;
declare var XcalarDriverDelete: any;
declare var XcalarDriverList: any;
declare var XcalarIndexFromDataset: any;
declare var XcalarIndexFromTable: any;
declare var XcalarDeleteTable: any;
declare var XcalarDeleteConstants: any;
declare var XcalarRenameTable: any;
declare var XcalarFetchData: any;
declare var XcalarGetConfigParams: any;
declare var XcalarSetConfigParams: any;
declare var XcalarGetDatasetCount: any;
declare var XcalarGetDatasetMeta: any;
declare var XcalarGetTableMeta: any;
declare var XcalarGetTableCount: any;
declare var XcalarGetDatasets: any;
declare var XcalarGetDatasetUsers: any;
declare var XcalarGetDatasetsInfo: any;
declare var XcalarGetConstants: any;
declare var XcalarGetTables: any;
declare var XcalarGetDSNode: any;
declare var XcalarShutdown: any;
declare var XcalarGetStats: any;
declare var XcalarMakeResultSetFromTable: any;
declare var XcalarMakeResultSetFromDataset: any;
declare var XcalarSetAbsolute: any;
declare var XcalarGetNextPage: any;
declare var XcalarSetFree: any;
declare var XcalarFilter: any;
declare var XcalarMapWithInput: any;
declare var XcalarMap: any;
declare var XcalarAggregate: any;
declare var XcalarJoin: any;
declare var XcalarGroupByWithInput: any;
declare var XcalarGroupByWithEvalStrings: any;
declare var XcalarGroupBy: any;
declare var XcalarProject: any;
declare var XcalarUnion: any;
declare var XcalarGenRowNum: any;
declare var XcalarArchiveTable: any;
declare var XcalarQuery: any;
declare var XcalarQueryState: any;
declare var XcalarQueryCheck: any;
declare var XcalarQueryWithCheck: any;
declare var XcalarQueryCancel: any;
declare var XcalarQueryDelete: any;
declare var XcalarQueryList: any;
declare var XcalarCancelOp: any;
declare var XcalarGetDag: any;
declare var XcalarTagDagNodes: any;
declare var XcalarCommentDagNodes: any;
declare var XcalarListFiles: any;
declare var XcalarSynthesize: any;
declare var XcalarMakeRetina: any;
declare var XcalarListRetinas: any;
declare var XcalarGetRetina: any;
declare var XcalarGetRetinaJson: any;
declare var XcalarUpdateRetina: any;
declare var XcalarExecuteRetina: any;
declare var XcalarListParametersInRetina: any;
declare var XcalarDeleteRetina: any;
declare var XcalarImportRetina: any;
declare var XcalarExportRetina: any;
declare var XcalarDeleteSched: any;
declare var XcalarCreateSched: any;
declare var XcalarUpdateSched: any;
declare var XcalarListSchedules: any;
declare var XcalarPauseSched: any;
declare var XcalarResumeSched: any;
declare var XcalarKeyLookup: any;
declare var XcalarKeyList: any;
declare var XcalarKeyPut: any;
declare var XcalarKeyDelete: any;
declare var XcalarKeySetIfEqual: any;
declare var XcalarKeySetBothIfEqual: any;
declare var XcalarKeyAppend: any;
declare var XcalarGetOpStats: any;
declare var XcalarApiTop: any;
declare var XcalarGetMemoryUsage: any;
declare var XcalarGetAllTableMemory: any;
declare var XcalarListXdfs: any;
declare var XcalarUdfGetRes: any;
declare var XcalarUploadPythonRejectDuplicate: any;
declare var XcalarUploadPython: any;
declare var XcalarUpdatePython: any;
declare var XcalarDeletePython: any;
declare var XcalarDownloadPython: any;
declare var XcalarGetQuery: any;
declare var XcalarNewWorkbook: any;
declare var XcalarDeleteWorkbook: any;
declare var XcalarDeactivateWorkbook: any;
declare var XcalarListWorkbooks: any;
declare var XcalarSaveWorkbooks: any;
declare var XcalarActivateWorkbook: any;
declare var XcalarRenameWorkbook: any;
declare var XcalarUploadWorkbook: any;
declare var XcalarDownloadWorkbook: any;
declare var XcalarDetachWorkbook: any;
declare var XcalarGetStatGroupIdMap: any;
declare var XcalarSupportGenerate: any;
declare var XcalarAppSet: any;
declare var XcalarAppRun: any;
declare var XcalarAppReap: any;
declare var XcalarAppExecute: any;
declare var XcalarLogLevelGet: any;
declare var XcalarLogLevelSet: any;
declare var XcalarRuntimeSetParam: any;
declare var XcalarRuntimeGetParam: any;
declare var XcalarTargetCreate: any;
declare var XcalarTargetDelete: any;
declare var XcalarTargetList: any;
declare var XcalarTargetTypeList: any;
declare var XcalarListPublishedTables: any;
declare var XcalarUnpublishTable: any;
declare var XcalarPublishTable: any;
declare var XcalarPublishTableChangeOwner: any;
declare var XcalarUpdateTable: any;
declare var XcalarRefreshTable: any;
declare var XcalarRestoreTable: any;
declare var XcalarCoalesce: any;
declare var XcalarDriverList: any;
declare var XcalarDriverCreate: any;
declare var XcalarDriverDelete: any;
declare var XcalarGetTableRefCount: any;

declare var isBrowserMicrosoft: boolean;

declare var mixpanel: any;
/* ============== GLOBAL FUNCTIONS ============= */
// Declaration of XcalarApi moved to IXcalarApi.ts
/* ============= THRIFT ENUMS ================= */
declare enum XcalarApiWorkbookScopeT {
    XcalarApiWorkbookScopeGlobal,
    XcalarApiWorkbookScopeSession
}

// declare enum XcalarApisT {
//     XcalarApiJoin = 15,
//     XcalarApiBulkLoad = 2,
//     XcalarApiExport = 33
// }

declare enum StatusT {
    StatusCanceled,
    StatusAlreadyIndexed,
    StatusCannotReplaceKey,
    StatusSessionUsrAlreadyExists,
    StatusDsODBCTableExists,
    StatusExist,
    StatusExportSFFileExists,
    StatusSessionNotFound,
    StatusKvEntryNotEqual,
    StatusOperationHasFinished,
    StatusQrQueryNotExist,
    StatusDagNodeNotFound,
    StatusUdfExecuteFailed,
    StatusOk,
    StatusConnReset,
    StatusConnRefused,
    StatusDgNodeInUse,
    StatusKvEntryNotFound,
    StatusKvStoreNotFound,
    StatusUdfModuleAlreadyExists,
    StatusUdfModuleEmpty,
    StatusQrQueryAlreadyExists,
    StatusInvalidResultSetId,
    StatusNoBufs,
    StatusUdfModuleNotFound,
    StatusDatasetNameAlreadyExists,
    StatusSessListIncomplete,
    StatusRetinaAlreadyExists,
    StatusRetinaInUse,
    StatusDsNotFound,
    StatusJsonQueryParseError,
    StatusRetinaNotFound,
    StatusDatasetAlreadyDeleted,
    StatusDsDatasetInUse,
    StatusNsNotFound,
    StatusNoEnt,
    StatusIsDir,
    StatusAllFilesEmpty
}

declare enum FunctionCategoryT {
    FunctionCategoryAggregate,
    FunctionCategoryCondition,
    FunctionCategoryUdf
}

declare enum FunctionCategoryTStr {}

declare enum DgDagStateT {
    DgDagStateReady,
    DgDagStateDropped,
    DgDagStateError,
    DgDagStateProcessing,
    DgDagStateUnknown,
    DgDagStateQueued,
    DgDagStateArchiveError
}
declare enum DgDagStateTStr {}

// declare enum CsvSchemaModeT {
//     CsvSchemaModeNoneProvided
// }

declare var XcalarApisTFromStr: any;

declare namespace XcalarApisConstantsT {
    export var XcalarApiMaxTableNameLen: number;
    export var XcalarApiMaxFieldNameLen: number;
    export var XcalarApiMaxEvalStringLen: number;
    export var XcalarApiMaxEvalStirngLen: number;
    export var XcalarApiDefaultTopIntervalInMs: number;
    export var XcalarApiMaxUdfModuleNameLen: number;
    export var XcalarApiMaxUdfSourceLen: number;
    export var XcalarApiMaxDagNodeCommentLen: number;
}

declare enum JoinOperatorTStr {
    LeftAntiSemiJoin = 'Left Anti Semi Join'
}

// Order doesn't matter since this is just a header file.
declare enum JoinOperatorT {
    InnerJoin,
    LeftOuterJoin,
    RightOuterJoin,
    FullOuterJoin,
    CrossJoin,
    LeftSemiJoin,
    LeftAntiJoin
}

declare enum JoinOperatorTFromStr {
    innerJoin,
    leftJoin,
    rightJoin,
    fullOuterJoin,
    crossJoin,
    leftSemiJoin,
    leftAntiJoin
}

declare enum UnionOperatorTStr {

}

declare enum UnionOperatorT {
    UnionStandard,
    UnionIntersect,
    UnionExcept
}

declare enum XcalarApiVersionTStr{}
declare enum XcalarApiVersionT{
    XcalarApiVersionSignature
}

declare enum QueryStateT{
    qrNotStarted,
    qrProcessing,
    qrFinished,
    qrError,
    qrCancelled
}

declare enum QueryStateTStr {

}

declare var XcalarOrderingTFromStr: any;
/* ============= JSTSTR ==================== */
declare namespace XcalarEvalArgTypeT {
    export var OptionalArg: number;
    export var VariableArg: number;
}
/* ============== CLASSES ====================== */
declare class XcStorage {
    public getItem(key: string): string;
    public setItem(key: string, value: string): boolean;
    public removeItem(key: string): boolean;
}

declare class XEvalParser {
    public parseEvalStr(evlStr: string): ParsedEval;
}

/* ============== NAMESPACE ====================== */
declare namespace UserSettings {
    export function getPref(prop: string): any;
    export function commit(showSuccess?: boolean, hasDSChange?: boolean, isPersonalChange?: boolean): XDPromise<void>;
    export function restore(oldMeta: UserInfo, gInfosSetting: object): XDPromise<void>;
    export function sync(): void;
    export function setPref(name: string, val: string | number | boolean, something?: boolean): void;
    export function getAllPrefs(): UserPref;
}

declare namespace Admin {
    export function initialize(): void;
    export function showSupport();
    export function updateLoggedInUsers(userInfos: object): void;
    export function isAdmin(): boolean;
    export function addNewUser(): void;
}

declare namespace PromiseHelper {
    export function deferred<T>(): XDDeferred<T>;
    export function reject<T>(...args): XDPromise<T>;
    export function resolve<T>(...args): XDPromise<T>;
    export function alwaysResolve<T>(...args): XDPromise<T>;
    export function when<T>(...args): XDPromise<T>;
    export function chain<T>(...args): XDPromise<T>;
}

declare namespace Repeat {
    export function run(log: XcLog): XDPromise<void>;
}

declare namespace Undo {
    export function run(log: XcLog, isMostRecent?: boolean): XDPromise<void>;
}

declare namespace Redo {
    export function run(log: XcLog): XDPromise<void>;
}


declare namespace SupTicketModal {
    export function setup(): void;
    export function show(): void;
}

declare namespace MonitorGraph {
    export function stop(): void;
    export function tableUsageChange(): void;
}

declare namespace TblAnim {
    export function startRowResize($el: JQuery, event: JQueryMouseEventObject): void;
    export function startColResize($el: JQuery, event: JQueryMouseEventObject, options: object): void;
    export function startColDrag($headCol: JQuery, event: JQueryEventObject): void;
}

declare namespace TPrefix {
    export function restore(oldMeat: object): void;
    export function setup(): void;
}

declare namespace Aggregates {
    export function restore(oldMeat: object): void;
    export function getAgg(tableId: TableId, backColName: string, aggrOp: string): any
    export function addAgg(aggRes: object, isTemp: boolean): void;
    export function getNamedAggs(): any[];
}

declare namespace MainMenu {
    export function setup(): void;
    export function getOffset(): number;
    export function openPanel(panelId: string, subTabId?: string): void;
    export function tempNoAnim(): void;
    export function close(noAnim?: boolean, makeInactive?: boolean): void;
    export function setFormOpen(): void;
    export function setFormClose(): void;
    export function isFormOpen(): boolean;
    export function isMenuOpen(type: string): boolean;
    export function open(noAnim?: boolean): void;
    export function getState(): object;
    export function restoreState(state: object, ignoreClose?: boolean): void;
    export function closeForms(): void;
    export function registerPanels(panels: BaseOpPanel): void;
    export function checkMenuAnimFinish(): XDPromise<void>;
    export function switchMode(): XDPromise<void>;
    export function isMenuOpen(): boolean;
    export function openDefaultPanel(): void;
}

declare namespace BottomMenu {
    export function setup(): void;
    export function initialize(): void;
    export function unsetMenuCache(): void;
    export function openSection(index: number): void;
    export function close(something?: boolean): void;
}

declare namespace DSForm {
    export function setup(): void;
    export function hide(): void;
    export function show(createTableMode: boolean): void;
    export function switchView(view: string);
    export var View: any;
}

declare namespace Profile {
    export function setup(): void;
    export function restore(oldMeat: object): void;
    export function copy(tableId: TableId, newTableId: TableId): void;
    export function show(tableId: TableId, colNum: number): void;
    export function deleteCache(tableId: TableId): void;
    export function getCache(): any;
}

declare namespace JupyterUDFModal {
    export function setup(): void;
    export function show(type: string, params?: any): void;
}

declare namespace JupyterPanel {
    export function setup(): void;
    export function appendStub(stubName: string, args?: object): void;
    export function newWorkbook(workbookName: string): XDPromise<string>;
    export function renameWorkbook(jupyterFolder: string, newName: string): XDPromise<string>;
    export function deleteWorkbook(workbookId: string): void;
    export function updateFolderName(newFoldername: string): void;
    export function copyWorkbook(oldJupyterFolder: string, newJupyterFolder: string): void;
    export function initialize(noRestore?: boolean): void;
    export function publishTable(tableName: string, numRows?: number, hasVerifiedNames?: boolean): void;
}

declare namespace MonitorPanel {
    export function setup(): void;
    export function inActive(): void;
    export function active(): void;
    export function isGraphActive(): boolean;
}

declare namespace MonitorConfig {
    export function refreshParams(firstTouch: boolean): XDPromise<{}>;
}


declare namespace TutorialsSetup {
    export function setup(): void;
}

declare namespace xcMixpanel {
    export function setup(): void;
    export function forDev(): boolean;
}

declare namespace DSTargetManager {
    export function setup(): void;
    export function getTargetTypeList(): XDPromise<void>;
    export function clickFirstGrid(): void;
    export function getTarget(targetName: string): object;
    export function getAllTargets(): object[];
    export function refreshTargets(noWaitIcon: boolean): object[];
    export function updateUDF(listXdfsObj: any);
    export function isSlowPreviewTarget(targetName: string): boolean;
    export function isSparkParquet(targetName: string): boolean;
    export function isGeneratedTarget(targetName: string): boolean;
    export function isDatabaseTarget(targetName: string): boolean;
}

declare namespace JSONModal {
    export function setup(): void;
    export function show($td: JQuery, options: object): void
    export function rehighlightTds($table: JQuery): void;
}

declare namespace AggModal {
    export function setup(): void;
    export function corrAgg(tableId: TableId, vertColNums?: number[], horColNums?: number[]): void;
}

declare namespace FileBrowser {
    export function restore(): void;
    export function close(): void;
    export function show(targetName: string, path: string, flag: boolean);
    export function clear(): void
}

declare namespace ExtensionManager {
    export function setup(): XDPromise<void>;
    export function openView(colNum: number, tableId: TableId): void;
    export function triggerFromDF(moduleName: string, funcName: string, args: object): XDPromise<string>;
    export function getEnabledExtensions(): ExtensionInfo[]
}

declare namespace ExtensionPanel {
    export function setup(): void;
}

declare namespace ExtModal {
    export function setup(): void;
}
declare namespace LicenseModal {
    export function setup(): void;
}

declare namespace FileInfoModal {
    export function setup(): void;
}

declare namespace DSInfoModal {
    export function setup(): void;
}

declare namespace LoginConfigModal {
    export function setup(): void;
}

declare namespace LiveHelpModal {
    export function setup(): void;
    export function show(): void;
    export function userLeft(): void;
}

declare namespace JupyterFinalizeModal {
    export function setup(): void;
    export function show(tableId: TableId, numRows: number): void;
}

declare namespace FileListModal {
    export function setup(): void;
    export function show(dsId: string, dsName: string, hasFileError: boolean): void;
}

declare namespace DSImportErrorModal {
    export function setup(): void;
    export function show(dsId: string, numTotalErrors: number, isRecordError: boolean): void
}

declare namespace MonitorLog {
    export function adjustTabNumber(): void;
}

declare namespace Msal {
    export class UserAgentApplication {
        public constructor(clientID: string, authority: any, authCallback: Function, options: object);
        public getUser(): string;
        public logout(): void;
    }
    export class Logger{
        public constructor(callback: Function, options: object);
    }
}

declare namespace XDParser {
    export var SqlParser: any;
    export var XEvalParser: XEvalParser;
}

declare namespace XcSDK {
    class Table {
        public constructor(tableName: string, worksheet: string, modelingMode: boolean);
        public getName(): string;
        public setCols(progCols: ProgCol[]): void;
    }
    class Column {
        public constructor(colName: string, colType: ColumnType);
        public getName(): string;
        public getType(): ColumnType;
    }
}

declare class SQLOptimizer {
    public addDrops(query: string): XDPromise<any>;
    public logicalOptimize(query: string, options: {}, prependQuery: string): string;
    public getAggregates(): string[];
}

