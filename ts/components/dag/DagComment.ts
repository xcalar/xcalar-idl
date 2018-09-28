class DagComment {
    private static _instance: DagComment;

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private constructor() {

    }

    public setup() {
        const self = this;
        const $dfWrap: JQuery = $("#dagView .dataflowWrap");
        $dfWrap.on("click", ".comment", function() {
            if (!$(this).hasClass("focused")) {
                $(this).appendTo($dfWrap.find(".dataflowArea.active .commentArea"));
            }
        });
        $dfWrap.on("dblclick", ".comment", function() {
            const $comment = $(this);
            $comment.addClass("focused");
            $comment.find("textarea").prop("readonly", false).focus();
            const scale = DagView.getActiveDag().getScale();
            $comment.css("transform", "scale(" + (1 / scale) + ")");
        });
        $dfWrap.on("blur", ".comment textarea", function() {
            const $comment = $(this);
            $comment.closest(".comment").removeClass("focused")
                                        .css("transform", "scale(1)");
            $comment.prop("readonly", true);
        });
        $dfWrap.on("change", ".comment textarea", function() {
            const id = $(this).closest(".comment").data("nodeid");
            const text = $(this).val();
            self.updateText(id, text);
        });
    }

    public drawComment(
        commentNode: CommentNode,
        $dfArea: JQuery,
        isSelect?: boolean,
        isFocus?: boolean
    ): void {
        const self = this;
        const pos = commentNode.getPosition();
        const id = commentNode.getId();
        const dim = commentNode.getDimensions();
        let text = commentNode.getText();
        let placeholder = "";
        if (!text) {
            placeholder = "Double-click to edit";
        }
        let $comment = $('<div class="comment" data-nodeid="' + id +
                        '" style="left:' + pos.x + 'px;top:' + pos.y + 'px;' +
                        'width:' + dim.width + 'px;height:' + dim.height +
                        'px;">' +
                            '<textarea spellcheck="false" readonly ' +
                                'placeholder="' + placeholder + '" >' + text +
                            '</textarea>' +
                        '</div>');
        $dfArea.find(".commentArea").append($comment);
        if (isSelect) {
            $comment.addClass("selected");
        }
        if (isFocus) {
            $comment.addClass("focused");
            $comment.find("textarea").prop("readonly", false).focus();
            const scale = DagView.getActiveDag().getScale();
            $comment.css("transform", "scale(" + (1 / scale) + ")");
        }
        $comment.resizable({
            "minWidth": DagView.gridSpacing,
            "minHeight": DagView.gridSpacing,
            "grid": DagView.gridSpacing,
            "stop": function(_event, ui) {
               self._updateDimensions(id, ui.size);
            }
        });
    }

    public removeComment(id) {
        $("#dagView").find('.comment[data-nodeid="' + id + '"]').remove();
    }

    private _updateDimensions(
        id: CommentNodeId,
        size: Dimensions
    ): XDPromise<void> {
        const comment = DagView.getActiveDag().getComment(id);
        comment.setDimensions(size);
        return DagView.getActiveTab().saveTab();
    }

    /**
     *
     * @param id
     * @param text
     */
    public updateText(id: CommentNodeId, text: string): XDPromise<void> {
        $("#dagView").find('.comment[data-nodeid="' + id + '"]')
                     .find("textarea").val(text);
        const comment: CommentNode = DagView.getActiveDag().getComment(id);
        const oldText = comment.getText();
        comment.setText(text);
        Log.add(SQLTStr.EditComment, {
            "operation": SQLOps.EditComment,
            "dataflowId": DagView.getActiveTab().getId(),
            "commentId": id,
            "newComment": text,
            "oldComment": oldText
        });
        return DagView.getActiveTab().saveTab();
    }
}