class DFLinkOutOpPanel extends BaseOpPanel {
    private dagNode: DagNodeDFOut;
    private dagGraph: DagGraph;

    public constructor() {
        super();
        this._setup();
    }

    public show(dagNode: DagNodeDFOut, options?): boolean {
        if (!super.showPanel("Link Out", options)) {
            return false;
        }
        this._initialize(dagNode);
        this._restorePanel();
        return true;
    }

    public close(isSubmit?: boolean): void {
        if (!this._formHelper.isOpen()) {
            return;
        }
        super.hidePanel(isSubmit);
    }

    private _setup(): void {
        super.setup($("#dfLinkOutPanel"));
        this._addEventListeners();
    }

    private _initialize(dagNode: DagNodeDFOut): void {
        this.dagNode = dagNode;
        this.dagGraph = DagView.getActiveDag();
        if (!this.dagGraph.hasNode(this.dagNode.getId())) {
            throw new Error("Invalid dag node");
        }
    }

    private _restorePanel(): void {
        const param: DagNodeDFOutInputStruct = this.dagNode.getParam();
        this._getLinkOutNameInput().val(param.name);

        const $checkbox: JQuery = this._getOptionCheckbox().find(".checkbox");
        if (param.linkAfterExecution) {
            $checkbox.addClass("checked");
        } else {
            $checkbox.removeClass("checked");
        }
    }

    private _addEventListeners(): void {
        const $panel: JQuery = this._getPanel();

        $panel.on("click", ".close", () => {
            this.close();
        });

        $panel.on("click", ".submit", (event) => {
            $(event.target).blur();
            this._submitForm();
        });

        const $checkboxSection: JQuery = this._getOptionCheckbox();
        $checkboxSection.on("click", ".checkbox, .text", () => {
            this._getOptionCheckbox().find(".checkbox").toggleClass("checked");
        });
    }

    private _submitForm(): void {
        const args: DagNodeDFOutInputStruct = this._validate();
        if (args == null) {
            // invalid case
            return;
        }
        this.dagNode.setParam(args);
        this.close(true);
    }

    private _validate(): DagNodeDFOutInputStruct {
        const $input: JQuery = this._getLinkOutNameInput();
        const name: string = $input.val().trim();
        const isValid: boolean = xcHelper.validate([{
            $ele: $input
        }, {
            $ele: $input,
            check: () => {
                return this._isNonUniqueName(name);
            },
            error: OpPanelTStr.DFLinkOutNameDup
        }]);
        if (isValid) {
            const linkAfterExecution: boolean = this._getOptionCheckbox()
            .find(".checkbox").hasClass("checked");
            return {
                name: name,
                linkAfterExecution: linkAfterExecution
            };
        } else {
            return null;
        }
    }

    private _isNonUniqueName(name: string): boolean {
        const nodes: DagNode[] = this.dagGraph.filterNode((node: DagNode) => {
            return node.getType() === DagNodeType.DFOut &&
            (<DagNodeDFOut>node).getParam().name === name &&
            node !== this.dagNode;
        });
        return nodes.length !== 0;
    }

    private _getLinkOutNameInput(): JQuery {
        return this._getPanel().find(".linkOutName input");
    }

    private _getOptionCheckbox(): JQuery {
        return this._getPanel().find(".option .checkboxSection");
    }
}