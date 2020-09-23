import * as React from 'react';
import * as crypto from 'crypto';
import { SourceData, defaultConnector } from './SourceData';
import { BrowseDataSourceModal } from './BrowseDataSource';
import DiscoverSchemas from './DiscoverSchemas';
import CreateTables from './CreateTables';
import Details from './Details';
import * as SchemaService from '../services/SchemaService';
import * as SetUtils from '../utils/SetUtils';
import NavButtons from './NavButtons'
import getForensics from '../services/Forensics';
import * as Path from 'path';
import * as SchemaLoadService from '../services/SchemaLoadService'
import * as SchemaLoadSetting from '../services/SchemaLoadSetting'
import { FilePathInfo } from '../services/S3Service'
import { listFilesWithPattern, defaultFileNamePattern } from '../services/S3Service'
import { DataPreviewModal } from './DataPreview'
import LoadStep from './LoadStep';
import RefreshIcon from '../../components/widgets/RefreshIcon';

/**
 * UI texts for this component
 */
const Texts = {
    stepNameSourceData: "Select Data Source",
    stepNameFilterData: "Browse Data Source",
    stepNameSchemaDiscover: "Discover Schemas",
    stepNameCreateTables: "Create Tables",
    navButtonLeft: 'Back',
    navButtonRight: 'Navigate to Notebook',
    navToNotebookHint: "Please create a table first",
    loadNewTableHint: "", // XXX need tooltip
    navButtonRight2: 'Next',
    CreateTableHint: 'Please specify schema first',
    ResetInDiscoverLoading: 'Cannot reset when selected files are loading.',
    ResetInDiscoverBatch: "Cannot reset when discovering schema, please cancel discover schema first.",
    ResetInCreating: 'Cannot reset when table is creating.'
};
const defaultSchemaName = 'Schema1';

/**
 * Step enum/name definition
 */
enum StepEnum {
    SourceData = 'SourceData',
    FilterData = 'FilterData',
    SchemaDiscovery = 'SchemaDiscovery',
    CreateTables = 'CreateTables'
}

const stepNumMap = {};
stepNumMap[StepEnum.SourceData] = 1;
stepNumMap[StepEnum.FilterData] = 1;
stepNumMap[StepEnum.SchemaDiscovery] = 2;
stepNumMap[StepEnum.CreateTables] = 3;
const navBarStepNameMap = {
    "1": "Browse File",
    "2": "Specify Schema",
    "3": "Create Table",
};


const stepNames = new Map();
stepNames.set(StepEnum.SourceData, Texts.stepNameSourceData);
stepNames.set(StepEnum.FilterData, Texts.stepNameFilterData);
stepNames.set(StepEnum.SchemaDiscovery, Texts.stepNameSchemaDiscover);
stepNames.set(StepEnum.CreateTables, Texts.stepNameCreateTables);

const numRowsForPreview = 100;

function deleteEntry(setOrMap, key) {
    setOrMap.delete(key);
    return setOrMap;
}

function deleteEntries(setOrMap, keySet) {
    for (const key of keySet) {
        setOrMap.delete(key);
    }
    return setOrMap;
}

type LoadConfigProps = {
    onStepChange: (step: StepEnum) => void
};
type LoadConfigState = {
    currentStep: StepEnum,
    currentNavStep: number,

    connector: string,
    bucket: string,
    homePath: string,
    fileType: SchemaService.FileType,

    browseShow: boolean,
    waitingBrowseClose: boolean
    selectedFileDir: Array<FilePathInfo>,
    fileNamePattern: string,
    loadAppId: string,

    fileSelectState: {
        isLoading: boolean,
        files: Array<FilePathInfo>,
        fileSelected: FilePathInfo
    },
    fileContentState: {
        isLoading: boolean,
        error: string,
        content: Array<any>,
        isAutoDetect: boolean,
        sampleSize: number,
        linesSelected: Array<any>,
        lineOffset: number,
        linesHaveError: boolean
    },
    selectedSchema: any,
    inputSerialization: SchemaService.InputSerialization,
    inputSerialPending: boolean,

    editSchemaState: {
        schema: any,
        errorMessage: string
    },
    finalSchema: SchemaService.Schema,

    tablePreviewState: {
        isShow: boolean
    },

    tableToCreate: Map<any, any>,
    createTableState: {
        page: number,
        rowsPerPage: number,
        count: number,
        schemas: Array<any>,
        isLoading: boolean,
    },
    onCancelCreate: () => void,
    createInProgress: Map<string, {table: string, message: string}>,
    createFailed: Map<string, string>,
    createTables: Map<string, {table: string, complementTable: string}>,

    schemaDetailState: {
        isLoading: boolean,
        schema: any,
        error: any
    },
    discoverStatsState: {
        isLoading: boolean,
        numFiles: number,
        numSchemas: number,
        numFailed: number
    },
    showForensics: boolean,
    forensicsMessage: Array<any>,
    isForensicsLoading: boolean
};

class LoadConfig extends React.Component<LoadConfigProps, LoadConfigState> {
    private metadataMap: Map<any, any>;
    private _initConfigHash: string;
    private _eventOnStepChange: any;
    private _fetchFileJob: {
        cancel: () => void,
        getFilePath: () => string
    };

    constructor(props) {
        super(props);
        // Initialize state
        const {
            onStepChange
        } = props;
        const defaultBucket = '/';
        const defaultHomePath = '';
        const defaultFileType = SchemaService.FileType.CSV;

        this.state = {
            currentStep: StepEnum.SourceData,
            currentNavStep: 1,

            // SourceData
            connector: defaultConnector,
            bucket: defaultBucket,
            homePath: defaultHomePath,
            fileType: defaultFileType,

            // BrowseDataSource
            browseShow: false,
            waitingBrowseClose: false,
            selectedFileDir: new Array(),
            fileNamePattern: defaultFileNamePattern,
            loadAppId: null,

            // FilePreview
            fileSelectState: {
                isLoading: false,
                files: [],
                fileSelected: null
            },
            fileContentState: {
                isLoading: false,
                error: null,
                content: [],
                isAutoDetect: false,
                sampleSize: 100,
                linesSelected: [],
                lineOffset: 0,
                linesHaveError: false
            },
            selectedSchema: null,

            // Edit Schema
            editSchemaState: {
                schema: null,
                errorMessage: null
            },
            finalSchema: null,

            // Table Preview
            tablePreviewState: {
                isShow: false
            },

            // DiscoverSchemas
            inputSerialization: SchemaService.defaultInputSerialization.get(defaultFileType),
            inputSerialPending: false,

            // CreateTable
            tableToCreate: new Map(), // Map<schemaName, tableName>, store a table name for user to update
            createTableState: {
                page: 0,
                rowsPerPage: 20,
                count: 0,
                schemas: [],
                isLoading: false,
            },
            onCancelCreate: () => {},
            createInProgress: new Map(), // Map<schemaName, tableName>
            createFailed: new Map(), // Map<schemaName, errorMsg>
            createTables: new Map(), // Map<schemaName, tableName>

            // Detail
            schemaDetailState: {
                isLoading: false,
                schema: null,
                error: null
            },
            discoverStatsState: {
                isLoading: false,
                numFiles: null,
                numSchemas: null,
                numFailed: null
            },
            showForensics: false,
            forensicsMessage: [],
            isForensicsLoading: false
        };

        this.metadataMap = new Map();

        // Hash the config for detecting config change
        this._initConfigHash = this._getConfigHash({
            selectedFileDir: this.state.selectedFileDir
        });

        // Event notification
        this._eventOnStepChange = onStepChange;

        this._fetchForensics = this._fetchForensics.bind(this);
        this._resetAll = this._resetAll.bind(this);

        this._fetchFileJob = {
            cancel: () => {},
            getFilePath: () => null
        };
    }

    _fetchForensics(bucket, path) {
        const statusCallback = (state) => {
            this.setState({
                ...state
            });
        };
        getForensics(bucket, path, this.metadataMap, statusCallback);
    }

    _resetAll(element) {
        if (!this._validateResetAll(element)) {
            return;
        }
        const inputSerialization = this._resetBrowseResult();
        this.setState({
            currentStep: StepEnum.SourceData,
            schemaDetailState: {
                isLoading: false,
                schema: null,
                error: null
            }
        })
    }

    _validateResetAll(element) {
        let error = null;
        if (this.state.createInProgress.size > 0) {
            error = Texts.ResetInCreating;
        }
        if (error) {
            const $el = $(element);
            StatusBox.show(error, $el);
            return false;
        } else {
            return true;
        }
    }

    async _publishDataCompTables(app, tables, publishTableName, dataflows) {
        const dataName = PTblManager.Instance.getUniqName(publishTableName.toUpperCase());
        const compName = PTblManager.Instance.getUniqName(publishTableName + '_ERROR');

        try {
            PTblManager.Instance.addLoadingTable(dataName);
            PTblManager.Instance.addLoadingTable(compName);

            // Publish tables
            const compHasData = await app.publishResultTables(
                tables,
                { data: dataName, comp: compName },
                dataflows
            )

            // XD table operations
            PTblManager.Instance.removeLoadingTable(dataName);
            PTblManager.Instance.removeLoadingTable(compName);
            PTblManager.Instance.addTable(dataName);
            if (compHasData) {
                PTblManager.Instance.addTable(compName);
            }

            return {
                table: dataName,
                complementTable: compHasData ? compName : null
            };

        } catch(e) {
            PTblManager.Instance.removeLoadingTable(dataName);
            PTblManager.Instance.removeLoadingTable(compName);
            throw e;
        }
    }

    async _shareDataCompTables(app, tables, sharedName) {
        const dataName = sharedName.toUpperCase();
        const compName = dataName + '_ERROR';

        try {
            // Publish tables
            const { data: sharedDataTable, icv: sharedIcvTable } = await app.shareResultTables(
                tables,
                { data: dataName, comp: compName },
            )

            return {
                data: sharedDataTable,
                icv: sharedIcvTable
            };

        } catch(e) {
            throw e;
        }
    }

    async _createTableForPreview(schema, numFiles = 1) {
        const numRowsPerFile = Math.ceil(numRowsForPreview / numFiles);
        const {
            loadAppId,
            inputSerialization,
        } = this.state;

        // Load App
        const app = SchemaLoadService.getDiscoverApp(loadAppId);

        // Create data session table
        const { path, filePattern, isRecursive } = this._getLoadPathInfo();
        const table = await app.createPreviewTable({
            path: path, filePattern: filePattern,
            isRecursive: isRecursive,
            inputSerialization: inputSerialization,
            schema: schema,
            numRows: numRowsPerFile
        });

        return { data: table };
    }

    private _getLoadPathInfo = () => {
        const {
            selectedFileDir, fileNamePattern
        } = this.state;
        const selected = selectedFileDir[0];

        if (selected.directory) {
            return {
                path: Path.join(selected.fullPath, '/'),
                filePattern: fileNamePattern,
                isRecursive: true
            };
        } else {
            const { path: selectedPath, filePattern } = this._extractFileInfo(selected.fullPath);
            return {
                path: selectedPath,
                filePattern: filePattern,
                isRecursive: false
            };
        }
    }

    async _createTableFromSchema(schema, tableName) {
        const schemaName = defaultSchemaName;
        const isPublishTables = SchemaLoadSetting.get('isPublishTables', false) ;

        let cancelAction = null;
        const cancelCreate = async () => {
            const confirmed = await this._confirm({
                title: 'Confirm',
                message: 'Do you want to cancel the loading?'
            });
            if (cancelAction != null && confirmed) {
                cancelAction();
            }
        };
        const cleanupCancelledJobs = [];

        try {
            const {
                connector,
                loadAppId,
                inputSerialization
            } = this.state;
            // Load App
            const app = SchemaLoadService.getDiscoverApp(loadAppId);

            // State: cleanup and +loading
            const createInProgress = this.state.createInProgress;
            createInProgress.set(schemaName, {table: tableName, message: ""});
            this.setState({
                createInProgress: createInProgress,
                createFailed: deleteEntry(this.state.createFailed, schemaName),
                createTables: deleteEntry(this.state.createTables, schemaName),
                tableToCreate: deleteEntry(this.state.tableToCreate, schemaName),
                onCancelCreate: cancelCreate
            });

            // track progress
            function convertProgress(progress, range) {
                const [start, end] = range;
                return Math.min(Math.ceil(progress / 100 * (end - start) + start), end);
            }

            // Get create table dataflow
            const { path, filePattern, isRecursive } = this._getLoadPathInfo();
            const {
                cancel: getQueryCancel,
                done: getQueryDone,
                cleanup: getQueryCleanup
            } = app.getCreateTableQueryWithCancel({
                path: path, filePattern: filePattern,
                inputSerialization: inputSerialization,
                isRecursive: isRecursive,
                schema: schema,
                progressCB: (progress) => {
                    this.setState((state) => {
                        const { createInProgress } = state;
                        createInProgress.set(schemaName, {
                            table: tableName,
                            message: `${convertProgress(progress, [0, 30])}%`
                        });
                        return {
                            createInProgress: createInProgress
                        };
                    });
                }
            });
            cancelAction = getQueryCancel;
            cleanupCancelledJobs.push(getQueryCleanup);
            const query = await getQueryDone();

            // Create data/comp session tables
            const { cancel: createCancel, done: createDone } = app.createResultTablesWithCancel(query, (progress) => {
                this.setState((state) => {
                    const { createInProgress } = state;
                    createInProgress.set(schemaName, {
                        table: tableName,
                        message: `${convertProgress(progress, [30, 95])}%`
                    });
                    return {
                        createInProgress: createInProgress
                    };
                })
            });
            cancelAction = createCancel;
            const tables = await createDone();

            // Publish tables
            try {
                if (isPublishTables) {
                    // Publish to IMDTable
                    const result = await this._publishDataCompTables(app, tables, tableName, {
                        dataQueryComplete: query.dataQueryComplete,
                        compQueryComplete: query.compQueryComplete
                    });

                    // State: -loading + created
                    this.setState({
                        createInProgress: deleteEntry(this.state.createInProgress, schemaName),
                        createTables: this.state.createTables.set(schemaName, {
                            table: result.table,
                            complementTable: result.complementTable
                        })
                    });

                    await Promise.all([
                        tables.load.destroy(),
                        tables.data.destroy(),
                        tables.comp.destroy()
                    ]);
                } else {
                    // Publish to SharedTable
                    const { data: sharedDataTable, icv: sharedICVTable } = await this._shareDataCompTables(app, tables, tableName);

                    // State: -loading + created
                    this.setState({
                        createInProgress: deleteEntry(this.state.createInProgress, schemaName),
                        createTables: this.state.createTables.set(schemaName, {
                            table: sharedDataTable.getName(),
                            complementTable: sharedICVTable == null
                                ? null
                                : sharedICVTable.getName()
                        })
                    });

                    const cleanupTasks = [tables.load.destroy()];
                    if (sharedICVTable == null) {
                        cleanupTasks.push(tables.comp.destroy());
                    }
                    await Promise.all(cleanupTasks);
                }

                // Create a new Load App (conceptually)
                const newApp = await SchemaLoadService.createDiscoverApp({
                    targetName: connector
                });
                this.setState({
                    loadAppId: newApp.appId
                });
            } catch(e) {
                await Promise.all([
                    tables.load.destroy(),
                    tables.data.destroy(),
                    tables.comp.destroy()
                ]);
                throw e;
            }
        } catch(e) {
            if (e === SchemaLoadService.JobCancelExeption) {
                for (const job of cleanupCancelledJobs) {
                    await job();
                }
                this.setState({
                    createInProgress: deleteEntry(this.state.createInProgress, schemaName)
                });
            } else {
                let error = e.message || e.error || e;
                error = xcHelper.parseError(error);
                this.setState({
                    createInProgress: deleteEntry(this.state.createInProgress, schemaName),
                    createFailed: this.state.createFailed.set(schemaName, error),
                });
            }
        } finally {
            this.setState({ onCancelCreate: null });
        }

    }

    // XXX this is copied from DSConfig
    _getNameFromPath(path, nameSet) {
        if (path.charAt(path.length - 1) === "/") {
            // remove the last /
            path = path.substring(0, path.length - 1);
        }

        let paths = path.split("/");
        let splitLen = paths.length;
        let name = paths[splitLen - 1];
        name = name.toUpperCase();
        // strip the suffix dot part and only keep a-zA-Z0-9.
        let category = PatternCategory.PTblFix;
        name = xcHelper.checkNamePattern(category,
            PatternAction.Fix, name.split(".")[0], "_");

        if (!xcStringHelper.isStartWithLetter(name) && splitLen > 1) {
            // when starts with number
            let folderName = paths[splitLen - 2];
            folderName = folderName.toUpperCase();
            let prefix = xcHelper.checkNamePattern(category,
                PatternAction.Fix, folderName, "_");
            if (xcStringHelper.isStartWithLetter(prefix as string)) {
                name = prefix + name;
            }
        }

        if (!xcStringHelper.isStartWithLetter(name)) {
            // if still starts with number
            name = "source" + name;
        }
        name = name.toUpperCase();
        return PTblManager.Instance.getUniqName(name, nameSet);
    }

    _prepareCreateTableData() {
        const { finalSchema, fileSelectState } = this.state;
        const { fileSelected, files } = fileSelectState;

        this.setState(({ createTableState }) => ({
            createTableState: {
                ...createTableState,
                page: 0, count: 1,
                schemas: [{
                    schema: {
                        hash: defaultSchemaName,
                        columns: finalSchema
                    },
                    files: {
                        count: files.length, maxPath: fileSelected.fullPath,
                        size: files.reduce((total, file) => {
                            total += file.sizeInBytes;
                            return total;
                        }, 0)
                    }
                }]
            }
        }));
    }

    _getSchemaDetail(schemaHash) {
        const { finalSchema, fileSelectState } = this.state;
        const { files } = fileSelectState;

        const detail = {
            hash: schemaHash,
            columns: finalSchema,
            files: [...files]
        };
        this.setState({
            schemaDetailState: {
                schema: detail,
                isLoading: false, error: null
            }
        });
    }

    _extractFileInfo(fullPath) {
        const dirname = Path.join(Path.dirname(fullPath), '/');
        const basename = Path.basename(fullPath);
        return {
            path: dirname,
            filePattern: basename
        };
    }

    _getConfigHash({ selectedFileDir }) {
        const str = JSON.stringify([...selectedFileDir]);
        return crypto.createHash('md5').update(str).digest('hex');
    }

    _changeStep(newStep) {
        this.setState({
            currentStep: newStep
        });

        this._eventOnStepChange(newStep);
    }

    _isConfigChanged() {
        const { selectedFileDir } = this.state;
        const configHash = this._getConfigHash({
            selectedFileDir: selectedFileDir
        });
        return configHash !== this._initConfigHash;
    }

    _setBucket(bucket) {
        bucket = bucket.trim();
        const isBucketChanged = bucket !== this.state.bucket;
        if (isBucketChanged) {
            if (this._isConfigChanged()) {
                // XXX TODO: unsaved changes, what should we do?
                console.log('Load config discarded');
            }
            this._resetBrowseResult();
        }
        this.setState({
            bucket: bucket
        });
    }

    _setPath(path) {
        path = path.trim();
        const isPathChanged = path !== this.state.homePath;
        if (isPathChanged) {
            if (this._isConfigChanged()) {
                // XXX TODO: unsaved changes, what should we do?
                console.log('Load config discarded');
            }
            this._resetBrowseResult();
        }
        this.setState({
            homePath: path
        });
    }

    _setConnector(connector) {
        if (!connector) return;
        connector = connector.trim();
        if (connector === "+NewConnector") {
            LoadScreen.switchTab("connector");
            DSTargetManager.showTargetCreateView();
            return;
        }
        const isConnectorChanged = connector !== this.state.connector;
        if (isConnectorChanged) {
            if (this._isConfigChanged()) {
                // XXX TODO: unsaved changes, what should we do?
                console.log('Load config discarded');
            }
            this._resetBrowseResult();
        }
        this.setState({
            connector: connector
        });
    }

    _resetParserResult(newParserType = null): SchemaService.InputSerialization {
        this._resetDiscoverResult();
        let inputSerialization = this.state.inputSerialization;
        if (newParserType != null) {
            // Create the new input serialization according to the new fileType
            inputSerialization = SchemaService.defaultInputSerialization.get(newParserType);
            this.setState({
                inputSerialization: inputSerialization,
            });
        }
        this.setState({
            inputSerialPending: false
        });
        return inputSerialization;
    }

    _resetBrowseResult(newParserType = null) {
        const inputSerialization = this._resetParserResult(newParserType);
        this.setState({
            loadAppId: null,
            currentStep: StepEnum.SourceData,
            selectedFileDir: new Array(), // Clear selected files/folders, XXX TODO: in case file type changes, we can preserve the folders
        });
        return inputSerialization;
    }

    _resetCreateTable() {
        this.setState({
            tableToCreate: new Map(),
            createTableState: {
                page: 0,
                rowsPerPage: 20,
                count: 0,
                schemas: [],
                isLoading: false,
            },
            createInProgress: new Map(),
            createFailed: new Map(),
            createTables: new Map()
        });
    }

    _resetDiscoverResult() {
        this.setState({
            fileContentState: {
                isLoading: false,
                error: null,
                content: [],
                isAutoDetect: false,
                sampleSize: 100,
                linesSelected: [],
                lineOffset: 0,
                linesHaveError: false
            },
            selectedSchema: null,

            // Edit Schema
            editSchemaState: {
                schema: null,
                errorMessage: null
            },
            finalSchema: null,

            discoverStatsState: {
                isLoading: false,
                numFiles: null,
                numSchemas: null,
                numFailed: null
            },
            schemaDetailState: {
                isLoading: false,
                schema: null,
                error: null
            },
            showForensics: false,
            forensicsMessage: [],
            isForensicsLoading: false
        });
        this._resetCreateTable();
    }

    _setParserType(newType, isUpdatePreview = true) {
        if (newType === this.state.fileType) {
            return this.state.inputSerialization;
        }

        this.setState({ fileType: newType });
        const inputSerialization = this._resetParserResult(newType);
        if (isUpdatePreview) {
            const { fileSelectState } = this.state;
            const { fileSelected } = fileSelectState;
            if (fileSelected != null) {
                this._fetchFileContent({
                    filePath: fileSelected.fullPath,
                    inputSerialization: inputSerialization
                });
            }
        }
        return inputSerialization;
    }

    _setFinalSchema(schema) {
        this.setState({
            finalSchema: schema
        });
        this._resetCreateTable();
    }

    _setInputSerialization(newOption) {
        this.setState({
            inputSerialization: newOption,
            inputSerialPending: false
        });
        this._resetDiscoverResult();

        const { fileSelectState } = this.state;
        const { fileSelected } = fileSelectState;
        if (fileSelected != null) {
            this._fetchFileContent({
                filePath: fileSelected.fullPath,
                inputSerialization: newOption
            });
        }
    }

    async _browseClose(selectedFileDir = null, fileNamePattern = '') {
        if (selectedFileDir == null) {
            this.setState({
                browseShow: false
            });
            return false;
        }

        const currentSelection = this.state.selectedFileDir.map((v) => v.fullPath);
        const newSelection = selectedFileDir.map((v) => v.fullPath);
        const currentNamePattern = this.state.fileNamePattern;
        const hasChange = SetUtils.diff(currentSelection, newSelection).size > 0 ||
            SetUtils.diff(newSelection, currentSelection).size > 0 ||
            currentNamePattern != fileNamePattern;

        if (!hasChange) {
            // No change
            this.setState({
                browseShow: false
            });
            return false;
        }

        this._resetBrowseResult();
        // Close file browser & set the result
        this.setState({
            browseShow: false,
            selectedFileDir: selectedFileDir,
            fileNamePattern: fileNamePattern
        });
        // Update the preview
        const selected = selectedFileDir[0];
        if (selected == null) {
            return false;
        }

        try {
            // Update the file selection dropdown
            const selectedFile = selected.directory
                ? await this._listSelectedFolder(this.state.connector, selected, fileNamePattern)
                : this._listSelectedFile(selected);

            // Suggest a parser/file type from file name extension
            const suggestType = SchemaService.suggestParserType(selectedFile);
            const inputSerialization = this._setParserType(suggestType, false);

            // Create a new Load App (conceptually)
            const loadApp = await SchemaLoadService.createDiscoverApp({
                targetName: this.state.connector,
            });
            this.setState({
                loadAppId: loadApp.appId
            });

            // Update file preview
            await this._fetchFileContent({
                loadApp: loadApp,
                filePath: selectedFile.fullPath,
                inputSerialization: inputSerialization
            });

            return true;
        } catch(e) {
            this._alert({
                title: 'List/Preview file error',
                message: `${e.error || e.message || e}`
            });
            return false;
        }
    }

    async _listSelectedFolder(targetName, selectedDir, listFilePattern) {
        if (!selectedDir.directory) {
            throw 'Not a directory';
        }

        this.setState({
            fileSelectState: {
                isLoading: true,
                files: [],
                fileSelected: null
            }
        });

        // list files in folder
        try {
            const fileList = await listFilesWithPattern({
                targetName: targetName,
                path: Path.join(selectedDir.fullPath, '/'),
                isRecursive: false,
                fileNamePattern: listFilePattern,
                filter: (fileInfo) => !fileInfo.directory
            });
            const defaultFile = fileList[0];
            this.setState(({ fileSelectState }) => ({
                fileSelectState: {
                    ...fileSelectState,
                    files: fileList,
                    fileSelected: fileList[0]
                }
            }));

            if (defaultFile == null) {
                throw 'No file found';
            }

            return defaultFile;
        } finally {
            this.setState(({ fileSelectState }) => ({
                fileSelectState: {
                    ...fileSelectState,
                    isLoading: false,
                }
            }));
        }
    }

    _listSelectedFile(selectedFile) {
        if (selectedFile.directory) {
            throw 'Not a file';
        }

        this.setState({
            fileSelectState: {
                isLoading: false,
                files: [{ ...selectedFile }],
                fileSelected: { ...selectedFile }
            }
        });

        return selectedFile;
    }

    async _fetchFileContent(params: {
        loadApp?: any,
        filePath: string,
        inputSerialization?: SchemaService.InputSerialization
    }) {
        const { loadApp, filePath, inputSerialization } = params;

        // Stop the previous fetching
        this._fetchFileJob.cancel();

        let cancel = false;
        this._fetchFileJob = {
            cancel: () => { cancel = true; },
            getFilePath: () => filePath
        };

        // Fetch file content
        this.setState(({ fileContentState}) => ({
            fileContentState: {
                ...fileContentState,
                isLoading: true,
                error: null
            }
        }));

        try {
            const app = loadApp || SchemaLoadService.getDiscoverApp(this.state.loadAppId);
            const { path: selectedPath, filePattern } = this._extractFileInfo(filePath);
            const fileContent = await app.previewFile({
                path: selectedPath, filePattern: filePattern,
                inputSerialization: inputSerialization || this.state.inputSerialization
            });
            const { status } = fileContent;
            if (status.errorMessage != null) {
                throw status.errorMessage;
            }

            if (!cancel) {
                let linesHaveError = fileContent.lines.find(line => {
                    return line.status.hasError;
                });

                this.setState(({fileContentState}) => ({
                    fileContentState: {
                        ...fileContentState,
                        isLoading: false,
                        isAutoDetect: false,
                        content: fileContent.lines,
                        linesSelected: [],
                        lineOffset: 0,
                        linesHaveError: linesHaveError
                    }
                }));
                if (this.state.fileType === SchemaService.FileType.CSV) {
                    // Have to pass in fileContent.lines,
                    // because setState() doesn't immediately mutate this.state
                    this._selectFileLines([0], true, fileContent.lines); // auto select 1st row in csv
                }

            }
        } catch(e) {
            if (!cancel) {
                this.setState(({fileContentState}) => ({
                    fileContentState: {
                        ...fileContentState,
                        isLoading: false,
                        error: `${e.message || e.error || e}`
                    }
                }));
            }
        }
    }

    async _selectFileLines(indexList, isSelect, content = null) {
        try {
            // Check empty file
            const fileLines = content || this.state.fileContentState.content;
            if (!Array.isArray(fileLines) || fileLines.length == 0) {
                throw 'File is empty';
            }

            // Figure out the lines still selected
            const selected = new Set<number>(this.state.fileContentState.linesSelected);
            const changes = new Set<number>(indexList);
            const result = [...(isSelect
                ? SetUtils.union(selected, changes)
                : SetUtils.diff(selected, changes))].sort((a,b) => a - b);

            if (result.length > 5) {
                throw 'Please select no more than 5 records';
            }

            // Merge(union) the selected schemas
            let columns = [];
            let rowpath = null;
            for (const index of result) {
                const schema = fileLines[index].schema;
                if (rowpath == null) {
                    rowpath = schema.rowpath;
                } else {
                    if (rowpath != schema.rowpath) {
                        throw `Different rowpath in line ${index + 1}`;
                    }
                }

                columns = columns.concat(schema.columns);
            }
            const unionColumns = [...SchemaService.unionSchemas(columns)];

            // Set unionized schema in Edit Schema
            let proceed = true;
            if (unionColumns.length > 0) {
                const schema = {
                    rowpath: rowpath,
                    columns: unionColumns
                };
                proceed = await this._selectSchema(schema);
            } else {
                proceed = await this._selectSchema(null);
            }

            // Update schema selection state
            if (proceed) {
                this.setState(({fileContentState}) => ({
                    fileContentState: {
                        ...fileContentState,
                        linesSelected: [...result],
                        isAutoDetect: result.length > 0 ? false : fileContentState.isAutoDetect
                    }
                }));
            }
        } catch(e) {
            this._alert({
                title: 'Select Schema Error',
                message: `${e.message || e.error || e}`
            });
        }
    }

    async _selectSchema(schema) {
        if (isSchemaChanged(this.state)) {
            const changeConfirmed = await this._confirm({
                title: 'Overwrite Schema',
                message: 'Do you want to proceed?'
            });
            if (!changeConfirmed) {
                return false;
            }
        }

        try {
            this.setState(({editSchemaState}) => ({
                selectedSchema: schema,
                editSchemaState: {
                    ...editSchemaState,
                    isFocus: schema != null,
                    schema: schema == null ? null : JSON.stringify(schema),
                },
            }));

            if (schema != null) {
                SchemaService.validateSchema(schema);
            }
            this.setState(({ editSchemaState }) => ({
                selectedSchema: schema,
                editSchemaState: {
                    ...editSchemaState,
                    errorMessage: null
                }
            }));

            this._setFinalSchema(schema);
        } catch(e) {
            this.setState(({ editSchemaState }) => ({
                editSchemaState: {
                    ...editSchemaState,
                    errorMessage: `${e}`
                }
            }));
            this._setFinalSchema(null);
        }

        return true;

        function isSchemaChanged(state) {
            const { selectedSchema, editSchemaState } = state;
            const { schema } = editSchemaState;

            return (selectedSchema != null && schema != null && schema != JSON.stringify(selectedSchema));
        }
    }

    _setPreviewOffset(offset) {
        this.setState(({fileContentState}) => ({
            fileContentState: {
                ...fileContentState,
                lineOffset: offset
            }
        }));
    }

    _handleSchemaChange({ schema, error, validSchema }) {
        this.setState({
            editSchemaState: {
                schema: schema,
                errorMessage: error
            },
        });
        this._setFinalSchema(validSchema)
    }

    _enableAutoDetectSchema(isEnable) {
        this.setState(({ fileContentState }) => ({
            fileContentState: {
                ...fileContentState,
                isAutoDetect: isEnable,
                linesSelected: isEnable ? [] : fileContentState.linesSelected
            }
        }));
    }

    _browseOpen() {
        this.setState({
            browseShow: true
        });
    }

    _alert({ title, message }) {
        try {
            Alert.show({
                title: title,
                msg: message,
                isAlert: true
            });
        } catch(_) {
            // Ignore the error
        }
    };

    _confirm({ title, message }): Promise<boolean> {
        return new Promise((resolve) => {
            Alert.show({
                title: title,
                msg: message,
                onCancel: () => { resolve(false); },
                onConfirm: () => { resolve(true); }
            });
        });
    }

    _navToNotebook() {
        HomeScreen.switch(UrlToTab.notebook);
    }

    render() {
        const {
            connector,
            bucket,
            homePath,
            fileNamePattern,
            fileType,
            inputSerialization,
            inputSerialPending,
            currentStep,
            selectedFileDir, // Output of Browse
            fileSelectState,
            fileContentState,
            editSchemaState,
            tablePreviewState,
            selectedSchema,
            finalSchema,
            browseShow,
            currentNavStep
        } = this.state;

        const showBrowse = browseShow;
        const showDiscover = currentStep === StepEnum.SchemaDiscovery && selectedFileDir.length > 0;
        const showCreate = currentStep === StepEnum.CreateTables;
        const fullPath = Path.join(bucket, homePath);
        const forensicsStats = this.metadataMap.get(fullPath);
        let containerClass = "container cardContainer";
        containerClass += (" step" + currentNavStep);

        const createDataPreview = () => {
            if (!tablePreviewState.isShow) {
                return null;
            }

            const createTable = async () => {
                const table = await this._createTableForPreview(finalSchema, fileSelectState.files.length);
                const cursor = table.data.createCursor();
                await cursor.open();
                return {
                    table: table.data,
                    cursor: cursor
                };
            };
            const createTask = createTable();

            const onFetchMeta = async () => {
                const { table, cursor } = await createTask;
                const { columns } = await table.getInfo();
                return {
                    columns: columns,
                    numRows: Math.min(cursor.getNumRows(), numRowsForPreview)
                };
            };

            const onFetchData = async ({ offset, pageSize }) => {
                const { cursor } = await createTask;
                await cursor.position(offset);
                return await cursor.fetchJson(pageSize);
            }

            const onClose = async () => {
                try {
                    const { table } = await createTask;
                    await table.destroy();
                } catch(_) {
                    // Ignore error;
                }
            }

            return (
                <DataPreviewModal
                    onFetchData={onFetchData}
                    onFetchMeta={onFetchMeta}
                    onClose={async () => {
                        this.setState(({tablePreviewState}) => ({
                            tablePreviewState: {
                                ...tablePreviewState,
                                isShow: false
                            }
                        }));
                        await onClose();
                    }}
                />

            );
        };

        // Find out empty column names
        // For example in CSV:
        // a,b,c,,
        // 1,2,3,4,5
        let persistSchemaError = null;
        try {
            for (const { status } of fileContentState.content) {
                const { hasError, unsupportedColumns } = status;
                if (hasError) {
                    for (const { name } of unsupportedColumns) {
                        if (name.length === 0 || name === '""') {
                            throw 'Field(s) with no names detected';
                        }
                    }
                }
            }
        } catch(e) {
            persistSchemaError = `${e}`;
        }

        return (
            <React.Fragment>
            <div className="loadNavBar">
                {[1,2,3].map((num) => {
                    return <LoadStep
                                key={num}
                                num={num}
                                isSelected={currentNavStep === num}
                                desc={navBarStepNameMap[num]}
                                isSelectable={(num === 1) ||
                                    (stepNumMap[currentStep] !== 1 && num <= 2) ||
                                    (finalSchema != null)}
                                onSelect={() => {
                                    if (this.state.currentNavStep === num) {
                                        return;
                                    }
                                    this.setState({
                                        currentNavStep: num
                                    });
                                    if (num === 1) {
                                        this._changeStep(StepEnum.SchemaDiscovery);
                                    } else if (num === 2) {
                                        this._changeStep(StepEnum.SchemaDiscovery);
                                        this.setState({
                                            schemaDetailState: {
                                                isLoading: false, error: null, schema: null
                                            }
                                        });
                                    } else if (num === 3) {
                                        this._changeStep(StepEnum.CreateTables);
                                        this._prepareCreateTableData();
                                    }
                                }}
                            />
                })}
            </div>
            <div className={containerClass}>
                {/* start of card main */}
                <div className="cardMain">
                    <div className="leftPart">
                        <SourceData
                            connector={connector}
                            bucket={bucket}
                            path = {homePath}
                            onClickBrowse={() => { this._browseOpen(); }}
                            onBucketChange={(newBucket) => { this._setBucket(newBucket); }}
                            onPathChange={(newPath) => { this._setPath(newPath); }}
                            isForensicsLoading={this.state.isForensicsLoading}
                            fetchForensics={this._fetchForensics}
                            canReset={showDiscover || showCreate}
                            onReset={this._resetAll}
                            onConnectorChange={(newConnector) => {this._setConnector(newConnector);}}
                            selectedFileDir={selectedFileDir}
                            fileSelectProps={this.state.fileSelectState}
                        />
                        {
                            showBrowse &&
                            <BrowseDataSourceModal
                                connector={connector}
                                bucket={bucket}
                                homePath={homePath}
                                fileNamePattern={fileNamePattern}
                                fileType={fileType}
                                selectedFileDir={selectedFileDir}
                                onPathChange={(newPath) => {
                                    this.setState({
                                        homePath: newPath.trim()
                                    });
                                }}
                                onCancel={() => { this._browseClose(); }}
                                onDone={async (selectedFileDir, fileNamePattern) => {
                                    try {
                                        this.setState({
                                            waitingBrowseClose: true
                                        });
                                        const success = await this._browseClose(selectedFileDir, fileNamePattern);
                                        if (success) {
                                            this._changeStep(StepEnum.SchemaDiscovery);
                                        }
                                    } catch(_) {
                                        // Do nothing
                                    }
                                    this.setState({
                                        waitingBrowseClose: false
                                    });
                                }}
                            />
                        }
                        {this.state.waitingBrowseClose && <RefreshIcon />}
                        {
                            showDiscover &&
                            <DiscoverSchemas
                                selectedFileDir={selectedFileDir}
                                parserType={fileType}
                                onParserTypeChange={(newType) => { this._setParserType(newType); }}
                                inputSerialization={this.state.inputSerialization}
                                onInputSerialChange={(newConfig) => { this._setInputSerialization(newConfig); }}
                                onInputSerialPending={(isPending) => { this.setState({ inputSerialPending: isPending }); }}
                                fileSelectProps={{
                                    ...fileSelectState,
                                    onSelect: (file) => {
                                        const currentFile = fileSelectState.fileSelected;
                                        if (currentFile == null || currentFile.fullPath != file.fullPath) {
                                            this.setState(({ fileSelectState }) => ({
                                                fileSelectState: {
                                                    ...fileSelectState,
                                                    fileSelected: { ...file }
                                                }
                                            }));
                                            this._resetDiscoverResult();
                                            if (file != null) {
                                                this._fetchFileContent({ filePath: file.fullPath });
                                            }
                                        }
                                    }
                                }}
                                fileContentProps={{
                                    ...fileContentState,
                                    onLineChange: (indexList, isSelect) => { this._selectFileLines(indexList, isSelect); },
                                    onAutoDetectChange: (checked) => { this._enableAutoDetectSchema(checked); },
                                    onOffsetChange: (offset) => { this._setPreviewOffset(offset); },
                                    onClickDiscover: () => {},
                                    onSampleSizeChange: (size) => {}
                                }}
                                editSchemaProps={{
                                    ...editSchemaState,
                                    persistError: persistSchemaError,
                                    isMappingEditable: ![SchemaService.FileType.CSV].includes(fileType),
                                    showAdd: ![SchemaService.FileType.CSV].includes(fileType) ||
                                        (this.state.inputSerialization.CSV && this.state.inputSerialization.CSV.FileHeaderInfo !== "USE"),
                                    onSchemaChange: (result) => { this._handleSchemaChange(result); }
                                }}
                                selectedSchema={selectedSchema}
                            />
                        }
                        { createDataPreview() }

                        {(() => {
                            if (!showCreate) {
                                return null;
                            }
                            const schemas = this.state.createTableState.schemas;
                            // XXX TODO: Need a new approach to generate default table names,
                            // once the pagination is totally moved to backend,
                            // which means XD doesn't maintain the full list of files discovered
                            const nameSet = new Set();
                            for (const schemaInfo of schemas) {
                                const { schema, files } = schemaInfo;
                                if (!this.state.tableToCreate.has(schema.hash)) {
                                    const defaultTableName = this._getNameFromPath(files.maxPath, nameSet);
                                    nameSet.add(defaultTableName);
                                    this.state.tableToCreate.set(schema.hash, defaultTableName);
                                }
                            }
                            const { onCancelCreate } = this.state;
                            return (
                                <CreateTables
                                    {...this.state.createTableState}
                                    schemasInProgress={this.state.createInProgress}
                                    schemasFailed={this.state.createFailed}
                                    tablesInInput={this.state.tableToCreate}
                                    tables={this.state.createTables}
                                    onTableNameChange={(schemaName, newTableName) => {
                                        this.state.tableToCreate.set(schemaName, newTableName);
                                        this.setState({tableToCreate: this.state.tableToCreate});
                                    }}
                                    onFetchData={(p, rpp) => {}}
                                    onClickCreateTable={(schemaName, tableName) => {
                                        this._createTableFromSchema(this.state.finalSchema, tableName);
                                    }}
                                    onClickCancel={() => {
                                        if (onCancelCreate != null) {
                                            onCancelCreate();
                                        }
                                    }}
                                    onPrevScreen = {() => { this._changeStep(StepEnum.SchemaDiscovery); }}
                                    onLoadSchemaDetail = {(schemaHash) => { this._getSchemaDetail(null); }}
                                    onLoadFailureDetail = {() => { /* Not supported anymore */ }}
                                >
                                    <div className="header">{Texts.stepNameCreateTables}</div>
                                </CreateTables>
                            );
                        })()}
                    </div> {/* end of left part */}
                    <Details
                        schemaDetail={this.state.schemaDetailState}
                        discoverStats={this.state.discoverStatsState}
                        selectedFileDir={this.state.selectedFileDir}
                        discoverFileSchemas={new Map()}
                        showForensics={this.state.showForensics}
                        forensicsMessage={this.state.forensicsMessage}
                        forensicsStats={forensicsStats}
                    />
                </div>{/* end of card main */}
                <div className="cardBottom">
                     { (currentNavStep === 1) ?
                                <NavButtons
                                    right={{
                                        label: "Next",
                                        disabled: stepNumMap[currentStep] === 1 || inputSerialPending,
                                        tooltip: stepNumMap[currentStep] === 1
                                            ? "Select a file first"
                                            : (inputSerialPending ? "Finish your configuration first": ""),
                                        onClick: () => {
                                            this.setState({
                                                currentNavStep: 2
                                            });
                                        }
                                    }}
                                /> : null
                    }
                     { (showDiscover && currentNavStep === 2) ?
                            <NavButtons
                                left={{
                                    label: "Back",
                                    onClick: () => {
                                        this.setState({
                                            currentNavStep: 1
                                        });
                                    }
                                }}
                                right2={{
                                    label: "Table Preview",
                                    disabled: finalSchema == null,
                                    onClick: () => {
                                        this.setState(({ tablePreviewState }) => ({
                                            tablePreviewState: {
                                                ...tablePreviewState,
                                                isShow: true
                                            }
                                        }))
                                    }
                                }}
                                right={{
                                    label: Texts.navButtonRight2,
                                    disabled: finalSchema == null,
                                    tooltip: finalSchema == null ? Texts.CreateTableHint : "",
                                    onClick: () => {
                                        this.setState({
                                            currentNavStep: 3
                                        });
                                        this._changeStep(StepEnum.CreateTables);
                                        this._prepareCreateTableData();
                                    }
                                }}
                            /> : null
                    }
                    {(showCreate && currentNavStep === 3) ?
                        <NavButtons
                            left={{
                                label: Texts.navButtonLeft,
                                onClick: () => {
                                    this.setState({
                                        currentNavStep: 2
                                    });
                                    this._changeStep(StepEnum.SchemaDiscovery);
                                    this.setState({
                                        schemaDetailState: {
                                            isLoading: false, error: null, schema: null
                                        }
                                    })
                                }
                            }}
                            right2={{
                                label: "Load New Table",
                                disabled: this.state.createTables.size === 0,
                                tooltip: this.state.createTables.size === 0 ? Texts.loadNewTableHint : "",
                                onClick: this.state.createTables.size === 0 ? null : () => {
                                    this.setState({
                                        currentNavStep: 1
                                    });
                                    this._resetAll(null);
                                }
                            }}
                            right={{
                                label: Texts.navButtonRight,
                                classNames: ["btn-primary", "autoWidth"],
                                disabled: this.state.createTables.size === 0,
                                tooltip: this.state.createTables.size === 0 ? Texts.navToNotebookHint : "",
                                onClick: this.state.createTables.size === 0 ? null : () => {
                                    this._navToNotebook();
                                }
                            }}
                        /> : null
                    }
                </div>
            </div>
            </React.Fragment>
        );
    }
}

export { LoadConfig, StepEnum as stepEnum };