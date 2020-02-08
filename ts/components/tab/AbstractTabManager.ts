abstract class AbstractTabManager {
    private _container: string;
    private _key: string;
    private _hasSetup: boolean;
    protected _tabListScroller: ListScroller;

    constructor(container: string, key: string) {
        this._container = container;
        this._key = key;
        this._hasSetup = false;
    }

    public setup(): XDPromise<void> {
        if (this._hasSetup) {
            return PromiseHelper.resolve();
        }
        this._hasSetup = true;
        const $tabArea: JQuery = this._getTabArea();
        this._tabListScroller = new ListScroller(this._getTabsSection(),
        $tabArea, false, {
            bounds: `#${this._container}`,
            noPositionReset: true
        });
        this._addEventListeners();
        return this._restoreTabs();
    }

    public abstract getNumTabs(): number;
    protected abstract _restoreTabs(): XDPromise<void>;
    protected abstract _deleteTabAction(index: number, name: string): void;
    protected abstract _renameTabAction($input: JQuery): string;
    protected abstract _startReorderTabAction(): void;
    protected abstract _stopReorderTabAction(previousIndex: number, newIndex: number): void;
    protected abstract _getJSON(): any;

    protected _getContainer(): JQuery {
        return $(`#${this._container}`);
    }

    protected _getTabsSection(): JQuery {
        return this._getContainer().find(".tabsSection");
    }

    protected _getTabArea(): JQuery {
        return this._getTabsSection().find("ul");
    }

    protected _getTabsEle(): JQuery {
        return this._getTabArea().find(".tab");
    }

    protected _getTabElByIndex(index: number): JQuery {
        return this._getTabsEle().eq(index);
    }

    protected _switchTabs(index?: number): number {
        if (index == null) {
            index = this.getNumTabs() - 1;
        }
        const $tabs: JQuery = this._getTabsEle();
        const $tab: JQuery = $tabs.eq(index);
        $tabs.removeClass("active");
        $tab.addClass("active");
        $tab.scrollintoview({duration: 0});
        return index;
    }

    protected _addEventListeners(): void {
        const $tabArea: JQuery = this._getTabArea();
        $tabArea.on("click", ".after", (event) => {
            event.stopPropagation();
            const $tab: JQuery = $(event.currentTarget).parent();
            const index: number = $tab.index();
            this._deleteTabAction(index, name);
            this._tabListScroller.showOrHideScrollers();
        });

        $tabArea.on("click", ".tab", (event) => {
            const $tab: JQuery = $(event.currentTarget);
            // dragging when sorting will trigger an unwanted click
            if (!$tab.hasClass("ui-sortable-helper")) {
                this._switchTabs($tab.index());
            }
        });

        $tabArea.on("dblclick", ".dragArea", (event) => {
            let $dragArea: JQuery = $(event.currentTarget);
            let $tabName: JQuery = $dragArea.siblings(".name");
            if ($tabName.hasClass('nonedit')) {
                return;
            }
            let editingName = $tabName.text();
            $tabName.text("");
            let inputArea: string =
                "<span contentEditable='true' class='xc-input'></span>";
            $(inputArea).appendTo($tabName);
            let $input: JQuery = $tabName.find('.xc-input');
            $input.text(editingName);
            $input.focus();
            document.execCommand('selectAll', false, null);
        });

        $tabArea.on("keypress", ".name .xc-input", (event) => {
            if (event.which === keyCode.Enter) {
                $(event.currentTarget).blur();
            }
        });

        $tabArea.on("focusout", ".name .xc-input", (event) => {
            const $input: JQuery = $(event.currentTarget);
            const newName = this._renameTabAction($input);

            if (newName) {
                const $tabName: JQuery = $input.parent();
                $tabName.text(newName);
            }
            $input.remove();
            this._tabListScroller.showOrHideScrollers();
        });

        $tabArea.mouseenter(() => {
            this._tabListScroller.showOrHideScrollers();
        });

        let initialIndex;
        $tabArea.sortable({
            revert: 300,
            axis: "x",
            handle: ".dragArea",
            distance: 5,
            forcePlaceholderSize: true,
            placeholder: "sortablePlaceholder",
            start: (_event, ui) => {
                // add html to the placeholder so it maintains the same width
                const html = $(ui.item).html();
                $tabArea.find(".sortablePlaceholder").html(html);
                initialIndex = $(ui.item).index();
                xcTooltip.hideAll();
                this._startReorderTabAction();
            },
            stop: (_event, ui) => {
                const newIndex = $(ui.item).index();
                this._stopReorderTabAction(initialIndex, newIndex);
            }
        });
    }

    protected _getKVStore(): KVStore {
        const key: string = KVStore.getKey(this._key);
        return new KVStore(key, gKVScope.WKBK);
    }

    protected _save(): XDPromise<void> {
        let jsonStr: string = JSON.stringify(this._getJSON());
        return this._getKVStore().put(jsonStr, true, true);
    }
}