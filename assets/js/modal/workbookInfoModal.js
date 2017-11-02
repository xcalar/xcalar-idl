window.WorkbookInfoModal = (function(WorkbookInfoModal, $) {
    var $modal; // $("#workbookInfoModal")
    var modalHelper;
    var activeWorkbookId;

    WorkbookInfoModal.setup = function() {
        $modal = $("#workbookInfoModal");

        modalHelper = new ModalHelper($modal, {
            sizeToDefault: true,
            center: {verticalQuartile: true}
        });

        addEvents();
    };

    WorkbookInfoModal.show = function(workbookId) {
        activeWorkbookId = workbookId;
        modalHelper.setup();
        showWorkbookInfo(workbookId);
    };

    function addEvents() {
        $modal.on("click", ".close, .cancel", function() {
            closeModal();
        });

        $modal.on("click", ".confirm", function() {
            submitForm();
        });

        $modal.on("input", ".name input", function() {
            if ($(this).val() === "") {
                showNameError();
            } else {
                hideNameError();
            }
        });
    }

    function closeModal() {
        modalHelper.clear();
        activeWorkbookId = null;
        hideNameError();
    }

    function showNameError() {
        $modal.find(".error").text(WKBKTStr.WkbkNameRequired);
        $modal.find(".confirm").addClass("xc-disabled");
    }

    function hideNameError() {
        $modal.find(".error").text("");
        $modal.find(".confirm").removeClass("xc-disabled");
    }

    function showWorkbookInfo(workbookId) {
        var workbook = WorkbookManager.getWorkbook(workbookId);
        $modal.find(".name input").val(workbook.getName()).select();
        $modal.find(".description input").val(workbook.getDescription() || "");
    }

    function submitForm() {
        var name = $modal.find(".name input").val();
        var description = $modal.find(".description input").val();
        var workbookId = activeWorkbookId;
        WorkbookPanel.edit(workbookId, name, description);
        closeModal();
    }

    return WorkbookInfoModal;
}({}, jQuery));