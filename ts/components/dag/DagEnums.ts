enum DagNodeType {
    Aggregate = "aggregate",
    Custom = "custom",
    CustomInput = "customInput",
    CustomOutput = "customOutput",
    Dataset = "dataset",
    DFIn = "link in",
    DFOut = "link out",
    Explode = "explode",
    Export = "export",
    Extension = "extension",
    Filter = "filter",
    GroupBy = "groupBy",
    IMDTable = "IMDTable",
    Index = "index",
    Join = "join",
    Jupyter = "Jupyter",
    Map = "map",
    Project = "project",
    PublishIMD = "publishIMD",
    Round = "round",
    RowNum = "rowNum",
    Set = "set",
    Sort = "sort",
    Source = "source",
    Split = "split",
    SQL = "sql",
    SQLSubInput = "SQLSubInput",
    SQLSubOutput = "SQLSubOutput",
    SubGraph = "subGraph",
    Placeholder = "placeholder",
    Synthesize = "synthesize",
    UpdateIMD = "updateIMD",
    SQLFuncIn = "SQLFuncIn",
    SQLFuncOut = "SQLFuncOut"
}

enum DagNodeSubType {
    Cast = "cast",
    LookupJoin = "LookupJoin",
    FilterJoin = "FilterJoin",
    Union = "Union",
    Intersect = "Intersect",
    Except = "Except",
    ExportOptimized = "Export Optimized",
    DFOutOptimized = "link out Optimized",
}

enum DagNodeState {
    Unused = "Unused",
    Configured = "Configured",
    Running = "Running",
    Complete = "Complete",
    Error = "Error"
}

enum DagNodeErrorType {
    Unconfigured = "Unconfigured",
    MissingSource = "Missing Source",
    Invalid = "Invalid Configuration",
    NoGraph = "Cannot find linked graph",
    NoAggNode = "Corresponding aggregate node either doesnt exist or must be executed manually",
    AggNotExecute = "Must execute the aggregate manually before using it",
    CycleInLink = "Cycle In Link",
    LinkOutNotExecute = "The linked node only allow linking after execution",
    InvalidOptimizedOutNode = "Valid terminal nodes must be either Export optimized or Link out optimized",
    InvalidOptimizedOutNodeCombo = "Optimized dataflow cannot have both Export and Link Out nodes",
    InvalidOptimizedLinkOutCount = "Optimized dataflow cannot have multiple Link Out nodes",
    Disjoint = "Multiple disjoint dataflows detected. Optimized execution can only occur on 1 continuous dataflow.",
    NoColumn = "Invalid column in the schema:\n",
    NoColumns = "Invalid columns in the schema:\n",
    NoAccessToSource = "User has no rights to accees the dataset",
    InvalidSQLFunc = "Invalid SQL Function",
}

enum DagNodeLinkInErrorType {
    NoGraph = "Cannot find linked graph",
    NoLinkInGraph = "Cannot find the linked node",
    MoreLinkGraph = "More than one link out node with the same name specified by the linked in node are found"
}

enum DagGraphEvents {
    LockChange = "GraphLockChange",
    TurnOffSave = "TurnOffSave",
    TurnOnSave = "TurnOnSave",
    Save = "Save",
    AddSQLFuncInput = "AddSQLFuncInput",
    RemoveSQLFucInput = "RemoveSQLFuncInput",
    AddBackSQLFuncInput = "AddBackSQLFuncInput",
}

enum DagNodeEvents {
    AggregateChange = "DagNodeAggregateChange",
    ConnectionChange = "ConnectionChange",
    DescriptionChange = "DescriptionChange",
    LineageSourceChange = "DagNodeLineageSourceChange",
    ParamChange = "DagNodeParamChange",
    StateChange = "DagNodeStateChange",
    ProgressChange = "DagNodeProgressChange",
    SubGraphConfigured = "SubGraphConfigured",
    SubGraphError = "SubGraphError",
    TableLockChange = "DagNodeTableLockChange",
    TableRemove = "TableRemove",
    TitleChange = "TitleChange",
    AutoExecute = "AutoExecute",
    RetinaRemove = "RetinaRemove"
}

enum DagCategoryType {
    Favorites = "favorites",
    In = "in",
    Out = "out",
    Value = "value",
    Operations = "operations",
    Column = "column",
    Join = "join",
    Set = "set",
    Extensions = "extensions",
    SQL = "SQL",
    Custom = "custom",
}

if (typeof exports !== 'undefined') {
    exports.DagNodeType = DagNodeType;
    exports.DagNodeSubType = DagNodeSubType;
    exports.DagNodeState = DagNodeState;
    exports.DagNodeEvents = DagNodeEvents;
}
