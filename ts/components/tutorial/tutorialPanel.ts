class TutorialPanel {
    private static _instance: TutorialPanel;
    private _$panel: JQuery;    // $("#tutorialDownloadPanel");
    private _tutSet: ExtCategorySet;
    private _isFirstTouch: boolean = true;
    private currVer: number;
    private _categoryOrder: Map<string, number>;
    private _orderedCatLength: number;

    constructor() {}

    public static get Instance() {
        return  this._instance || (this._instance = new this());
    }

    public setup(): void {
        this._tutSet = new ExtCategorySet();
        this._$panel = $("#tutorialDownloadPanel");
        const self = this;

        this._$panel.on("click", ".item .download", function() {
            let tut: ExtItem = self._getTutorialFromEle($(this).closest(".item"));
            self._downloadTutorial(tut, $(this));
        });

        $("#tutorial-search").on("input", "input", function() {
            let searchKey = $(this).val().trim();
            self._refreshTutorial(searchKey);
        });

        this._setupCategoryOrder();
    };

    public active(): XDPromise<any> {
        if (this._isFirstTouch) {
            this._isFirstTouch = false;
            return this._fetchData();
        }
    }

    public request(json: {}): XDPromise<any> {
        let deferred: XDDeferred<any> = PromiseHelper.deferred();
        HTTPService.Instance.ajax(json)
        .then(function(res) {
            try {
                if (res.status === Status.Error) {
                    deferred.reject(res.error);
                } else {
                    deferred.resolve.apply(this, arguments);
                }
            } catch (e) {
                console.error(e);
                deferred.resolve.apply(this, arguments);
            }
        })
        .fail(function(error) {
            deferred.reject(JSON.stringify(error));
        });

        return deferred.promise();
    }

    private _fetchData(): XDPromise<any> {
        let deferred: XDDeferred<any> = PromiseHelper.deferred();
        this._$panel.addClass("wait");
        const self = this;
        let url = xcHelper.getAppUrl();
        this.request({
            "type": "GET",
            "dataType": "JSON",
            "url": url + "/tutorial/listPackage"
        })
        .then(function(data) {
            self._$panel.removeClass("wait");
            try {
                let d = data;
                self._initializeTutCategory(d);
            } catch (error) {
                self._handleError(error);
            }
            deferred.resolve();
        })
        .fail(function(error) {
            self._handleError(error);
            return deferred.reject();
        });
        return deferred.promise();
    }

    private _handleError(error): void {
        console.error("get tutorial error", error);
        this._$panel.removeClass("wait").removeClass("hint").addClass("error");
    }

    private _initializeTutCategory(tutorials): void {
        tutorials = tutorials || [];

        for (let i = 0, len = tutorials.length; i < len; i++) {
            // XXX remove this hack
            if (XVM.isSingleUser() && tutorials[i].appName === "ExportDrivers") {
                continue;
            }
            this._tutSet.addExtension(tutorials[i]);
        }

        this._refreshTutorial();
    }

    private _refreshTutorial(searchKey?: string): void {
        let categoryList: ExtCategory[] = this._tutSet.getList();
        categoryList.sort((firstCat: ExtCategory, secondCat: ExtCategory) => {
            let firstName = firstCat.getName();
            let secName = secondCat.getName();
            let firstVal: number;
            if (this._categoryOrder.has(firstName)) {
                firstVal = this._categoryOrder.get(firstName);
            } else {
                firstVal = this._orderedCatLength;
            }
            let secVal: number;
            if (this._categoryOrder.has(secName)) {
                secVal = this._categoryOrder.get(secName);
            } else {
                secVal = this._orderedCatLength;
            }
            return (firstVal - secVal);
        });
        this._generateTutView(categoryList, searchKey);
    }

    private _downloadTutorial(tut: ExtItem, $submitBtn: JQuery): XDPromise<any> {
        let deferred: XDDeferred<any> = PromiseHelper.deferred();
        let url: string = xcHelper.getAppUrl();
        $submitBtn.text("Downloading");
        xcUIHelper.toggleBtnInProgress($submitBtn, true);
        let name: string = WorkbookPanel.wbDuplicateName(tut.getName(),
            WorkbookManager.getWorkbooks(), 0);
        this.request({
            "type": "POST",
            "dataType": "JSON",
            "url": url + "/tutorial/download",
            "data": {name: tut.getName(), version: tut.getVersion()},
        })
        .then((res) => {
            return WorkbookPanel.createNewWorkbook(name, null, null, atob(res.data));
        })
        .then(() => {
            return WorkbookManager.switchWKBK(WorkbookManager.getIDfromName(name), false);
        })
        .then(deferred.resolve)
        .fail(function(error) {
            xcUIHelper.toggleBtnInProgress($submitBtn, true);
            $submitBtn.text("Download");
            Alert.error(ErrTStr.TutDownloadFailure, error);
            deferred.reject(error);
        });
        return deferred.promise();
    }

    private _getTutorialFromEle($tut: JQuery): ExtItem {
        let tutName: string = $tut.find(".tutorialName").data("name");
        let category: string = $tut.closest(".category").find(".categoryName").text();
        category = category.split("Category: ")[1];
        let tut: ExtItem = this._tutSet.getExtension(category, tutName);
        return tut;
    }

    private _generateTutView(categoryList: ExtCategory[], searchKey?: string): void {
        let html: string = "";

        for (let i = 0, len = categoryList.length; i < len; i++) {
            html += this._getTutViewHTML(categoryList[i], searchKey);
        }

        if (html === "") {
            this._$panel.addClass("hint");
        } else {
            this._$panel.removeClass("hint").find(".category").remove()
                .end()
                .append(html);
        }
    }

    private _getTutViewHTML(category: ExtCategory, searchKey?: string): string {
        let tutorials = category.getExtensionList(searchKey);
        let tutLen = tutorials.length;

        let html = "";

        for (let i = 0; i < tutLen; i++) {
            let tut = tutorials[i];

            const minXDVersion = tut.getMinXDVersion();
            const maxXDVersion = tut.getMaxXDVersion();
            if (minXDVersion) {
                const comparedToCurrent = XVM.compareToCurrentVersion(minXDVersion);
                if (comparedToCurrent === VersionComparison.Invalid || comparedToCurrent === VersionComparison.Bigger) {
                    continue;
                }
            }
            if (maxXDVersion) {
                const comparedToCurrent = XVM.compareToCurrentVersion(maxXDVersion);
                if (comparedToCurrent === VersionComparison.Invalid || comparedToCurrent === VersionComparison.Smaller) {
                    continue;
                }
            }

            let btnText = "Download";
            let btnClass: string = "download";

            let showDocLink = tut.getLink() && tut.getLink() !== "https://www.xcalar.com"
            let docLink = showDocLink ? '<a href="' + tut.getLink() + '" target="_blank">Documentation</a>' : ''

            let image = tut.getImage();
            html += '<div class="item ' + tut.getName() + '">' +
                        '<section class="mainSection">' +
                        '<div class="leftPart">' +
                            '<div class="logoArea ' + image + '">' +
                                '<i class="icon ' + image + '"></i>' +
                            '</div>' +
                            '<div class="instruction">' +
                                '<div class="tutorialName textOverflowOneLine"' +
                                ' data-name="' + tut.getName() + '">' +
                                    tut.getMainName() +
                                '</div>' +
                                '<div class="author textOverflowOneLine">' +
                                    'By ' + tut.getAuthor() +
                                '</div>' +
                                '<div class="detail textOverflow">' +
                                    tut.getDescription() +
                                '</div>' +
                            '</div>' +
                        '</div>'+
                        '<div class="rightPart">' +
                            '<div class="buttonArea">' +
                                '<button class="btn btn-submit install ' + btnClass + '">' +
                                    btnText +
                                '</button>' +
                            '</div>' +
                            '<div class="linkArea">' +
                                docLink +
                            '</div>' +
                        '</div>' +
                        '</section>' +
                    '</div>';
        }

        if (html !== "") {
            html = '<div class="category cardContainer ' + category.getName() + '">' +
                        '<header class="cardHeader">' +
                            '<div class="title textOverflowOneLine categoryName">' +
                                "Category: " + category.getName() +
                            '</div>' +
                        '</header>' +
                        '<div class="cardMain items">' +
                        html +
                    '</div></div>';
        }

        return html;
    }

    // Reorders the categories. If it is not in this map, it will be ordered alphabetically.
    private _setupCategoryOrder() {
        this._categoryOrder = new Map<string, number>();
        this._categoryOrder.set("import", 0);
        this._categoryOrder.set("imports", 1);
        this._categoryOrder.set("sql mode", 2);
        this._categoryOrder.set("advanced mode", 3);
        this._categoryOrder.set("export/publish", 4);
        this._categoryOrder.set("system", 5);
        this._orderedCatLength = 6;
    }
}
