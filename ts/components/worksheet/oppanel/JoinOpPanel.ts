class JoinOpPanel extends BaseOpPanel implements IOpPanel {
    private _$elemPanel: JQuery = null;
    private _componentFirstStep: JoinOpPanelStep1 = null;
    private _componentSecondStep: JoinOpPanelStep2 = null;
    private _templateMgr = new OpPanelTemplateManager();
    private _dataModel: JoinOpPanelModel = null;
    private _dagNode: DagNodeJoin = null;
    private static _templateIDs = { navButton: 'navButton' };
    private static _templates = {
        'navButton':
            `<button class="btn btn-rounded submit {{cssType}} {{cssDisabled}}" type="button" (click)="onClick">{{btnText}}</button>`
    };

    public setup(): void {
        this._$elemPanel = $('#joinOpPanel');
        this._componentFirstStep = new JoinOpPanelStep1({
            container: this._$elemPanel
        });
        this._componentSecondStep = new JoinOpPanelStep2({
            container: this._$elemPanel
        });
        const navButtonId = JoinOpPanel._templateIDs.navButton;
        this._templateMgr.loadTemplateFromString(
            navButtonId,
            JoinOpPanel._templates[navButtonId]
        );
        super.setup(this._$elemPanel);
    }

    public show(
        dagNode: DagNodeJoin,
        options: { isNoCast?: boolean, exitCallback?: Function }
    ): void {
        if (!super.showPanel(null, options)) {
            return;
        }
        const { isNoCast = true } = (options || {});
        this._dagNode = dagNode;
        // Setup data model
        this._dataModel = JoinOpPanelModel.fromDag(dagNode, {
            currentStep: 1,
            isAdvMode: this._isAdvancedMode(),
            isNoCast: isNoCast
        });
        if (this._dataModel.getColumnPairsLength() === 0) {
            this._dataModel.addColumnPair();
        }
        this._updateAllColumns();

        // Update UI according to the data model
        this._updateUI();
    }

    public close(isSubmit?: boolean): void {
        super.hidePanel(isSubmit);
        this._dagNode = null;
        this._dataModel = null;
        this._cachedBasicModeParam = null;
    }

    /**
     * @description
     * when graph lineage is changed, update the columns in the model and ui
     */
    public refreshColumns(): void {
        this._updateAllColumns();
        this._dataModel = JoinOpPanelModel.refreshColumns(this._dataModel, this._dagNode);
        this._updateUI();
    }

    private _updateUI() {
        // Event handlers for the container panel
        this._$elemPanel.off();
        // Close icon & Cancel button
        this._$elemPanel.on(
            'click',
            '.close, .cancel',
            () => this.close()
        );

        // Child components
        this._componentFirstStep.updateUI({
            modelRef: this._dataModel,
            onDataChange: () => {
                this._updateUI();
            }
        });
        this._componentSecondStep.updateUI({
            modelRef: this._dataModel,
            onDataChange: () => {
                this._updateUI();
            }
        });
        this._updateUINavButtons();
    }

    private _updateUINavButtons(): void {
        const findXCElement = BaseOpPanel.findXCElement;

        const $bottomSection = findXCElement(this._$elemPanel, 'bottomSection');
        const $navButtons = findXCElement($bottomSection, 'navButtons');

        let elemNavButtons: NodeDefDOMElement[];
        if (this._dataModel.isAdvMode()) {
            elemNavButtons = this._buildAdvancedButtons();
        } else {
            const currentStep = this._dataModel.getCurrentStep();
            if (currentStep === 1) {
                elemNavButtons = this._buildJoinClauseNavButtons();
            } else if (currentStep === 2) {
                elemNavButtons = this._buildRenameNavButtons();
            } else {
                // XXX TODO: reserved for Filter Join
            }
        }
        this._templateMgr.updateDOM($navButtons[0], elemNavButtons);

    }

    private _buildAdvancedButtons(): NodeDefDOMElement[] {
        let elements: NodeDefDOMElement[] = [];

        // Save button
        elements = elements.concat(this._buildNavButton({
            type: 'submit',
            text: CommonTxtTstr.Save,
            onClick: () => {
                const $elemEditor = this._$elemPanel.find(".advancedEditor");
                try {
                    const model = this._convertAdvConfigToModel(this._dataModel);
                    this._validateJoinClauses(model);
                    this._validateRenames(model);
                    this._submitForm(model);
                } catch(e) {
                    StatusBox.show(this._getErrorMessage(e), $elemEditor);
                    return false;
                }
            }
        }));

        return elements;
    }

    private _buildRenameNavButtons(): NodeDefDOMElement[] {
        let elements: NodeDefDOMElement[] = [];

        // Save button
        // XXX TODO: Show Next button for Filter Join
        elements = elements.concat(this._buildNavButton({
            type: 'submit',
            disabled: !this._isEnableSave(),
            text: CommonTxtTstr.Save,
            onClick: () => {
                this._submitForm(this._dataModel);
            }
        }));

        // Back button
        elements = elements.concat(this._buildNavButton({
            type: 'back',
            text: CommonTxtTstr.Back,
            onClick: () => {
                this._dataModel.setCurrentStep(1);
                this._updateUI();
            }
        }));

        return elements;
    }

    private _buildJoinClauseNavButtons(): NodeDefDOMElement[] {
        let elements: NodeDefDOMElement[] = [];

        // Next step button or Save button
        if (this._dataModel.isRenameNeeded()) {
            elements = elements.concat(this._buildNavButton({
                type: 'next',
                disabled: !this._isEnableNextToRename(),
                text: CommonTxtTstr.Next,
                onClick: () => {
                    this._dataModel.setCurrentStep(2);
                    this._updateUI();
                }
            }));
        } else {
            elements = elements.concat(this._buildNavButton({
                type: 'submit',
                disabled: !this._isEnableSave(),
                text: CommonTxtTstr.Save,
                onClick: () => {
                    this._submitForm(this._dataModel);
                }
            }));
        }

        return elements;
    }

    private _buildNavButton(props: {
        type: string, disabled?: boolean, text: string, onClick: () => void
    }): NodeDefDOMElement[] {
        if (props == null) {
            return [];
        }

        const { type, disabled = false, text, onClick } = props;
        return this._templateMgr.createElements(JoinOpPanel._templateIDs.navButton, {
            cssType: `btn-${type}`,
            cssDisabled: disabled ? 'btn-disabled': '',
            btnText: text,
            onClick: () => onClick()
        });
    }

    private _submitForm(model: JoinOpPanelModel) {
        if (this._dagNode != null) {
            this._dagNode.setParam(
                xcHelper.deepCopy(model.toDag())
            );
            this.close(true);
        }
    }

    private _isEnableNextToRename() {
        try {
            if (!this._dataModel.isRenameNeeded()) {
                return false;
            }
            this._validateJoinClauses(this._dataModel);
            return true;
        } catch(e) {
            return false;
        }
    }

    private _isEnableSave() {
        try {
            this._validateJoinClauses(this._dataModel);
            this._validateRenames(this._dataModel);
            return true;
        } catch(e) {
            return false;
        }
    }

    /**
     * @override BaseOpPanel._switchMode
     * @param toAdvancedMode
     */
    protected _switchMode(toAdvancedMode: boolean): {error: string} {
        this._dataModel.setAdvMode(toAdvancedMode);
        if (toAdvancedMode) {
            const param: DagNodeJoinInputStruct = this._dataModel.toDag();
            const paramStr = JSON.stringify(param, null, 4);
            this._cachedBasicModeParam = paramStr;
            this._editor.setValue(paramStr);
            this._updateUI();
        } else {
            try {
                const newModel = this._convertAdvConfigToModel(this._dataModel);
                if (newModel.getColumnPairsLength() === 0) {
                    newModel.addColumnPair();
                }
                this._dataModel = newModel;
                this._updateUI();
            } catch (e) {
                return {error: this._getErrorMessage(e)};
            }
        }
        return null;
    }

    /**
     * Convert config string to data model, throw JoinOpError/JS exception if any errors
     */
    private _convertAdvConfigToModel(oldModel: JoinOpPanelModel) {
        const dagInput: DagNodeJoinInputStruct = <DagNodeJoinInputStruct>JSON.parse(this._editor.getValue());

        if (JSON.stringify(dagInput, null, 4) !== this._cachedBasicModeParam) {
            // don't validate if no changes made, just allow to go to basic
            const error = this._dagNode.validateParam(dagInput);
            if (error) {
                throw new Error(error.error);
            }
        }

        const {
            left: leftCols,
            right: rightCols
        } = JoinOpPanelModel.getColumnsFromDag(this._dagNode);
        const {
            left: leftTableName,
            right: rightTableName
        } = JoinOpPanelModel.getPreviewTableNamesFromDag(this._dagNode);
        const newModel = JoinOpPanelModel.fromDagInput(
            leftCols, rightCols, dagInput, leftTableName, rightTableName,
            {
                currentStep: oldModel.getCurrentStep(),
                isAdvMode: oldModel.isAdvMode(),
                isNoCast: oldModel.isNoCast(),
                isFixedType: oldModel.isFixedType()
            }
        );

        if (newModel.isFixedType()
            && newModel.getJoinType() !== oldModel.getJoinType()
        ) {
            // Cannot change sub category operator's join type
            throw new Error(JoinOpError.InvalidJoinType);
        }

        return newModel;
    }

    /**
     * Validate data model, and throw JoinOpError if any errors
     * @param dataModel
     */
    private _validateJoinClauses(dataModel: JoinOpPanelModel): void {
        if (dataModel.isCrossJoin()) {
            if (!dataModel.isValidEvalString()) {
                throw new Error(JoinOpError.InvalidEvalString);
            }
        } else {
            if (dataModel.getColumnPairsLength() === 0) {
                throw new Error(JoinOpError.InvalidJoinClause);
            }
            for (const pair of dataModel.getColumnPairs()) {
                // if (this._dataModel.isColumnDetached(pair.leftName, true)) {
                //     return false;
                // }
                // if (this._dataModel.isColumnDetached(pair.rightName, false)) {
                //     return false;
                // }
                if (dataModel.isCastNeed(pair)) {
                    throw new Error(JoinOpError.NeedTypeCast);
                }
                if (pair.leftName.length === 0 || pair.rightName.length === 0) {
                    throw new Error(JoinOpError.InvalidJoinClause);
                }
            }
        }
    }

    /**
     * Validate data model, and throw JoinOpError if any errors
     * @param dataModel
     */
    private _validateRenames(dataModel: JoinOpPanelModel): void {
        const {
            columnLeft: columnCollisionLeft, prefixLeft: prefixCollisionLeft,
            columnRight: columnCollisionRight, prefixRight: prefixCollisionRight
        } = dataModel.getCollisionNames();

        if (columnCollisionLeft.size > 0 || columnCollisionRight.size > 0) {
            throw new Error(JoinOpError.ColumnNameConflict);
        }
        if (prefixCollisionLeft.size > 0 || prefixCollisionRight.size > 0) {
            throw new Error(JoinOpError.PrefixConflict);
        }
    }

    // XXX TODO: Add string in jsTStr
    private _getErrorMessage(e: Error): string {
        if (e == null || e.message == null) {
            return '';
        }
        switch (e.message) {
            case JoinOpError.ColumnTypeLenMismatch:
            case JoinOpError.InvalidJoinClause:
                return 'Invalid join clause';
            case JoinOpError.ColumnNameConflict:
                return 'Column name conflicts';
            case JoinOpError.InvalidEvalString:
                return 'Invalid eval string';
            case JoinOpError.NeedTypeCast:
                return 'Can not join columns with different type';
            case JoinOpError.PrefixConflict:
                return 'Prefix conflicts';
            case JoinOpError.InvalidJoinType:
                return 'Invalid join type';
            default:
                return e.message;
        }
    }

    private _updateAllColumns() {
        this.allColumns = [];
        const colSets = this._dagNode.getParents().map((parentNode) => {
            return parentNode.getLineage().getColumns();
        }) || [];
        const seen = {};
        colSets.forEach(cols => {
            cols.forEach(progCol => {
                if (!seen[progCol.getBackColName()]) {
                    seen[progCol.getBackColName()] = true;
                    this.allColumns.push(progCol);
                }
            });
        });
    }
}