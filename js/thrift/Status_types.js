//
// Autogenerated by Thrift Compiler (0.9.2)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//


StatusT = {
  'StatusOk' : 0,
  'StatusPerm' : 1,
  'StatusNoEnt' : 2,
  'StatusSrch' : 3,
  'StatusIntr' : 4,
  'StatusIO' : 5,
  'StatusNxIO' : 6,
  'Status2Big' : 7,
  'StatusNoExec' : 8,
  'StatusBadF' : 9,
  'StatusChild' : 10,
  'StatusAgain' : 11,
  'StatusNoMem' : 12,
  'StatusAccess' : 13,
  'StatusFault' : 14,
  'StatusNotBlk' : 15,
  'StatusBusy' : 16,
  'StatusExist' : 17,
  'StatusEof' : 18,
  'StatusXDev' : 19,
  'StatusNoDev' : 20,
  'StatusNotDir' : 21,
  'StatusIsDir' : 22,
  'StatusInval' : 23,
  'StatusNFile' : 24,
  'StatusMFile' : 25,
  'StatusNoTTY' : 26,
  'StatusTxtBsy' : 27,
  'StatusFBig' : 28,
  'StatusNoSpc' : 29,
  'StatusSPipe' : 30,
  'StatusROFS' : 31,
  'StatusMLink' : 32,
  'StatusPipe' : 33,
  'StatusDom' : 34,
  'StatusRange' : 35,
  'StatusDeadLk' : 36,
  'StatusNameTooLong' : 37,
  'StatusNoLck' : 38,
  'StatusNoSys' : 39,
  'StatusNotEmpty' : 40,
  'StatusLoop' : 41,
  'StatusNoMsg' : 42,
  'StatusIdRm' : 43,
  'StatusChRng' : 44,
  'StatusL2NSync' : 45,
  'StatusL3Hlt' : 46,
  'StatusL3Rst' : 47,
  'StatusLNRng' : 48,
  'StatusUnatch' : 49,
  'StatusNoCSI' : 50,
  'StatusL2Hlt' : 51,
  'StatusBadE' : 52,
  'StatusBadR' : 53,
  'StatusXFull' : 54,
  'StatusNoAno' : 55,
  'StatusBadRqC' : 56,
  'StatusBadSlt' : 57,
  'StatusBFont' : 58,
  'StatusNoStr' : 59,
  'StatusNoData' : 60,
  'StatusTime' : 61,
  'StatusNoSR' : 62,
  'StatusNoNet' : 63,
  'StatusNoPkg' : 64,
  'StatusRemote' : 65,
  'StatusNoLink' : 66,
  'StatusAdv' : 67,
  'StatusSRMnt' : 68,
  'StatusComm' : 69,
  'StatusProto' : 70,
  'StatusMultihop' : 71,
  'StatusDotDot' : 72,
  'StatusBadMsg' : 73,
  'StatusOverflow' : 74,
  'StatusNotUniq' : 75,
  'StatusBadFD' : 76,
  'StatusRemChg' : 77,
  'StatusLibAcc' : 78,
  'StatusLibBad' : 79,
  'StatusLibScn' : 80,
  'StatusLibMax' : 81,
  'StatusLibExec' : 82,
  'StatusIlSeq' : 83,
  'StatusRestart' : 84,
  'StatusStrPipe' : 85,
  'StatusUsers' : 86,
  'StatusNotSock' : 87,
  'StatusDestAddrReq' : 88,
  'StatusMsgSize' : 89,
  'StatusPrototype' : 90,
  'StatusNoProtoOpt' : 91,
  'StatusProtoNoSupport' : 92,
  'StatusSockTNoSupport' : 93,
  'StatusOpNotSupp' : 94,
  'StatusPFNoSupport' : 95,
  'StatusAFNoSupport' : 96,
  'StatusAddrInUse' : 97,
  'StatusAddrNotAvail' : 98,
  'StatusNetDown' : 99,
  'StatusNetUnreach' : 100,
  'StatusNetReset' : 101,
  'StatusConnAborted' : 102,
  'StatusConnReset' : 103,
  'StatusNoBufs' : 104,
  'StatusIsConn' : 105,
  'StatusNotConn' : 106,
  'StatusShutdown' : 107,
  'StatusTooManyRefs' : 108,
  'StatusTimedOut' : 109,
  'StatusConnRefused' : 110,
  'StatusHostDown' : 111,
  'StatusHostUnreach' : 112,
  'StatusAlready' : 113,
  'StatusInProgress' : 114,
  'StatusStale' : 115,
  'StatusUClean' : 116,
  'StatusNotNam' : 117,
  'StatusNAvail' : 118,
  'StatusIsNam' : 119,
  'StatusRemoteIo' : 120,
  'StatusDQuot' : 121,
  'StatusNoMedium' : 122,
  'StatusMediumType' : 123,
  'StatusCanceled' : 124,
  'StatusNoKey' : 125,
  'StatusKeyExpired' : 126,
  'StatusKeyRevoked' : 127,
  'StatusKeyRejected' : 128,
  'StatusOwnerDead' : 129,
  'StatusNotRecoverable' : 130,
  'StatusRFKill' : 131,
  'StatusHwPoison' : 132,
  'StatusTrunc' : 133,
  'StatusUnimpl' : 134,
  'StatusUnknown' : 135,
  'StatusMsgLibDeleteFailed' : 136,
  'StatusThrCreateFailed' : 137,
  'StatusThrAborted' : 138,
  'StatusConfigLibDevOpenFailed' : 139,
  'StatusConfigLibDevLSeekFailed' : 140,
  'StatusConfigLibFlashDevOpenFailed' : 141,
  'StatusConfigLibFlashDevLSeekFailed' : 142,
  'StatusConfigLibDeleteFailed' : 143,
  'StatusUsrNodeIncorrectParams' : 144,
  'StatusUnicodeUnsupported' : 145,
  'StatusEAIBadFlags' : 146,
  'StatusEAINoName' : 147,
  'StatusEAIFail' : 148,
  'StatusEAIService' : 149,
  'StatusEAINoData' : 150,
  'StatusEAIAddrFamily' : 151,
  'StatusEAINotCancel' : 152,
  'StatusEAIAllDone' : 153,
  'StatusEAIIDNEncode' : 154,
  'StatusLast' : 155,
  'StatusMore' : 156,
  'StatusCliUnknownCmd' : 157,
  'StatusCliParseError' : 158,
  'StatusSchedQueueLenExceeded' : 159,
  'StatusMsgFail' : 160,
  'StatusMsgOutOfMessages' : 161,
  'StatusMsgShutdown' : 162,
  'StatusNoSuchNode' : 163,
  'StatusNewTableCreated' : 164,
  'StatusNoSuchResultSet' : 165,
  'StatusDfAppendUnsupported' : 166,
  'StatusDfRemoveUnsupported' : 167,
  'StatusDfParseError' : 168,
  'StatusDfRecordCorrupt' : 169,
  'StatusDfFieldNoExist' : 170,
  'StatusDfUnknownFieldType' : 171,
  'StatusDfRecordNotFound' : 172,
  'StatusDfValNotFound' : 173,
  'StatusDfInvalidFormat' : 174,
  'StatusDfLocalFatptrOnly' : 175,
  'StatusDfValuesBufTooSmall' : 176,
  'StatusDfMaxValuesPerFieldExceeded' : 177,
  'StatusDfFieldTypeUnsupported' : 178,
  'StatusDfMaxDictionarySegmentsExceeded' : 179,
  'StatusDfBadRecordId' : 180,
  'StatusDfMaxRecordsExceeded' : 181,
  'StatusDfTypeMismatch' : 182,
  'StatusDsTooManyKeyValues' : 183,
  'StatusDsNotFound' : 184,
  'StatusDsLoadAlreadyStarted' : 185,
  'StatusDsUrlTooLong' : 186,
  'StatusDsInvalidUrl' : 187,
  'StatusDsCreateNotSupported' : 188,
  'StatusDsUnlinkNotSupported' : 189,
  'StatusDsWriteNotSupported' : 190,
  'StatusDsSeekNotSupported' : 191,
  'StatusDsSeekFailed' : 192,
  'StatusDsMkDirNotSupported' : 193,
  'StatusDsLoadFailed' : 194,
  'StatusDsDatasetInUse' : 195,
  'StatusDsFormatTypeUnsupported' : 196,
  'StatusDsMysqlInitFailed' : 197,
  'StatusDsMysqlConnectFailed' : 198,
  'StatusDsMysqlQueryFailed' : 199,
  'StatusDsGetFileAttrNotSupported' : 200,
  'StatusDsGetFileAttrCompressed' : 201,
  'StatusReallocShrinkFailed' : 202,
  'StatusNsObjAlreadyExists' : 203,
  'StatusTableAlreadyExists' : 204,
  'StatusCliUnclosedQuotes' : 205,
  'StatusRangePartError' : 206,
  'StatusNewFieldNameIsBlank' : 207,
  'StatusNoDataDictForFormatType' : 208,
  'StatusBTreeNotFound' : 209,
  'StatusBTreeKeyTypeMismatch' : 210,
  'StatusBTreeDatasetMismatch' : 211,
  'StatusCmdNotComplete' : 212,
  'StatusInvalidResultSetId' : 213,
  'StatusPositionExceedResultSetSize' : 214,
  'StatusHandleInUse' : 215,
  'StatusCliLineTooLong' : 216,
  'StatusCliErrorReadFromFile' : 217,
  'StatusInvalidTableName' : 218,
  'StatusNsObjNameTooLong' : 219,
  'StatusApiUnexpectedEOF' : 220,
  'StatusStatsInvalidGroupId' : 221,
  'StatusStatsInvalidGroupName' : 222,
  'StatusInvalidHandle' : 223,
  'StatusThriftProtocolError' : 224,
  'StatusBTreeHasNoRoot' : 225,
  'StatusBTreeKeyNotFound' : 226,
  'StatusQaKeyValuePairNotFound' : 227,
  'StatusAstMalformedEvalString' : 228,
  'StatusAstNoSuchFunction' : 229,
  'StatusAstWrongNumberOfArgs' : 230,
  'StatusFieldNameTooLong' : 231,
  'StatusFieldNameAlreadyExists' : 232,
  'StatusXdfWrongNumberOfArgs' : 233,
  'StatusXdfUnaryOperandExpected' : 234,
  'StatusXdfTypeUnsupported' : 235,
  'StatusXdfDivByZero' : 236,
  'StatusXdfMixedTypeNotSupported' : 237,
  'StatusXdfAggregateOverflow' : 238,
  'StatusKvNotFound' : 239,
  'StatusXdbSlotPrettyVacant' : 240,
  'StatusNoDataInXdb' : 241,
  'StatusXdbLoadInProgress' : 242,
  'StatusXdbNotFound' : 243,
  'StatusXdbUninitializedCursor' : 244,
  'StatusQrTaskFailed' : 245,
  'StatusQrIdNonExist' : 246,
  'StatusQrJobNonExist' : 247,
  'StatusApiTaskFailed' : 248,
  'StatusAlreadyIndexed' : 249,
  'StatusEvalUnsubstitutedVariables' : 250,
  'StatusKvDstFull' : 251,
  'StatusModuleNotInit' : 252,
  'StatusMaxJoinFieldsExceeded' : 253,
  'StatusXdbKeyTypeAlreadySet' : 254,
  'StatusJoinTypeMismatch' : 255,
  'StatusJoinDhtMismatch' : 256,
  'StatusFailed' : 257,
  'StatusIllegalFileName' : 258,
  'StatusEmptyFile' : 259,
  'StatusEvalStringTooLong' : 260,
  'StatusTableDeleted' : 261,
  'StatusFailOpenFile' : 262,
  'StatusQueryFailed' : 263,
  'StatusCreateDagNodeFailed' : 264,
  'StatusDeleteDagNodeFailed' : 265,
  'StatusRenameDagNodeFailed' : 266,
  'StatusChangeDagNodeStateFailed' : 267,
  'StatusAggregateNoSuchField' : 268,
  'StatusAggregateLocalFnNeedArgument' : 269,
  'StatusAggregateAccNotInited' : 270,
  'StatusAggregateReturnValueNotScalar' : 271,
  'StatusNsMaximumObjectsReached' : 272,
  'StatusNsObjInUse' : 273,
  'StatusNsInvalidObjName' : 274,
  'StatusNsNotFound' : 275,
  'StatusDagNodeNotFound' : 276,
  'StatusUpdateDagNodeOperationNotSupported' : 277,
  'StatusMsgMaxPayloadExceeded' : 278,
  'StatusKvEntryNotFound' : 279,
  'StatusStatsCouldNotGetMemUsedInfo' : 280,
  'StatusStatusFieldNotInited' : 281,
  'StatusAggNoSuchFunction' : 282,
  'StatusWaitKeyTimeout' : 283,
  'StatusVariableNameTooLong' : 284,
  'StatusDgDagHandleNotFound' : 285,
  'StatusDgInvalidDagName' : 286,
  'StatusDgDagNameTooLong' : 287,
  'StatusDgDagAlreadyExists' : 288,
  'StatusDgDagEmpty' : 289,
  'StatusDgDagNotEmpty' : 290,
  'StatusDgDagNoMore' : 291,
  'StatusDgDagHandleReserved' : 292,
  'StatusDgNodeInUse' : 293,
  'StatusDgDagNodeError' : 294,
  'StatusDgOperationNotSupported' : 295,
  'StatusDgDagNodeNotReady' : 296,
  'StatusDsDatasetLoaded' : 297,
  'StatusDsDatasetNotReady' : 298,
  'StatusSessionNotFound' : 299,
  'StatusSessionExists' : 300,
  'StatusSessionNotInact' : 301,
  'StatusSessionNameInvalid' : 302,
  'StatusSessionError' : 303,
  'StatusDgDeleteOperationNotPermitted' : 304,
  'StatusPyExecFailure' : 305,
  'StatusPyExecFailedToCompile' : 306,
  'StatusPyExecFailedToImportModule' : 307,
  'StatusPyExecFailedToGetModuleDict' : 308,
  'StatusPyExecFailedToGetFnName' : 309,
  'StatusPyExecNoSuchFunction' : 310,
  'StatusPyExecFailedToAllocTuple' : 311,
  'StatusPyExecFailedToGetPyString' : 312,
  'StatusPyExecFailedToGetPySignedLong' : 313,
  'StatusPyExecFailedToGetPyUnsignedLong' : 314,
  'StatusPyExecFailedToGetPyFloat' : 315,
  'StatusPyExecFailedToSetTuple' : 316,
  'StatusPyExecFunctionCallFailed' : 317,
  'StatusPyExecFailedToGetArgCount' : 318,
  'StatusPyExecTooManyArgs' : 319,
  'StatusPyExecFailedToGetCodeObject' : 320,
  'StatusPyExecFailedToGetArgNames' : 321,
  'StatusPyExecUnsupportedType' : 322,
  'StatusPyExecFunctionNotCallable' : 323,
  'StatusPyExecFailedToGetCoFlags' : 324,
  'StatusPyExecFailedToGetCString' : 325,
  'StatusXcalarEvalTokenNameTooLong' : 326,
  'StatusNoConfigFile' : 327,
  'StatusCouldNotResolveSchema' : 328,
  'StatusLogChecksumFailed' : 329
};
StatusTStr = {0 : 'Success',
1 : 'Operation not permitted',
2 : 'No such file or directory',
3 : 'No such process',
4 : 'Interrupted system call',
5 : 'I/O error',
6 : 'No such device or address',
7 : 'Argument list too long',
8 : 'Exec format error',
9 : 'Bad file number',
10 : 'No child processes',
11 : 'Try again',
12 : 'Out of memory',
13 : 'Permission denied',
14 : 'Bad address',
15 : 'Block device required',
16 : 'Device or resource busy',
17 : 'File exists',
18 : 'End of file',
19 : 'Cross-device link',
20 : 'No such device',
21 : 'Not a directory',
22 : 'Is a directory',
23 : 'Invalid argument',
24 : 'File table overflow',
25 : 'Too many open files',
26 : 'Not a typewriter',
27 : 'Text file busy',
28 : 'File too large',
29 : 'No space left on device',
30 : 'Illegal seek',
31 : 'Read-only file system',
32 : 'Too many links',
33 : 'Broken pipe',
34 : 'Math argument out of domain of func',
35 : 'Math result not representable',
36 : 'Resource deadlock would occur',
37 : 'File name too long',
38 : 'No record locks available',
39 : 'Function not implemented',
40 : 'Directory not empty',
41 : 'Too many symbolic links encountered',
42 : 'No message of desired type',
43 : 'Identifier removed',
44 : 'Channel number out of range',
45 : 'Level 2 not synchronized',
46 : 'Level 3 halted',
47 : 'Level 3 reset',
48 : 'Link number out of range',
49 : 'Protocol driver not attached',
50 : 'No CSI structure available',
51 : 'Level 2 halted',
52 : 'Invalid exchange',
53 : 'Invalid request descriptor',
54 : 'Exchange full',
55 : 'No anode',
56 : 'Invalid request code',
57 : 'Invalid slot',
58 : 'Bad font file format',
59 : 'Device not a stream',
60 : 'No data available',
61 : 'Timer expired',
62 : 'Out of streams resources',
63 : 'Machine is not on the network',
64 : 'Package not installed',
65 : 'Object is remote',
66 : 'Link has been severed',
67 : 'Advertise error',
68 : 'Srmount error',
69 : 'Communication error on send',
70 : 'Protocol error',
71 : 'Multihop attempted',
72 : 'RFS specific error',
73 : 'Not a data message',
74 : 'Value too large for defined data type',
75 : 'Name not unique on network',
76 : 'File descriptor in bad state',
77 : 'Remote address changed',
78 : 'Can not access a needed shared library',
79 : 'Accessing a corrupted shared library',
80 : '.lib section in a.out corrupted',
81 : 'Attempting to link in too many shared libraries',
82 : 'Cannot exec a shared library directly',
83 : 'Illegal byte sequence',
84 : 'Interrupted system call should be restarted',
85 : 'Streams pipe error',
86 : 'Too many users',
87 : 'Socket operation on non-socket',
88 : 'Destination address required',
89 : 'Message too long',
90 : 'Protocol wrong type for socket',
91 : 'Protocol not available',
92 : 'Protocol not supported',
93 : 'Socket type not supported',
94 : 'Operation not supported on transport endpoint',
95 : 'Protocol family not supported',
96 : 'Address family not supported by protocol',
97 : 'Address already in use',
98 : 'Cannot assign requested address',
99 : 'Network is down',
100 : 'Network is unreachable',
101 : 'Network dropped connection because of reset',
102 : 'Software caused connection abort',
103 : 'Connection reset by peer',
104 : 'No buffer space available',
105 : 'Transport endpoint is already connected',
106 : 'Transport endpoint is not connected',
107 : 'Cannot send after transport endpoint shutdown',
108 : 'Too many references: cannot splice',
109 : 'Connection timed out',
110 : 'Connection refused',
111 : 'Host is down',
112 : 'No route to host',
113 : 'Operation already in progress',
114 : 'Operation now in progress',
115 : 'Stale NFS file handle',
116 : 'Structure needs cleaning',
117 : 'Not a XENIX named type file',
118 : 'No XENIX semaphores available',
119 : 'Is a named type file',
120 : 'Remote I/O error',
121 : 'Quota exceeded',
122 : 'No medium found',
123 : 'Wrong medium type',
124 : 'Operation Canceled',
125 : 'Required key not available',
126 : 'Key has expired',
127 : 'Key has been revoked',
128 : 'Key was rejected by service',
129 : 'Owner died',
130 : 'State not recoverable',
131 : 'Operation not possible due to RF-kill',
132 : 'Memory page has hardware error',
133 : 'Output truncated',
134 : 'Not implemented',
135 : 'Unknown error',
136 : 'msgLib delete() failed',
137 : 'thrCreate() failed',
138 : 'Thread was aborted',
139 : 'libConfig open() failed',
140 : 'libConfig lseek() failed',
141 : 'libConfig flash open() failed',
142 : 'libConfig flash lseek() failed',
143 : 'libConfig configDelete() failed',
144 : 'Incorrect params to UsrNodeMain',
145 : 'Unicode strings are not supported by this function',
146 : 'Invalid value for ai_flags field',
147 : 'NAME or SERVICE is unknown',
148 : 'Non-recoverable failure in name resolution',
149 : 'SERVICE not supported for socket type',
150 : 'No address associated with NAME',
151 : 'Address family for NAME not supported',
152 : 'Request not canceled',
153 : 'All requests done',
154 : 'IDN encoding failed',
155 : 'Last page',
156 : 'More data to follow. Not end of stream',
157 : 'Command not found',
158 : 'Error parsing command',
159 : 'Sched queue length exceeded',
160 : 'Failure in the message layer',
161 : 'Out of messages',
162 : 'Shutdown message',
163 : 'No such node exists in cluster',
164 : 'New table created',
165 : 'No such result set',
166 : 'Data format does not support appending fields',
167 : 'Data format does not support removing fields',
168 : 'Failed to parse data format value',
169 : 'Record data format is corrupt',
170 : 'Field does not exist within record',
171 : 'Unknown field type',
172 : 'Failed to find a record corresponding to the given record number',
173 : 'Searched value was not found',
174 : 'Invalid data format',
175 : 'Context does not support dereferencing a remote Fatptr',
176 : 'Values buffer is too small to store even a single field value',
177 : 'Too many values discovered for a single field',
178 : 'Field type is not supported in this format',
179 : 'Maximum number of dictionary segments reached',
180 : 'Bad record identifier',
181 : 'System has exceeded the configured maximum number of records; try increasing Constants.DfMaxRecords',
182 : 'Type mismatch during index creation',
183 : 'Intended key has more than a single',
184 : 'Dataset not found',
185 : 'Loading of this dataset has already started',
186 : 'URL length is too large',
187 : 'URL is not valid',
188 : 'Data source type does not support file creation',
189 : 'Data source type does not support file deletion',
190 : 'Data source type does not support writing',
191 : 'Data source type does not support seeking',
192 : 'Seek failed',
193 : 'Data source type does not support directory creation',
194 : 'Loading of this dataset failed',
195 : 'Dataset is in use',
196 : 'Data source does not support specified data format type',
197 : 'Failed to initialize the mysql client library',
198 : 'Failed to connect to mysql server & database',
199 : 'Failed to run query against mysql table',
200 : 'Data source type does not support file attributes',
201 : 'Could not determine uncompressed file size',
202 : 'Failed to shrink memory allocation',
203 : 'name already exists',
204 : 'Table already exists',
205 : 'Invalid command. Could not find matching quotes',
206 : 'Failed to compute the range partition hash function',
207 : 'Field name cannot be blank',
208 : 'No data dictionary defined for format type',
209 : 'Could not find BTree associated with table handle',
210 : 'BTree key type does not match insert message key type',
211 : 'BTree dataset identifier does not match insert message dataset identifier',
212 : 'Command is still running',
213 : 'Invalid result set ID',
214 : 'Cannot set position to beyond result set size',
215 : 'Table is in use right now and cannot be deleted',
216 : 'One of the lines in the CLI is too long',
217 : 'Encountered an error reading from file',
218 : 'Invalid table name',
219 : 'Table or dataset name is too long',
220 : 'Unexpected end-of-file attempting to read from socket',
221 : 'stats group ID is invalid',
222 : 'stats group name is invalid',
223 : 'Invalid handle',
224 : 'Error communicating across thrift connection',
225 : 'Malformed BTree. BTree has no root',
226 : 'Could not find key in BTree',
227 : 'Could not find key-value pair',
228 : 'Malformed eval string',
229 : 'Could not find function',
230 : 'Wrong number of arguments passed to function',
231 : 'The new field name is too long',
232 : 'The field name you entered already exists',
233 : 'Wrong number of operands provided to operator',
234 : 'Operation requires 1 operand',
235 : 'Operation is not supported on input type',
236 : 'Divide by zero error',
237 : 'Mixed type is not supported in this xdf',
238 : 'Aggregate output has insufficient size to store the result',
239 : 'KV not found in table',
240 : 'Listen to: Pretty Vacant by Sex Pistols',
241 : 'Xdb is vacant',
242 : 'Xdb is loading data',
243 : 'Stale XdbHandle, Xdb not found',
244 : 'Xdb cursor is uninitialized',
245 : 'Task(s) failed',
246 : 'The query ID does not exist',
247 : 'There is no query job associate with this ID',
248 : 'API Task Failed',
249 : 'The source table is already indexed by the specified key',
250 : 'Some variables are undefined during evaluation',
251 : 'The destination key/value buffer was full',
252 : 'The module is not initialized yet',
253 : 'Maximum number of joined values exceeded',
254 : 'Xdb key type is already set',
255 : 'Joins may only be performed on tables with the same key type',
256 : 'Joins may only be performed on tables with the same DHT',
257 : 'Failed',
258 : 'FileName entered is illegal',
259 : 'File contents are empty',
260 : 'Eval string entered is too long',
261 : 'Table has been deleted',
262 : 'Cant open the file',
263 : 'Query failed',
264 : 'Failed to create a DAG node',
265 : 'Failed to delete a DAG node',
266 : 'Failed to rename a DAG node',
267 : 'Failed to change the state of DAG node',
268 : 'No such field found while running aggregate',
269 : 'Local function requires argument',
270 : 'Accumulator is not inited',
271 : 'Return value of aggregate is not a scalar',
272 : 'Maximum number of tables and datasets reached',
273 : 'Table or dataset is in use',
274 : 'Bad table or dataset name',
275 : 'Table or dataset not found',
276 : 'Could not find dag node',
277 : 'Update operation not supported',
278 : 'Message response size would exceed maximum message payload size',
279 : 'The requested key was not found',
280 : 'Could not get amount of memory consumed',
281 : 'No valid status received!',
282 : 'No such aggregate operator!',
283 : 'timed out waiting for table key type to resolve',
284 : 'Variable name in evalString too long',
285 : 'DAG handle not found',
286 : 'DAG name is invalid',
287 : 'DAG name is too long',
288 : 'DAG name already exists',
289 : 'DAG is empty',
290 : 'DAG is not empty',
291 : 'No more DAG nodes available',
292 : 'DAG handle is not available',
293 : 'DAG Node is currently in use',
294 : 'DAG Node is in error state',
295 : 'Operation not supported on the target',
296 : 'DAG node is not ready',
297 : 'Dataset has been loaded',
298 : 'Dataset is not ready',
299 : 'Session does not exist',
300 : 'The session already exists',
301 : 'The target session was not inactive',
302 : 'The name or pattern supplied is not allowed',
303 : 'The session has an unrecoverable error',
304 : 'The delete operation is not permitted',
305 : 'Unknown python error occurred.',
306 : 'Could not compile python script',
307 : 'Could not import compiled python object as module',
308 : 'Could not retrieve module dictionary',
309 : 'Could not get name of python function',
310 : 'User-defined function no longer available. Might have been deleted',
311 : 'Could not allocate python tuple',
312 : 'Failed to get python string from C string',
313 : 'Failed to get python signed long from C ssize_t',
314 : 'Failed to get python unsigned long from C size_t',
315 : 'Failed to get python float from C double',
316 : 'Could not set python tuple',
317 : 'Error occurred while invoking python function',
318 : 'Could not determine how many arguments function takes',
319 : 'Function takes in too many arguments',
320 : 'Could not retrieve python bytecode for function',
321 : 'Could not determine argument names to function',
322 : 'Type not supported',
323 : 'Function name provided is not of a valid python function',
324 : 'Could not retrieve code object flags',
325 : 'Failed to get c string from python string',
326 : 'Token name in evalString is too long',
327 : 'No configuration file specified',
328 : 'Could not resolve result set schema',
329 : 'Checksum validation failed while reading log entry'
};
