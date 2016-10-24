//
// Autogenerated by Thrift Compiler (0.9.2)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//


XcalarApisT = {
  'XcalarApiUnknown' : 0,
  'XcalarApiGetVersion' : 1,
  'XcalarApiBulkLoad' : 2,
  'XcalarApiIndex' : 3,
  'XcalarApiGetTableMeta' : 4,
  'XcalarApiShutdown' : 5,
  'XcalarApiGetStat' : 6,
  'XcalarApiGetStatByGroupId' : 7,
  'XcalarApiResetStat' : 8,
  'XcalarApiGetStatGroupIdMap' : 9,
  'XcalarApiListDagNodeInfo' : 10,
  'XcalarApiListDatasets' : 11,
  'XcalarApiShutdownLocal' : 12,
  'XcalarApiMakeResultSet' : 13,
  'XcalarApiResultSetNext' : 14,
  'XcalarApiJoin' : 15,
  'XcalarApiProject' : 16,
  'XcalarApiGetRowNum' : 17,
  'XcalarApiFilter' : 18,
  'XcalarApiGroupBy' : 19,
  'XcalarApiResultSetAbsolute' : 20,
  'XcalarApiFreeResultSet' : 21,
  'XcalarApiDeleteObjects' : 22,
  'XcalarApiGetTableRefCount' : 23,
  'XcalarApiMap' : 24,
  'XcalarApiAggregate' : 25,
  'XcalarApiQuery' : 26,
  'XcalarApiQueryState' : 27,
  'XcalarApiQueryCancel' : 28,
  'XcalarApiQueryDelete' : 29,
  'XcalarApiAddExportTarget' : 30,
  'XcalarApiRemoveExportTarget' : 31,
  'XcalarApiListExportTargets' : 32,
  'XcalarApiExport' : 33,
  'XcalarApiGetDag' : 34,
  'XcalarApiListFiles' : 35,
  'XcalarApiStartNodes' : 36,
  'XcalarApiMakeRetina' : 37,
  'XcalarApiListRetinas' : 38,
  'XcalarApiGetRetina' : 39,
  'XcalarApiDeleteRetina' : 40,
  'XcalarApiUpdateRetina' : 41,
  'XcalarApiListParametersInRetina' : 42,
  'XcalarApiExecuteRetina' : 43,
  'XcalarApiImportRetina' : 44,
  'XcalarApiKeyLookup' : 45,
  'XcalarApiKeyAddOrReplace' : 46,
  'XcalarApiKeyDelete' : 47,
  'XcalarApiGetNumNodes' : 48,
  'XcalarApiTop' : 49,
  'XcalarApiMemory' : 50,
  'XcalarApiListXdfs' : 51,
  'XcalarApiRenameNode' : 52,
  'XcalarApiSessionNew' : 53,
  'XcalarApiSessionList' : 54,
  'XcalarApiSessionRename' : 55,
  'XcalarApiSessionSwitch' : 56,
  'XcalarApiSessionDelete' : 57,
  'XcalarApiSessionInfo' : 58,
  'XcalarApiSessionInact' : 59,
  'XcalarApiSessionPersist' : 60,
  'XcalarApiGetQuery' : 61,
  'XcalarApiCreateDht' : 62,
  'XcalarApiKeyAppend' : 63,
  'XcalarApiKeySetIfEqual' : 64,
  'XcalarApiDeleteDht' : 65,
  'XcalarApiSupportGenerate' : 66,
  'XcalarApiSchedTaskCreate' : 67,
  'XcalarApiSchedTaskList' : 68,
  'XcalarApiDeleteSchedTask' : 69,
  'XcalarApiUdfAdd' : 70,
  'XcalarApiUdfUpdate' : 71,
  'XcalarApiUdfGet' : 72,
  'XcalarApiUdfDelete' : 73,
  'XcalarApiCancelOp' : 74,
  'XcalarApiGetPerNodeOpStats' : 75,
  'XcalarApiGetOpStats' : 76,
  'XcalarApiErrorpointSet' : 77,
  'XcalarApiErrorpointList' : 78,
  'XcalarApiPreview' : 79,
  'XcalarApiExportRetina' : 80,
  'XcalarApiStartFuncTests' : 81,
  'XcalarApiListFuncTests' : 82,
  'XcalarApiDeleteDatasets' : 83,
  'XcalarApiGetConfigParams' : 84,
  'XcalarApiSetConfigParam' : 85,
  'XcalarApiAppSet' : 86,
  'XcalarApiGetLicense' : 87,
  'XcalarApiAppRun' : 88,
  'XcalarApiAppReap' : 89,
  'XcalarApiFunctionInvalid' : 90
};
XcalarApisTStr = {0 : 'XcalarApiUnknown',
1 : 'XcalarApiGetVersion',
2 : 'XcalarApiBulkLoad',
3 : 'XcalarApiIndex',
4 : 'XcalarApiGetTableMeta',
5 : 'XcalarApiShutdown',
6 : 'XcalarApiGetStat',
7 : 'XcalarApiGetStatByGroupId',
8 : 'XcalarApiResetStat',
9 : 'XcalarApiGetStatGroupIdMap',
10 : 'XcalarApiListDagNodeInfo',
11 : 'XcalarApiListDatasets',
12 : 'XcalarApiShutdownLocal',
13 : 'XcalarApiMakeResultSet',
14 : 'XcalarApiResultSetNext',
15 : 'XcalarApiJoin',
16 : 'XcalarApiProject',
17 : 'XcalarApiGetRowNum',
18 : 'XcalarApiFilter',
19 : 'XcalarApiGroupBy',
20 : 'XcalarApiResultSetAbsolute',
21 : 'XcalarApiFreeResultSet',
22 : 'XcalarApiDeleteObjects',
23 : 'XcalarApiGetTableRefCount',
24 : 'XcalarApiMap',
25 : 'XcalarApiAggregate',
26 : 'XcalarApiQuery',
27 : 'XcalarApiQueryState',
28 : 'XcalarApiQueryCancel',
29 : 'XcalarApiQueryDelete',
30 : 'XcalarApiAddExportTarget',
31 : 'XcalarApiRemoveExportTarget',
32 : 'XcalarApiListExportTargets',
33 : 'XcalarApiExport',
34 : 'XcalarApiGetDag',
35 : 'XcalarApiListFiles',
36 : 'XcalarApiStartNodes',
37 : 'XcalarApiMakeRetina',
38 : 'XcalarApiListRetinas',
39 : 'XcalarApiGetRetina',
40 : 'XcalarApiDeleteRetina',
41 : 'XcalarApiUpdateRetina',
42 : 'XcalarApiListParametersInRetina',
43 : 'XcalarApiExecuteRetina',
44 : 'XcalarApiImportRetina',
45 : 'XcalarApiKeyLookup',
46 : 'XcalarApiKeyAddOrReplace',
47 : 'XcalarApiKeyDelete',
48 : 'XcalarApiGetNumNodes',
49 : 'XcalarApiTop',
50 : 'XcalarApiMemory',
51 : 'XcalarApiListXdfs',
52 : 'XcalarApiRenameNode',
53 : 'XcalarApiSessionNew',
54 : 'XcalarApiSessionList',
55 : 'XcalarApiSessionRename',
56 : 'XcalarApiSessionSwitch',
57 : 'XcalarApiSessionDelete',
58 : 'XcalarApiSessionInfo',
59 : 'XcalarApiSessionInact',
60 : 'XcalarApiSessionPersist',
61 : 'XcalarApiGetQuery',
62 : 'XcalarApiCreateDht',
63 : 'XcalarApiKeyAppend',
64 : 'XcalarApiKeySetIfEqual',
65 : 'XcalarApiDeleteDht',
66 : 'XcalarApiSupportGenerate',
67 : 'XcalarApiSchedTaskCreate',
68 : 'XcalarApiSchedTaskList',
69 : 'XcalarApiDeleteSchedTask',
70 : 'XcalarApiUdfAdd',
71 : 'XcalarApiUdfUpdate',
72 : 'XcalarApiUdfGet',
73 : 'XcalarApiUdfDelete',
74 : 'XcalarApiCancelOp',
75 : 'XcalarApiGetPerNodeOpStats',
76 : 'XcalarApiGetOpStats',
77 : 'XcalarApiErrorpointSet',
78 : 'XcalarApiErrorpointList',
79 : 'XcalarApiPreview',
80 : 'XcalarApiExportRetina',
81 : 'XcalarApiStartFuncTests',
82 : 'XcalarApiListFuncTests',
83 : 'XcalarApiDeleteDatasets',
84 : 'XcalarApiGetConfigParams',
85 : 'XcalarApiSetConfigParam',
86 : 'XcalarApiAppSet',
87 : 'XcalarApiGetLicense',
88 : 'XcalarApiAppRun',
89 : 'XcalarApiAppReap',
90 : 'XcalarApiFunctionInvalid'
};
