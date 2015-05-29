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
  'StatusXDev' : 18,
  'StatusNoDev' : 19,
  'StatusNotDir' : 20,
  'StatusIsDir' : 21,
  'StatusInval' : 22,
  'StatusNFile' : 23,
  'StatusMFile' : 24,
  'StatusNoTTY' : 25,
  'StatusTxtBsy' : 26,
  'StatusFBig' : 27,
  'StatusNoSpc' : 28,
  'StatusSPipe' : 29,
  'StatusROFS' : 30,
  'StatusMLink' : 31,
  'StatusPipe' : 32,
  'StatusDom' : 33,
  'StatusRange' : 34,
  'StatusDeadLk' : 35,
  'StatusNameTooLong' : 36,
  'StatusNoLck' : 37,
  'StatusNoSys' : 38,
  'StatusNotEmpty' : 39,
  'StatusLoop' : 40,
  'StatusNoMsg' : 41,
  'StatusIdRm' : 42,
  'StatusChRng' : 43,
  'StatusL2NSync' : 44,
  'StatusL3Hlt' : 45,
  'StatusL3Rst' : 46,
  'StatusLNRng' : 47,
  'StatusUnatch' : 48,
  'StatusNoCSI' : 49,
  'StatusL2Hlt' : 50,
  'StatusBadE' : 51,
  'StatusBadR' : 52,
  'StatusXFull' : 53,
  'StatusNoAno' : 54,
  'StatusBadRqC' : 55,
  'StatusBadSlt' : 56,
  'StatusBFont' : 57,
  'StatusNoStr' : 58,
  'StatusNoData' : 59,
  'StatusTime' : 60,
  'StatusNoSR' : 61,
  'StatusNoNet' : 62,
  'StatusNoPkg' : 63,
  'StatusRemote' : 64,
  'StatusNoLink' : 65,
  'StatusAdv' : 66,
  'StatusSRMnt' : 67,
  'StatusComm' : 68,
  'StatusProto' : 69,
  'StatusMultihop' : 70,
  'StatusDotDot' : 71,
  'StatusBadMsg' : 72,
  'StatusOverflow' : 73,
  'StatusNotUniq' : 74,
  'StatusBadFD' : 75,
  'StatusRemChg' : 76,
  'StatusLibAcc' : 77,
  'StatusLibBad' : 78,
  'StatusLibScn' : 79,
  'StatusLibMax' : 80,
  'StatusLibExec' : 81,
  'StatusIlSeq' : 82,
  'StatusRestart' : 83,
  'StatusStrPipe' : 84,
  'StatusUsers' : 85,
  'StatusNotSock' : 86,
  'StatusDestAddrReq' : 87,
  'StatusMsgSize' : 88,
  'StatusPrototype' : 89,
  'StatusNoProtoOpt' : 90,
  'StatusProtoNoSupport' : 91,
  'StatusSockTNoSupport' : 92,
  'StatusOpNotSupp' : 93,
  'StatusPFNoSupport' : 94,
  'StatusAFNoSupport' : 95,
  'StatusAddrInUse' : 96,
  'StatusAddrNotAvail' : 97,
  'StatusNetDown' : 98,
  'StatusNetUnreach' : 99,
  'StatusNetReset' : 100,
  'StatusConnAborted' : 101,
  'StatusConnReset' : 102,
  'StatusNoBufs' : 103,
  'StatusIsConn' : 104,
  'StatusNotConn' : 105,
  'StatusShutdown' : 106,
  'StatusTooManyRefs' : 107,
  'StatusTimedOut' : 108,
  'StatusConnRefused' : 109,
  'StatusHostDown' : 110,
  'StatusHostUnreach' : 111,
  'StatusAlready' : 112,
  'StatusInProgress' : 113,
  'StatusStale' : 114,
  'StatusUClean' : 115,
  'StatusNotNam' : 116,
  'StatusNAvail' : 117,
  'StatusIsNam' : 118,
  'StatusRemoteIo' : 119,
  'StatusDQuot' : 120,
  'StatusNoMedium' : 121,
  'StatusMediumType' : 122,
  'StatusCanceled' : 123,
  'StatusNoKey' : 124,
  'StatusKeyExpired' : 125,
  'StatusKeyRevoked' : 126,
  'StatusKeyRejected' : 127,
  'StatusOwnerDead' : 128,
  'StatusNotRecoverable' : 129,
  'StatusRFKill' : 130,
  'StatusHwPoison' : 131,
  'StatusTrunc' : 132,
  'StatusUnimpl' : 133,
  'StatusUnknown' : 134,
  'StatusMsgLibDeleteFailed' : 135,
  'StatusThrCreateFailed' : 136,
  'StatusThrAborted' : 137,
  'StatusConfigLibDevOpenFailed' : 138,
  'StatusConfigLibDevLSeekFailed' : 139,
  'StatusConfigLibFlashDevOpenFailed' : 140,
  'StatusConfigLibFlashDevLSeekFailed' : 141,
  'StatusConfigLibDeleteFailed' : 142,
  'StatusUsrNodeIncorrectParams' : 143,
  'StatusUnicodeUnsupported' : 144,
  'StatusEAIBadFlags' : 145,
  'StatusEAINoName' : 146,
  'StatusEAIFail' : 147,
  'StatusEAIService' : 148,
  'StatusEAINoData' : 149,
  'StatusEAIAddrFamily' : 150,
  'StatusEAINotCancel' : 151,
  'StatusEAIAllDone' : 152,
  'StatusEAIIDNEncode' : 153,
  'StatusLast' : 154,
  'StatusMore' : 155,
  'StatusCliUnknownCmd' : 156,
  'StatusCliParseError' : 157,
  'StatusSchedQueueLenExceeded' : 158,
  'StatusMsgFail' : 159,
  'StatusMsgOutOfMessages' : 160,
  'StatusMsgShutdown' : 161,
  'StatusNoSuchNode' : 162,
  'StatusNewTableCreated' : 163,
  'StatusNoSuchResultSet' : 164,
  'StatusDfAppendUnsupported' : 165,
  'StatusDfRemoveUnsupported' : 166,
  'StatusDfParseError' : 167,
  'StatusDfRecordCorrupt' : 168,
  'StatusDfFieldNoExist' : 169,
  'StatusDfUnknownFieldType' : 170,
  'StatusDfRecordNotFound' : 171,
  'StatusDfValNotFound' : 172,
  'StatusDfInvalidFormat' : 173,
  'StatusDfLocalFatptrOnly' : 174,
  'StatusDfValuesBufTooSmall' : 175,
  'StatusDfMaxValuesPerFieldExceeded' : 176,
  'StatusDfFieldTypeUnsupported' : 177,
  'StatusDfMaxDictionarySegmentsExceeded' : 178,
  'StatusDfBadRecordId' : 179,
  'StatusDfMaxRecordsExceeded' : 180,
  'StatusDfTypeMismatch' : 181,
  'StatusDsTooManyKeyValues' : 182,
  'StatusDsNotFound' : 183,
  'StatusDsLoadAlreadyStarted' : 184,
  'StatusDsUrlTooLong' : 185,
  'StatusDsInvalidUrl' : 186,
  'StatusDsCreateNotSupported' : 187,
  'StatusDsUnlinkNotSupported' : 188,
  'StatusDsWriteNotSupported' : 189,
  'StatusDsSeekNotSupported' : 190,
  'StatusDsSeekFailed' : 191,
  'StatusDsMkDirNotSupported' : 192,
  'StatusDsLoadFailed' : 193,
  'StatusDsDatasetInUse' : 194,
  'StatusDsFormatTypeUnsupported' : 195,
  'StatusDsMysqlInitFailed' : 196,
  'StatusDsMysqlConnectFailed' : 197,
  'StatusDsMysqlQueryFailed' : 198,
  'StatusReallocShrinkFailed' : 199,
  'StatusNsObjAlreadyExists' : 200,
  'StatusTableAlreadyExists' : 201,
  'StatusCliUnclosedQuotes' : 202,
  'StatusRangePartError' : 203,
  'StatusNewFieldNameIsBlank' : 204,
  'StatusNoDataDictForFormatType' : 205,
  'StatusBTreeNotFound' : 206,
  'StatusBTreeKeyTypeMismatch' : 207,
  'StatusBTreeDatasetMismatch' : 208,
  'StatusCmdNotComplete' : 209,
  'StatusInvalidResultSetId' : 210,
  'StatusPositionExceedResultSetSize' : 211,
  'StatusHandleInUse' : 212,
  'StatusCliLineTooLong' : 213,
  'StatusCliErrorReadFromFile' : 214,
  'StatusInvalidTableName' : 215,
  'StatusNsObjNameTooLong' : 216,
  'StatusApiUnexpectedEOF' : 217,
  'StatusStatsInvalidGroupId' : 218,
  'StatusStatsInvalidGroupName' : 219,
  'StatusInvalidHandle' : 220,
  'StatusThriftProtocolError' : 221,
  'StatusBTreeHasNoRoot' : 222,
  'StatusBTreeKeyNotFound' : 223,
  'StatusQaKeyValuePairNotFound' : 224,
  'StatusAstMalformedEvalString' : 225,
  'StatusAstNoSuchFunction' : 226,
  'StatusAstWrongNumberOfArgs' : 227,
  'StatusFieldNameTooLong' : 228,
  'StatusFieldNameAlreadyExists' : 229,
  'StatusXdfWrongNumberOfArgs' : 230,
  'StatusXdfUnaryOperandExpected' : 231,
  'StatusXdfTypeUnsupported' : 232,
  'StatusXdfDivByZero' : 233,
  'StatusXdfMixedTypeNotSupported' : 234,
  'StatusKvNotFound' : 235,
  'StatusXdbSlotPrettyVacant' : 236,
  'StatusNoDataInXdb' : 237,
  'StatusXdbNotFound' : 238,
  'StatusXdbUninitializedCursor' : 239,
  'StatusQrTaskFailed' : 240,
  'StatusQrIdNonExist' : 241,
  'StatusQrJobNonExist' : 242,
  'StatusApiTaskFailed' : 243,
  'StatusAlreadyIndexed' : 244,
  'StatusEvalUnsubstitutedVariables' : 245,
  'StatusKvDstFull' : 246,
  'StatusModuleNotInit' : 247,
  'StatusMaxJoinFieldsExceeded' : 248,
  'StatusXdbKeyTypeAlreadySet' : 249,
  'StatusJoinTypeMismatch' : 250,
  'StatusFailed' : 251,
  'StatusIllegalFileName' : 252,
  'StatusEmptyFile' : 253,
  'StatusEvalStringTooLong' : 254,
  'StatusTableDeleted' : 255,
  'StatusFailOpenFile' : 256,
  'StatusQueryFailed' : 257,
  'StatusCreateDagNodeFailed' : 258,
  'StatusAggregateNoSuchField' : 259,
  'StatusAggregateLocalFnNeedArgument' : 260,
  'StatusAggregateAccNotInited' : 261,
  'StatusAggregateReturnValueNotScalar' : 262,
  'StatusNsMaximumObjectsReached' : 263,
  'StatusNsObjInUse' : 264,
  'StatusNsInvalidObjName' : 265,
  'StatusNsNotFound' : 266,
  'StatusDagNodeNotFound' : 267,
  'StatusUpdateDagNodeOperationNotSupported' : 268,
  'StatusMsgMaxPayloadExceeded' : 269,
  'StatusKvEntryNotFound' : 270,
  'StatusStatsCouldNotGetMemUsedInfo' : 271,
  'StatusStatusFieldNotInited' : 272,
  'StatusAggNoSuchFunction' : 273,
  'StatusPyExecFailure' : 274,
  'StatusPyExecNotEnoughMem' : 275,
  'StatusWaitKeyTimeout' : 276,
  'StatusVariableNameTooLong' : 277,
  'StatusPyExecNotEnoughArguments' : 278,
  'StatusPyExecFunctionNotCallable' : 279,
  'StatusPyExecInvalidParameter' : 280,
  'StatusPyEmptyValueReturnedFromPyExecFunction' : 281,
  'StatusPyInterpreterNotInitialized' : 282,
  'StatusPyInterpreterAlreadyInitialized' : 283,
  'StatusPyFailedToImportModule' : 284,
  'StatusPyFilterFunctionNotCallable' : 285,
  'StatusPyFilterRecordInvalidParameter' : 286,
  'StatusPyEmptyValueReturnedFromFilterFunction' : 287
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
18 : 'Cross-device link',
19 : 'No such device',
20 : 'Not a directory',
21 : 'Is a directory',
22 : 'Invalid argument',
23 : 'File table overflow',
24 : 'Too many open files',
25 : 'Not a typewriter',
26 : 'Text file busy',
27 : 'File too large',
28 : 'No space left on device',
29 : 'Illegal seek',
30 : 'Read-only file system',
31 : 'Too many links',
32 : 'Broken pipe',
33 : 'Math argument out of domain of func',
34 : 'Math result not representable',
35 : 'Resource deadlock would occur',
36 : 'File name too long',
37 : 'No record locks available',
38 : 'Function not implemented',
39 : 'Directory not empty',
40 : 'Too many symbolic links encountered',
41 : 'No message of desired type',
42 : 'Identifier removed',
43 : 'Channel number out of range',
44 : 'Level 2 not synchronized',
45 : 'Level 3 halted',
46 : 'Level 3 reset',
47 : 'Link number out of range',
48 : 'Protocol driver not attached',
49 : 'No CSI structure available',
50 : 'Level 2 halted',
51 : 'Invalid exchange',
52 : 'Invalid request descriptor',
53 : 'Exchange full',
54 : 'No anode',
55 : 'Invalid request code',
56 : 'Invalid slot',
57 : 'Bad font file format',
58 : 'Device not a stream',
59 : 'No data available',
60 : 'Timer expired',
61 : 'Out of streams resources',
62 : 'Machine is not on the network',
63 : 'Package not installed',
64 : 'Object is remote',
65 : 'Link has been severed',
66 : 'Advertise error',
67 : 'Srmount error',
68 : 'Communication error on send',
69 : 'Protocol error',
70 : 'Multihop attempted',
71 : 'RFS specific error',
72 : 'Not a data message',
73 : 'Value too large for defined data type',
74 : 'Name not unique on network',
75 : 'File descriptor in bad state',
76 : 'Remote address changed',
77 : 'Can not access a needed shared library',
78 : 'Accessing a corrupted shared library',
79 : '.lib section in a.out corrupted',
80 : 'Attempting to link in too many shared libraries',
81 : 'Cannot exec a shared library directly',
82 : 'Illegal byte sequence',
83 : 'Interrupted system call should be restarted',
84 : 'Streams pipe error',
85 : 'Too many users',
86 : 'Socket operation on non-socket',
87 : 'Destination address required',
88 : 'Message too long',
89 : 'Protocol wrong type for socket',
90 : 'Protocol not available',
91 : 'Protocol not supported',
92 : 'Socket type not supported',
93 : 'Operation not supported on transport endpoint',
94 : 'Protocol family not supported',
95 : 'Address family not supported by protocol',
96 : 'Address already in use',
97 : 'Cannot assign requested address',
98 : 'Network is down',
99 : 'Network is unreachable',
100 : 'Network dropped connection because of reset',
101 : 'Software caused connection abort',
102 : 'Connection reset by peer',
103 : 'No buffer space available',
104 : 'Transport endpoint is already connected',
105 : 'Transport endpoint is not connected',
106 : 'Cannot send after transport endpoint shutdown',
107 : 'Too many references: cannot splice',
108 : 'Connection timed out',
109 : 'Connection refused',
110 : 'Host is down',
111 : 'No route to host',
112 : 'Operation already in progress',
113 : 'Operation now in progress',
114 : 'Stale NFS file handle',
115 : 'Structure needs cleaning',
116 : 'Not a XENIX named type file',
117 : 'No XENIX semaphores available',
118 : 'Is a named type file',
119 : 'Remote I/O error',
120 : 'Quota exceeded',
121 : 'No medium found',
122 : 'Wrong medium type',
123 : 'Operation Canceled',
124 : 'Required key not available',
125 : 'Key has expired',
126 : 'Key has been revoked',
127 : 'Key was rejected by service',
128 : 'Owner died',
129 : 'State not recoverable',
130 : 'Operation not possible due to RF-kill',
131 : 'Memory page has hardware error',
132 : 'Output truncated',
133 : 'Not implemented',
134 : 'Unknown error',
135 : 'msgLib delete() failed',
136 : 'thrCreate() failed',
137 : 'Thread was aborted',
138 : 'libConfig open() failed',
139 : 'libConfig lseek() failed',
140 : 'libConfig flash open() failed',
141 : 'libConfig flash lseek() failed',
142 : 'libConfig configDelete() failed',
143 : 'Incorrect params to UsrNodeMain',
144 : 'Unicode strings are not supported by this function',
145 : 'Invalid value for ai_flags field',
146 : 'NAME or SERVICE is unknown',
147 : 'Non-recoverable failure in name resolution',
148 : 'SERVICE not supported for socket type',
149 : 'No address associated with NAME',
150 : 'Address family for NAME not supported',
151 : 'Request not canceled',
152 : 'All requests done',
153 : 'IDN encoding failed',
154 : 'Last page',
155 : 'More data to follow. Not end of stream',
156 : 'Command not found',
157 : 'Error parsing command',
158 : 'Sched queue length exceeded',
159 : 'Failure in the message layer',
160 : 'Out of messages',
161 : 'Shutdown message',
162 : 'No such node exists in cluster',
163 : 'New table created',
164 : 'No such result set',
165 : 'Data format does not support appending fields',
166 : 'Data format does not support removing fields',
167 : 'Failed to parse data format value',
168 : 'Record data format is corrupt',
169 : 'Field does not exist within record',
170 : 'Unknown field type',
171 : 'Failed to find a record corresponding to the given record number',
172 : 'Searched value was not found',
173 : 'Invalid data format',
174 : 'Context does not support dereferencing a remote Fatptr',
175 : 'Values buffer is too small to store even a single field value',
176 : 'Too many values discovered for a single field',
177 : 'Field type is not supported in this format',
178 : 'Maximum number of dictionary segments reached',
179 : 'Bad record identifier',
180 : 'System has exceeded the configured maximum number of records; try increasing Constants.DfMaxRecords',
181 : 'Type mismatch during index creation',
182 : 'Intended key has more than a single',
183 : 'Dataset not found',
184 : 'Loading of this dataset has already started',
185 : 'URL length is too large',
186 : 'URL is not valid',
187 : 'Data source type does not support file creation',
188 : 'Data source type does not support file deletion',
189 : 'Data source type does not support writing',
190 : 'Data source type does not support seeking',
191 : 'Seek failed',
192 : 'Data source type does not support directory creation',
193 : 'Loading of this dataset failed',
194 : 'Dataset is in use',
195 : 'Data source does not support specified data format type',
196 : 'Failed to initialize the mysql client library',
197 : 'Failed to connect to mysql server & database',
198 : 'Failed to run query against mysql table',
199 : 'Failed to shrink memory allocation',
200 : 'Table or dataset already exists',
201 : 'Table already exists',
202 : 'Invalid command. Could not find matching quotes',
203 : 'Failed to compute the range partition hash function',
204 : 'Field name cannot be blank',
205 : 'No data dictionary defined for format type',
206 : 'Could not find BTree associated with table handle',
207 : 'BTree key type does not match insert message key type',
208 : 'BTree dataset identifier does not match insert message dataset identifier',
209 : 'Command is still running',
210 : 'Invalid result set ID',
211 : 'Cannot set position to beyond result set size',
212 : 'Table is in use right now and cannot be deleted',
213 : 'One of the lines in the CLI is too long',
214 : 'Encountered an error reading from file',
215 : 'Invalid table name',
216 : 'Table or dataset name is too long',
217 : 'Unexpected end-of-file attempting to read from socket',
218 : 'stats group ID is invalid',
219 : 'stats group name is invalid',
220 : 'Invalid handle',
221 : 'Error communicating across thrift connection',
222 : 'Malformed BTree. BTree has no root',
223 : 'Could not find key in BTree',
224 : 'Could not find key-value pair',
225 : 'Malformed eval string',
226 : 'Could not find function',
227 : 'Wrong number of arguments passed to function',
228 : 'The new field name is too long',
229 : 'The field name you entered already exists',
230 : 'Wrong number of operands provided to operator',
231 : 'Operation requires 1 operand',
232 : 'Operation is not supported on input type',
233 : 'Divide by zero error',
234 : 'Mixed type is not supported in this xdf',
235 : 'KV not found in table',
236 : 'Listen to: Pretty Vacant by Sex Pistols',
237 : 'Xdb is vacant',
238 : 'Stale XdbHandle, Xdb not found',
239 : 'Xdb cursor is uninitialized',
240 : 'Task(s) failed',
241 : 'The query ID is not existed',
242 : 'There is no query job associate with this ID',
243 : 'API Task Failed',
244 : 'The source table is already indexed by the specified key',
245 : 'Some variables are undefined during evaluation',
246 : 'The destination key/value buffer was full',
247 : 'The module is not initialized yet',
248 : 'Maximum number of joined values exceeded',
249 : 'Xdb key type is already set',
250 : 'Joins may only be performed on tables with the same key type',
251 : 'Failed',
252 : 'FileName entered is illegal',
253 : 'File contents are empty',
254 : 'Eval string entered is too long',
255 : 'Table has been deleted',
256 : 'Cant open the file',
257 : 'Query failed',
258 : 'Failed to create a Dag Node',
259 : 'No such field found while running aggregate',
260 : 'Local function requires argument',
261 : 'Accumulator is not inited',
262 : 'Return value of aggregate is not a scalar',
263 : 'Maximum number of tables and datasets reached',
264 : 'Table or dataset is in use',
265 : 'Bad table or dataset name',
266 : 'Table or dataset not found',
267 : 'Could not find dag node',
268 : 'Update operation not supported',
269 : 'Message response size would exceed maximum message payload size',
270 : 'The requested key was not found',
271 : 'Could not get amount of memory consumed',
272 : 'No valid status received!',
273 : 'No such aggregate operator!',
274 : 'Some weird pyexec failure',
275 : 'ran out of memory',
276 : 'timed out waiting for table key type to resolve',
277 : 'Variable name in evalString too long',
278 : 'Not enough arguments for pyExec',
279 : 'The pyExec function being provided is not callable',
280 : 'Parameter being passed into the pyExec function is not valid',
281 : 'The return value from pyExec function is empty',
282 : 'Python interpreter has not initialized yet',
283 : 'Python interpreter has already initialized',
284 : 'Failed to import the module file being provided',
285 : 'The filter function being provided is not callable',
286 : 'Parameter being passed into the filter function is not valid',
287 : 'The return value from filter function is empty'
};
