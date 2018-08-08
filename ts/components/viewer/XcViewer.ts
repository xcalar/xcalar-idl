abstract class XcViewer {
    private id: string;
    protected $view: JQuery;

    constructor(id: string) {
        this.id = id;
        this.$view = $('<div class="viewWrap xc-contentView"></div>');
    }

    /**
     * render to viewer
     */
    public render($container: JQuery): XDPromise<void> {
        $container.append(this.$view);
        return PromiseHelper.resolve();
    }

    /**
     * @returns {id} return the id of the viewer
     */
    public getId(): string {
        return this.id;
    }

    /**
     * clear the view
     */
    public clear(): void {
        this.$view.remove();
    }

    protected getView(): JQuery {
        return this.$view;
    }
}