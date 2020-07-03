describe("AboutModal Test", function() {
    let $modal;

    before(function() {
        UnitTest.onMinMode();
        $("#modalBackground").hide();
        $modal = $("#aboutModal");
    });

    it("Should open the about modal", function() {
        AboutModal.Instance.show();
        assert.isTrue($modal.is(":visible"));
        assert.isFalse($("#modalBackground").is(":visible"));

        expect($modal.find(".product").text()).not.to.equal("");
        expect($modal.find(".frontVersion").text()).not.to.equal("");
        expect($modal.find(".buildNumber").text()).not.to.equal("");
    });

    it("should not show license section in cloud deployment", function() {
        var oldIsDataMart = XVM.isDataMart;
        XVM.isDataMart = () => true;
        AboutModal.Instance.show();
        expect($modal.find(".expiration").text()).to.equal("");
        XVM.isDataMart = oldIsDataMart
    });

    it("Should clean the modal", function() {
        var $modal = $("#aboutModal");
        $modal.find(".close").click();
        assert.isFalse($modal.is(":visible"));
    });

    after(function() {
        UnitTest.offMinMode();
    });
});