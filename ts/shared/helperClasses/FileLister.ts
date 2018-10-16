class FileLister {
    private _fileObject: FileListerFolder; //Object holding all the datasets
    private _currentPath: string[];
    private _futurePath: string[];
    private _$section: JQuery;
    private _renderTemplate: (files: {name: string, id: string}[], folders: string[]) => string;
    private _rootPath: string;

    public constructor(
        $section: JQuery,
        options: {
            renderTemplate: (files: {name: string, id: string}[], folders: string[]) => string
        }
    ) {
        this._$section = $section;
        this._renderTemplate = options.renderTemplate;
        this._rootPath = DSTStr.Home;
        this._resetPath();
        this._addEventListeners();
    }

    /**
     * Set the root path to show
     * @param rootPath
     */
    public setRootPath(rootPath: string): void {
        this._rootPath = rootPath;
    }

    /**
     * Set the file info to list
     * if the path represent a folder, do {path: /folderPath/, id: null}
     * @param fileList
     */
    public setFileObj(fileList: {path: string, id: string}[]): void {
        this._fileObject = { folders:{}, files: [] };
        for (let i = 0; i < fileList.length; i++) {
            let obj: FileListerFolder = this._fileObject;
            const path: string = fileList[i].path;
            const splitPath: string[] = path.split("/");
            const splen: number = splitPath.length;
            for (let j = 1; j < splen - 1; j++) {
                if (obj.folders[splitPath[j]] == null) {
                    obj.folders[splitPath[j]] = {folders: {}, files: []};
                }
                obj = obj.folders[splitPath[j]];
            }
            if (splitPath[splen - 1] && fileList[i].id) {
                // when it's not a folder
                obj.files.push({name: splitPath[splen - 1], id: fileList[i].id});
            }
        }
    }

    /**
     * Redner the file lister UI
     */
    public render(): void {
        return this._render();
    }

    /**
     * Get the current folder's path
     */
    public getCurrentPath(): string {
        const len: number = this._currentPath.length;
        if (len=== 0) {
            return "";
        }
        return this._currentPath[len- 1];
    }

    /**
     * Go to the root path and re-render
     */
    public goToRootPath(): void {
        this._resetPath();
        this._render();
    }

    /**
     * Go to a path and re-render
     * @param path
     */
    public goToPath(path: string): void {
        this._currentPath = [];
        this._futurePath = [];
        let splitPath: string[] = path.split('/');
        for (let i = 1; i < splitPath.length - 1; i++) {
            this._currentPath.push(splitPath[i]);
        }
        if (this._currentPath.length > 0) {
            this._getBackBtn().removeClass('xc-disabled');
        }
        this._render();
    }

    private _render(): void {
        if (this._fileObject == null) {
            return;
        }
        const pathLen: number = this._currentPath.length;
        let curObj: FileListerFolder = this._fileObject;
        let path: string = "";
        let fullPath: string = "/";
        if (pathLen === 0) {
            path = this._rootPath + " /";
        } else {
            path = '<span class="path" data-path="/">' +
                        this._rootPath +
                    '</span>' + ' / ';
        }
        // Wind down the path
        for (let i = 0; i < pathLen; i++) {
            const currentPath: string = this._currentPath[i];
            fullPath += currentPath + "/";
            // Only show the last two
            if (i < pathLen - 2) {
                path += '...' + ' / ';
            } else if (i !== pathLen - 1) {
                path += '<span class="path" data-path="' + fullPath + '">' +
                            currentPath +
                        '</span>' + ' / ';
            } else {
                path += currentPath + ' /';
            }
            curObj = curObj.folders[currentPath];
        }
        const folders: string[] = Object.keys(curObj.folders);
        const html: HTML = this._renderTemplate(curObj.files, folders);
        this._$section.find(".pathSection .path").html(path);
        this._$section.find(".listView ul").html(html);
    }

    private _resetPath(): void {
        this._currentPath = [];
        this._futurePath = [];
        this._getForwardBtn().addClass("xc-disabled");
        this._getBackBtn().addClass("xc-disabled");
    }

    private _addEventListeners(): void {
        const $listSection = this._$section.find(".listView ul");
        const self = this;
        // enter a folder
        $listSection.on("dblclick", ".folderName", function() {
            self._currentPath.push($(this).text());
            self._futurePath = [];
            self._render();
            self._getForwardBtn().addClass('xc-disabled');
            self._getBackBtn().removeClass('xc-disabled');
        });

        this._getBackBtn().click(() => {
            this._futurePath.push(this._currentPath.pop());
            this._render();
            this._getForwardBtn().removeClass('xc-disabled');
            if (this._currentPath.length == 0) {
                this._getBackBtn().addClass('xc-disabled');
            }
        });

        this._getForwardBtn().click(() => {
            this._currentPath.push(this._futurePath.pop());
            this._getBackBtn().removeClass('xc-disabled');
            this._render();
            if (this._futurePath.length == 0) {
                this._getForwardBtn().addClass('xc-disabled');
            }
        });

        this._$section.find(".pathSection").on("click", ".path span", (event) => {
            const path = $(event.currentTarget).data("path");
            this.goToPath(path);
        });
    }

    private _getForwardBtn(): JQuery {
        return this._$section.find(".forwardFolderBtn");
    }

    private _getBackBtn(): JQuery {
        return this._$section.find(".backFolderBtn");
    }
}