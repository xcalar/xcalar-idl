class OpPanelComponentFactory {
    private _menuBoundSelector;
    private _templateMgr = new OpPanelTemplateManager();

    // Template of components
    // templateId => template string
    private _templates = {
        header:
            `<div class="title selTitle">{{title}}</div>
            <i class="close icon xi-close" (click)="onClose"></i>`,

        opSection:
            `<APP-INSTR></APP-INSTR><APP-ARGS></APP-ARGS>`,

        instruction:
            `<p class="mainInstructions instrText selInstruction">{{instrStr}}</p>`,

        addMoreButton:
            `<div class="{{cssClass}}" (click)="onClick">
                <button class="btn iconBtn">
                    <i class="icon xi-plus fa-14"></i>{{btnText}}
                </button>
            </div>`,

        hintDropdown:
            `<div class="field row clearfix">
                <div class="description">{{name}}</div>
                <div class="inputWrap">
                    <div class="dropDownList hintDropdown selDropdown">
                        <input class="type-column selInput selError" type="text"
                            value="{{inputValue}}" placeholder="{{placeholder}}" spellcheck="false"
                            (input)="onInput" (keydown)="onKeydown" (change)="onChange" />
                        <div class="list hint">
                            <ul><APP-LIST></APP-LIST></ul>
                            <div class="scrollArea top">
                                <i class="arrow icon xi-arrow-up"></i>
                            </div>
                            <div class="scrollArea bottom">
                                <i class="arrow icon xi-arrow-down"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <APP-ADDMORE></APP-ADDMORE>
            </div>`,

        checkBoxSection:
            `<div class="field row clearfix">
                <div class="checkboxWrap" (click)="onClick">
                    <div class="checkbox {{cssChecked}}">
                        <i class="icon xi-ckbox-empty fa-15"></i>
                        <i class="icon xi-ckbox-selected fa-15"></i>
                    </div>
                    <div class="text">{{name}}</div>
                </div>
            </div>`,

        hintMenuItemEmpty:
            `<li class="hintEmpty">${CommonTxtTstr.NoResult}</li>`,

        columnMenuItem:
            `<li>
                <div class="typeIcon flexContainer {{colTypeClass}}">
                    <div class="flexWrap flex-left" data-toggle="tooltip" data-title="{{colType}}" data-container="body" data-placement="top">
                        <span class="iconHidden"></span>
                        <span class="type icon"></span>
                    </div>
                    <div class="flexWrap flex-mid">{{colName}}</div>
                    <div class="flexWrap flex-right"></div>
                </div>
            </li>`,
        
        simpleInput:
            `<div class="field row clearfix">
                <div class="description">{{name}}</div>
                <div class="inputWrap">
                    <input class="selInput selError" type="{{type}}"
                        value="{{inputValue}}" placeholder="{{placeholder}}" spellcheck="false"
                        (input)="onInput" (change)="onChange" (blur)="onBlur" />
                </div>
            </div>`,
        
        renameRow:
            `<div class="flexrow row-rename">
                <div class="flexCol flexCol-left">
                    <APP-COLFROM></APP-COLFROM>
                </div>
                <div class="flexCol flexCol-right">
                    <input type="text" class="selTo selError {{cssNoEdit}}" spellcheck="false" disabled="{{disableChange}}" value="{{nameTo}}" (change)="onNameToChange"/>
                </div>
            </div>`,

        renameSection:
            `<div class="field row clearfix">
                <div class="description">{{name}}</div>
                <APP-RENAMES></APP-RENAMES>
            </div>`,

        columnNameType:
            `<div class="typeIcon flexContainer flexRow {{cssType}}">
                <div class="flexWrap flex-left" data-toggle="tooltip" data-title="{{colType}}" data-container="body" data-placement="top">
                    <span class="iconHidden"></span>
                    <span class="type icon"></span>
                </div>
                <div class="flexWrap flex-mid"><input type="text" class="noEdit" spellcheck="false" disabled="true" value="{{colName}}"/></div>
            </div>`,
    };

    // Input box value check functions
    // AutogenSectionProps.valueCheck.checkType => function to validate value
    // Parameters: the last one must be the value needs to be checked
    // XXX TODO: Move to a seperate class, throw exception to report error
    public checkFunctions = {
        integerDefault: function(v: string): ValueCheckResult<number> {
            return { value: Number(v) };
        },
        integer: function(v: string): ValueCheckResult<number> {
            const emptyCheck = this.stringNoEmpty(v);
            if (emptyCheck.errMsg != null) {
                return { errMsg: emptyCheck.errMsg };
            }
            
            const n = Number(v);
            if (Number.isNaN(n)) {
                return { errMsg: ErrTStr.OnlyNumber };
            } else if (!Number.isInteger(n)) {
                return { errMsg: ErrTStr.OnlyInt };
            }
            return { value: n };
        },
        integerRange: function(
            range: {min?: number, max?: number}, v: string
        ): ValueCheckResult<number> {
            const intCheck = this.integer(v);
            if (intCheck.errMsg != null) {
                return { errMsg: intCheck.errMsg };
            }

            const num = intCheck.value;
            if (range.min != null && num < range.min) {
                return {
                    errMsg: xcHelper.replaceMsg(ErrWRepTStr.NoLessNum, {
                        num: range.min
                    })
                };
            }
            if (range.max != null && num > range.max) {
                return {
                    errMsg: xcHelper.replaceMsg(ErrWRepTStr.NoBiggerNum, {
                        num: range.max
                    })
                };
            }

            return { value: num };
        },
        integerRangeCanBeEmpty: function(
            range: {min?: number, max?: number}, v: string
        ): ValueCheckResult<number> {
            if (v.trim().length === 0) {
                return { value: -1 };
            }
            return this.integerRange(range, v);
        },
        stringDefault: function(v: string): ValueCheckResult<string> {
            return { value: v };
        },
        stringNoEmpty: function(v: string): ValueCheckResult<string> {
            v = v.trim();
            if (v.length === 0) {
                return { errMsg: ErrTStr.NoEmpty };
            }
            return { value: v };
        },
        stringNoEmptyValue: function(v: string): ValueCheckResult<string> {
            const str = v.trim();
            const result = this.stringNoEmpty(v);
            result.value = str;
            return result;
        },
        stringColumnName: function(
            allColSet: Set<string>, v: string
        ): ValueCheckResult<string> {
            const colName = v.trim();
            if (allColSet.has(colName)) {
                return { errMsg: ErrTStr.DuplicateColNames };
            }
            const error = xcHelper.validateColName(colName, false, true);
            if (error != null) {
                return { errMsg: error };
            }

            return { value: colName };
        },
        stringNoPrefix: function(v: string): ValueCheckResult<string> {
            v = v.trim();
            if (xcHelper.parsePrefixColName(v).prefix.length > 0) {
                return { errMsg: ErrTStr.NoPrefixColumn};
            }
            return { value: v };
        },
        stringColumnNameNoEmpty: function(
            allColSet: Set<string>, v: string
        ): ValueCheckResult<string> {
            const colName = v.trim();
            if (colName.length === 0) {
                return { errMsg: ErrTStr.NoEmpty };
            }
            return this.stringColumnName(allColSet, colName);
        },
        stringColumnNameNoEmptyValue: function(
            allColSet: Set<string>, v: string
        ): ValueCheckResult<string> {
            const colName = v.trim();
            const result: ValueCheckResult<string>
                = this.stringColumnNameNoEmpty(allColSet, v);
            result.value = colName;
            return result;
        },
        stringColumnNameNoEmptyPrefix: function(
            allColSet: Set<string>, v: string
        ): ValueCheckResult<string> {
            const colResult = this.stringColumnNameNoEmpty(allColSet, v);
            if (colResult.errMsg != null) {
                return { errMsg: colResult.errMsg };
            }
            const prefixResult = this.stringNoPrefix(colResult.value);
            if (prefixResult.errMsg != null) {
                return { errMsg: prefixResult.errMsg };
            }
            return { value: prefixResult.value };
        },
        stringColumnNameNoEmptyPrefixValue: function(
            allColSet: Set<string>, v: string
        ): ValueCheckResult<string> {
            const colName = v.trim();
            const result: ValueCheckResult<string>
                = this.stringColumnNameNoEmptyPrefix(allColSet, v);
            result.value = colName;
            return result;
        }
    };

    public constructor(menuBoundSelector: string) {
        this._menuBoundSelector = menuBoundSelector;
    }

    public getTemplateMgr() {
        return this._templateMgr;
    }

    /**
     * Component: Panel header section; templateId = header
     * @param props 
     */
    public createHeader(props: { text: string, onClose: () => void }): HTMLElement[] {
        if (props == null) {
            return null;
        }
        const templateId = 'header';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        return this._templateMgr.createElements(templateId, {
            title: props.text, onClose: props.onClose
        });
    }

    /**
     * Component: Panel opSection; templateId = opSection
     * @param props 
     */
    public createOpSection(props: {
        instrStr: string, args?: AutogenSectionProps[]
    }): HTMLElement[] {
        // Registry of components in opSection
        // AutogenSectionProps.type => function to create corresponding component
        const sectionBuilder: {
            [type: string]: (props: AutogenSectionProps) => HTMLElement[]
        } = {
            'column': this.createHintDropdownSection.bind(this),
            'string': this.createStringInputSection.bind(this),
            'number': this.createNumberInputSection.bind(this),
            'boolean': this.createBooleanInputSection.bind(this),
            'renameList': this.createRenameListSection.bind(this)
        };

        if (props == null || props.instrStr == null) {
            return null;
        }
        const templateId = 'opSection';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        // Build sections
        const argSections: HTMLElement[] = [];
        if (props.args != null) {
            for (const secProp of props.args) {
                const createFunc = sectionBuilder[secProp.type];
                if (createFunc == null) {
                    console.warn(`argType(${secProp.type}) not supported`);
                    continue;
                }
                const elems = createFunc(secProp);
                if (elems != null) {
                    for (const elem of elems) {
                        argSections.push(elem);
                    }
                }
            }
        }

        return this._templateMgr.createElements(templateId, {
            'APP-INSTR': this.createInstruction({ text: props.instrStr }),
            'APP-ARGS': argSections
        });
    }

    /**
     * Component: Panel instruction; templateId = instruction
     * @param props 
     */
    public createInstruction(props: { text: string }): HTMLElement[] {
        if (props == null || props.text == null) {
            return null;
        }
        const templateId = 'instruction';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        return this._templateMgr.createElements(templateId, {
            instrStr: props.text
        });
    }

    /**
     * Component: Hint dropdown(opSection row); templateId = hintDropdown
     * @param props 
     */
    public createHintDropdownSection(props: HintDropdownProps): HTMLElement[] {
        if (props == null) {
            return null;
        }

        // Prepare template
        const templateId = 'hintDropdown';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        // Deconstruct parameters
        const { name, inputVal, placeholder, menuList, onDataChange
            ,addMoreButton, onElementMountDone } = props;

        // Create elements in UL
        const filterMenuList = menuList
            .filter((col) => (col.colName.includes(inputVal)));
        const elemMenuItems = filterMenuList
            .map((menuItem) => this.createColumnMenuItem(menuItem));
        if (filterMenuList.length === 1 && filterMenuList[0].colName === inputVal) {
            elemMenuItems.splice(0, elemMenuItems.length);
        }

        // Create add more button
        const elemAddMoreBtn = this.createAddMoreButton(addMoreButton);

        // Create the dropdown element
        const getColDispName = (str) => {
            if (str.length === 0) {
                return str;
            }
            return str.startsWith(gColPrefix) ? str : `${gColPrefix}${str}`;
        };
        const getColValueName = (str) => {
            return str.startsWith(gColPrefix) ? str.substring(1) : str;
        }
        let delayTimeout;
        const elem = this._templateMgr.createElements(templateId, {
            name: name,
            inputValue: getColDispName(inputVal),
            placeholder: placeholder,
            onInput: (event) => {
                if (delayTimeout != null) {
                    clearTimeout(delayTimeout);
                }

                delayTimeout = setTimeout((keyword: string)=> {
                    // Get the text in input box
                    keyword = getColValueName(keyword);
                    // Create new list of menu items
                    const filterMenuList = menuList.filter((col) => (
                        col.colName.includes(keyword)
                    ));

                    if (filterMenuList.length === 1 && filterMenuList[0].colName === keyword) {
                        // No need to show dropdown, in case the sugggestion is identical to keyword
                        menuHelper.hideDropdowns();
                    } else {
                        const newElemList = filterMenuList.map(
                            (menuItem) => this.createColumnMenuItem(menuItem));
                        // Update the menu UI
                        const $ul = $(elem).find('.selDropdown').find('ul');
                        $ul.empty();
                        $ul.append(newElemList.length === 0
                            ? this.createHintMenuItemEmpty()
                            : newElemList);
                        menuHelper.openList()
                    }
                }, 200, $(event.currentTarget).val().trim());
            },
            onKeydown: (event) => {
                inputSuggest.listHighlight(event);
            },
            'APP-ADDMORE': elemAddMoreBtn,
            'APP-LIST': elemMenuItems
        });
        const dataProcess = (colName, callback) => {
            if (callback != null) {
                callback(getColValueName(colName));
            }
        }

        let inputSuggest: InputSuggest;
        let menuHelper: MenuHelper;
        const initFunc = (element: HTMLElement) => {
            const $dropdown = $(element).find('.selDropdown');
            const $inputBox = $dropdown.find('.selInput');
            inputSuggest = new InputSuggest({$container: $dropdown});
            menuHelper = new MenuHelper($dropdown, {
                bounds: this._menuBoundSelector,
                onSelect: ($li) => {
                    // XXX TODO: Cross component reference, need a better solution
                    if (!$li.hasClass('hintEmpty')) {
                        $inputBox.val(getColDispName($li.text()));
                    }
                },
                onClose: () => {
                    dataProcess($inputBox.val(), onDataChange);
                }
            }).setupListeners();
        }

        // Replace the sub dom tree of this component instead of update only as needed
        // , since we are not able to update event handlers created outside of template
        OpPanelTemplateManager.setElementForceUpdate(elem[0]);
        // Execute the init function after the elements are attached to DOM
        // , because MenuHelper needs to access ancestor elements
        OpPanelTemplateManager.setNodeMountDoneListener(elem, (elem) => {
            initFunc(elem);
            if (onElementMountDone != null) {
                onElementMountDone(elem);
            }
        });

        return elem;
    }

    /**
     * Component: li with no result text; templateId = hintMenuItemEmpty
     */
    public createHintMenuItemEmpty(): HTMLElement {
        const templateId = 'hintMenuItemEmpty';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);
        return this._templateMgr.createElements(templateId)[0];
    }

    /**
     * Component: A single li for column dropdown; templateId = columnMenuItem
     * @param props 
     */
    public createColumnMenuItem(
        props: { colType: ColumnType, colName: string }
    ): HTMLElement {
        if (props == null) {
            return null;
        }

        const templateId = 'columnMenuItem';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        return this._templateMgr.createElements(templateId, {
            'colName': props.colName,
            'colType': props.colType,
            'colTypeClass': `type-${props.colType}`
        })[0];
    }

    /**
     * Component: "add more" button; templateId = addMoreButton
     * @param props 
     */
    public createAddMoreButton(props: AddMoreButtonProps): HTMLElement[] {
        if (props == null) {
            return null;
        }

        const templateId = 'addMoreButton';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        return this._templateMgr.createElements(templateId, props);
    }

    /**
     * Component: Input box with string value(opSection row); templateId = simpleInput
     */
    public createStringInputSection(props: SimpleInputProps<string>): HTMLElement[] {
        if (props == null) {
            return null;
        }

        const templateId = 'simpleInput';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        const { name, inputVal, placeholder,
            valueCheck = { checkType: 'stringDefault', args: [] },
            onChange, onInput, onElementMountDone, inputTimeout = 0, onBlur
        } = props;

        let inputTimeoutHandler;
        const elements = this._templateMgr.createElements(templateId, {
            name: name,
            type: 'string',
            inputValue: inputVal,
            placeholder: placeholder,
            onInput: (event) => {
                if (inputTimeoutHandler != null) {
                    clearTimeout(inputTimeoutHandler);
                }
                inputTimeoutHandler = setTimeout((elemInput) => {
                    this._inputDataProcess(elemInput, valueCheck, onInput);
                }, inputTimeout, event.currentTarget);
            },
            onChange: (event) => {
                this._inputDataProcess(event.currentTarget, valueCheck, onChange);
            },
            onBlur: (event) => {
                this._inputDataProcess(event.currentTarget, valueCheck, onBlur);
            }
        });
        if (onElementMountDone != null) {
            OpPanelTemplateManager.setNodeMountDoneListener(elements, onElementMountDone);
        }

        return elements;
    }

    /**
     * Component: Input box with numeric value(opSection row); templateId = simpleInput
     * @param props 
     */
    public createNumberInputSection(props: SimpleInputProps<number>): HTMLElement[] {
        if (props == null) {
            return null;
        }

        const templateId = 'simpleInput';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        const { name, inputVal, placeholder,
            valueCheck = { checkType: 'integerDefault', args: [] },
            onChange, onInput, onElementMountDone, inputTimeout = 0, onBlur
        } = props;

        let inputTimeoutHandler;
        const elements = this._templateMgr.createElements(templateId, {
            name: name,
            type: 'number',
            inputValue: inputVal != null ? inputVal : '',
            placeholder: placeholder,
            onInput: (event) => {
                if (inputTimeoutHandler != null) {
                    clearTimeout(inputTimeoutHandler);
                }
                inputTimeoutHandler = setTimeout((elemInput) => {
                    this._inputDataProcess(elemInput, valueCheck, onInput);
                }, inputTimeout, event.currentTarget);
            },
            onChange: (event) => {
                this._inputDataProcess(event.currentTarget, valueCheck, onChange);
            },
            onBlur: (event) => {
                this._inputDataProcess(event.currentTarget, valueCheck, onBlur);
            }
        });
        if (onElementMountDone != null) {
            OpPanelTemplateManager.setNodeMountDoneListener(elements, onElementMountDone);
        }

        return elements;
    }

    public createBooleanInputSection(props: CheckboxInputProps): HTMLElement[] {
        if (props == null) {
            return null;
        }

        const templateId = 'checkBoxSection';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        const { name, isChecked, onFlagChange, onElementMountDone } = props;

        let stateSelected = isChecked ? true : false;
        const elements = this._templateMgr.createElements(templateId, {
            name: name,
            cssChecked: stateSelected ? 'checked' : '',
            onClick: () => {
                stateSelected = !stateSelected;
                if (onFlagChange != null) {
                    onFlagChange(stateSelected);
                }
            }
        });
        if (onElementMountDone != null) {
            OpPanelTemplateManager.setNodeMountDoneListener(elements, onElementMountDone);
        }

        return elements;
    }

    public createRenameListSection(props: RenameListProps): HTMLElement[] {
        if (props == null) {
            return null;
        }

        const templateId = 'renameSection';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        const { name, renames, onElementMountDone } = props;

        // Build child component: APP-RENAMES
        const compRenames = renames.reduce((res, renameProps) => {
            return res.concat(this.createRenameRow(renameProps));
        }, []);

        const elements = this._templateMgr.createElements(templateId, {
            name: name,
            'APP-RENAMES': compRenames
        });
        if (onElementMountDone != null) {
            OpPanelTemplateManager.setNodeMountDoneListener(elements, onElementMountDone);
        }

        return elements;
    }

    public createRenameRow(props: RenameProps): HTMLElement[] {
        if (props == null) {
            return null;
        }

        const templateId = 'renameRow';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        const { colFrom, colTo, onNameToChange, disableChange = false,
            valueCheck = { checkType: 'stringDefault', args: [] },
            onElementMountDone } = props;

        const elements = this._templateMgr.createElements(templateId, {
            'APP-COLFROM': this.createColumnNameType(colFrom),
            nameTo: colTo, disableChange: disableChange,
            cssNoEdit: disableChange ? 'noEdit' : '',
            onNameToChange: (event) => {
                this._inputDataProcess(event.currentTarget, valueCheck, onNameToChange);
            }
        });
        if (onElementMountDone != null) {
            OpPanelTemplateManager.setNodeMountDoneListener(elements, onElementMountDone);
        }

        return elements;
    }

    public createColumnNameType(props: ColumnNameTypeProps): HTMLElement[] {
        if (props == null) {
            return null;
        }

        const templateId = 'columnNameType';
        this._templateMgr.loadTemplateFromString(templateId, this._templates[templateId]);

        const { colType, colName, onElementMountDone } = props;

        const elements = this._templateMgr.createElements(templateId, {
            cssType: `type-${colType}`, colType: colType, colName: colName
        });
        if (onElementMountDone != null) {
            OpPanelTemplateManager.setNodeMountDoneListener(elements, onElementMountDone);
        }

        return elements;
    }

    /**
     * Call the predefined check function(defined in this.checkFunctions)
     * @param param checkType: the name of the check function; args: arguments(function to generate arguments) of check function
     * @param inputVal 
     */
    private _checkValue(
        param: { checkType: string, args: any[] | Function },
        inputVal: string
    ): ValueCheckResult<any> {
        const checkFunc = this.checkFunctions[param.checkType];
        if (checkFunc == null) {
            // This is a bug, should never happen
            const errMsg = `CheckType ${param.checkType} not found`
            console.error(errMsg);
            return { errMsg: errMsg };
        }
        let checkArgs = param.args || [];
        if (typeof checkArgs === 'function') {
            checkArgs = <any[]>checkArgs(inputVal);
        }

        if (!Array.isArray(checkArgs)) {
            // This is a bug, should never happen
            console.error('CheckValue: args/args() is not an array');
            return { errMsg: 'Invalid check arguments' };
        }

        return checkFunc.apply(this.checkFunctions, checkArgs.concat([inputVal]));
    }

    private _inputDataProcess<T>(elemInput, valueCheck, callback) {
        if (callback != null) {
            const inputVal = $(elemInput).val().trim();

            const checkResult:ValueCheckResult<T> = this._checkValue(
                valueCheck, inputVal
            );
            if (checkResult.errMsg != null) {
                StatusBox.show(checkResult.errMsg, $(elemInput));
            }
            if (checkResult.value != null) {
                callback(checkResult.value);
            }
        }
    }
}