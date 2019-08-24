interface MessageModalOptions extends Alert.AlertOptions {
    isInfo?: boolean;
}

class MessageModal {
    private static _instance: MessageModal;
    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private _modalHelper: ModalHelper;
    private _defaultWidth: number = 636;
    private _defaultHeight: number = 223;
    private _heightNoCheckbox: number = 193;

    private constructor() {
        this._modalHelper = new ModalHelper(this._getModal(), {
            "noResize": true,
            "sizeToDefault": true
        });
        this._addEventListeners();
    }

    /**
     * MessageModal.Instance.show
     */
    public show(options: MessageModalOptions): void {
        this._setTitle(options.title, options.isInfo);
        this._setMessage(options.msg);
        this._setCheckBox(options.isCheckBox);
        this._setButtons(options);
        this._setStyling(options);
        this._modalHelper.setup({sizeCallBack: this._sizeModal.bind(this, options)});
    }

    private _getModal(): JQuery {
        return $("#messageModal");
    }

    private _getCheckboxSection(): JQuery {
        return this._getModal().find(".checkboxSection");
    }

    private _close(callback: Function): void {
        let $checkbox = this._getCheckboxSection().find(".checkbox");
        let hasChecked: boolean = $checkbox.hasClass("checked")

        this._modalHelper.clear();
        this._setTitle("", false);
        $checkbox.removeClass("checked");
        this._getModal().off(".messageModal");

        if (callback instanceof Function) {
            callback(hasChecked);
        }
    }

    private _setTitle(title: string, isInfo: boolean): void {
        let $title = this._getModal().find(".title");
        $title.find(".text").text(title);
        if (isInfo) {
            $title.find(".icon")
                .addClass("xi-info-circle")
                .removeClass("xi-warning");
        } else {
            $title.find(".icon")
                .removeClass("xi-info-circle")
                .addClass("xi-warning");
        }
    }

    private _setMessage(message: string): void {
        this._getModal().find(".message").html(message);
    }

    private _setCheckBox(isCheckBox: boolean): void {
        let $modal = this._getModal();
        if (isCheckBox) {
            $modal.removeClass("noCheckbox");
        } else {
            $modal.addClass("noCheckbox");
        }
    }

    private _setButtons(options: Alert.AlertOptions): void {
        let $modal = this._getModal();
        let $confirmBtn = $modal.find(".confirm");

        if (options.isAlert) {
            $modal.find(".cancel").text(AlertTStr.Close);
            $confirmBtn.hide();
        } else {
            $modal.find(".cancel").text(AlertTStr.Cancel);
            $confirmBtn.show();
        }

        $modal.on("click.messageModal", ".close, .cancel", (e) => {
            e.stopPropagation();
            this._close(options.onCancel);
        });

        // set confirm button
        $modal.on("click.messageModal", ".confirm", (e) => {
            e.stopPropagation();
            this._close(options.onConfirm);
        });
    }

    private _addEventListeners(): void {
        let $modal = this._getModal();
        $modal.on("click", ".checkboxSection", (e) => {
            e.stopPropagation();
            $(e.currentTarget).find(".checkbox").toggleClass("checked");
        });
    }

    private _setStyling(options: Alert.AlertOptions): void {
        const $modal: JQuery = this._getModal();
        if (options.compact) {
            $modal.addClass("compact");
        } else {
            $modal.removeClass("compact");
        }
    }

    private _sizeModal(options: Alert.AlertOptions): void {
        const $modal: JQuery = this._getModal();
        let height: number;
        if (options.isCheckBox) {
            height = this._defaultHeight;
        } else {
            height = this._heightNoCheckbox;
        }
        $modal.height(height);
        $modal.show(); // show to get height/width

        if (options.size) {
            switch (options.size) {
                case ("medium"):
                    $modal.width(500);
                    break;
                default:
                    break;
            }
        } else {
            $modal.width(this._defaultWidth);
        }

        if (options.sizeToText) {
            let headerHeight = $modal.find(".header").outerHeight();
            let contentHeight = $modal.find(".content").outerHeight();
            $modal.height(contentHeight + headerHeight);
        }
        $modal.hide(); // hide after we get width/height
    }
}