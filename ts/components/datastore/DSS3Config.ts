namespace DSS3Config {
    export function setup(): void {
        _addEventListeners();
    }

    /**
     * DSS3Config.show
     */
    export function show(): void {
        DataSourceManager.switchView(DataSourceManager.View.S3);
        _clear();
        _focusOnPath();
    }

    function _getCard(): JQuery {
        return $("#dsForm-s3Config");
    }

    function _getTargetSection(): JQuery {
        return _getCard().find(".target");
    }

    function _getPathSection(): JQuery {
        return _getCard().find(".pathSection");
    }

    function _getPathInput(): JQuery {
        return _getPathSection().find(".path input");
    }

    function _focusOnPath(): void {
        _getPathInput().eq(0).focus();
    }

    function _addPath(): JQuery {
        let $pathSection = _getPathSection();
        let $path = $pathSection.find(".content").eq(0).clone();
        $path.find("input").val("");
        $pathSection.append($path);
        return $path;
    }

    function _removePath($el: JQuery) {
        if (_getPathInput().length <= 1) {
            return; // error case handler
        }
        $el.closest(".content").remove();
    }

    function _addEventListeners(): void {
        //set up dropdown list for target
        let $card = _getCard();
        _addDropdownListeners();

        $card.on("click", ".confirm", function() {
            _submitForm();
        });

        $card.on("click", ".cancel", function() {
            _clear();
        });

        $card.on("click", ".addPath", function() {
            _addPath();
        });

        $card.on("click", ".removePath", function() {
            _removePath($(this));
        });

        $card.find(".cardBottom .link").click(function() {
            // back to data source panel
            _clear();
            DataSourceManager.startImport(null);
        });
    }

    function _addDropdownListeners(): void {
        let $dropDown = _getTargetSection().find(".dropDownList.connector");
        new MenuHelper($dropDown, {
            onOpen: function() {
                _addS3ConnectorList($dropDown);
            },
            onSelect: function($li) {
                let $input = $dropDown.find("input");
                if ($li.hasClass("createNew")) {
                    S3ConfigModal.Instance.show((targetName) => {
                        $input.val(targetName);
                    });
                    return;
                }
                $input.val($li.text());
            },
            container: "#dsFormView",
            bounds: "#dsFormView"
        }).setupListeners();
    }

    function _addS3ConnectorList($dropDown: JQuery): void {
        let html: HTML = DSTargetManager.getS3Targets()
        .map((targetName) => `<li>${targetName}</li>`)
        .join("");
        html = '<li class="createNew">+ Create New Amazon S3 Connector</li>' +
                html;
        $dropDown.find("ul").html(html);
    }

    function _validatePreview(): {
        targetName: string,
        paths: {path: string}[]
    } | null {
        let $path: JQuery = _getPathInput();
        let $target = _getTargetSection().find("input");
        let eles = [{$ele: $target}];
        let paths: {path: string}[] = [];

        $path.each((_i, el) => {
            let $ele = $(el);
            let path: string = $ele.val().trim();
            eles.push({ $ele });
            paths.push({ path });
        });

        let valid: boolean = xcHelper.validate(eles);
        
        if (!valid) {
            return null;
        }

        let targetName: string = $target.val();
        return {
            targetName,
            paths
        };
    }

    function _submitForm(): void {
        let res = _validatePreview();
        if (res == null) {
            return;
        }
        let {paths, targetName} = res;
        let cb = () => _restoreFromPreview(targetName, paths);
        _clear();
        DSPreview.show({
            targetName: targetName,
            files: paths,
            multiDS: false,
        }, cb, false);
    }

    function _restoreFromPreview(targetName: string, paths: {path: string}[]): void {
        DSS3Config.show();
        _getTargetSection().find("input").val(targetName);
        
        let $pathSection = _getPathSection();
        paths.forEach((path, i) => {
            let $input: JQuery;
            if (i === 0) {
                $input = $pathSection.find(".path input").eq(0);
            } else {
                let $path = _addPath();
                $input = $path.find("input");
            }
            $input.val(path.path);
        });
    }

    function _clear(): void {
        _focusOnPath();
        _getPathSection().find(".path").each((i, el) => {
            let $path = $(el);
            if (i === 0) {
                $path.find("input").val("");
            } else {
                $path.remove();
            }
        });
    }
}