describe("Help Panel Test", function() {
    var helpPanel;
    var oldWindowOpen;


    before(() => {
        console.log("Help Panel Test");
        helpPanel = HelpPanel.Instance;
        helpPanel.setup();

        oldWindowOpen = window.open;
        window.open = function(url) {
            return;
        }
    });

    it("Should be able to display the tutorial walkthrough screen", function(done) {
        helpPanel.openHelpResource("tutorialResource");
        setTimeout(function() {
            expect($("#help-tutorial").hasClass("active")).to.be.true;
            expect($("#helpTab").hasClass("active")).to.be.true;
            done();
        }, 500);
    });

    it("Should be able to display the tooltip modal", function(done) {
        helpPanel.openHelpResource("tooltipResource");
        setTimeout(function() {
            expect($("#tooltipModal").is(":visible")).to.be.true;
            $("#tooltipModal .close").click();
            done();
        }, 500);
    });

    it("Should be able to display the documents screen", function(done) {
        helpPanel.openHelpResource("docsResource");
        setTimeout(function() {
            expect($("#help-documentation").hasClass("active")).to.be.true;
            expect($("#helpTab").hasClass("active")).to.be.true;
            done();
        }, 500);
    });

    it("Should be able to open Discourse", function() {
        var openedDiscourse = false;
        window.open = (url) => {
            openedDiscourse = true;
        }
        helpPanel.openHelpResource("discourseResource");
        expect(openedDiscourse).to.be.true;
    });

    it("Should be able to open the support ticket modal", function(done) {
        helpPanel.openHelpResource("ticketResource");
        setTimeout(function() {
            expect($("#supTicketModal").is(":visible")).to.be.true;
            expect($("#helpTab").hasClass("active")).to.be.true;
            $("#supTicketModal .close").click();
            done();
        }, 500);
    });

    it("Should be able to open the live chat modal", function(done) {
        helpPanel.openHelpResource("chatResource");
        setTimeout(function() {
            expect($("#liveHelpModal").is(":visible")).to.be.true;
            expect($("#helpTab").hasClass("active")).to.be.true;
            $("#liveHelpModal .close").click();
            done();
        }, 500);
    });

    after((done) => {
        window.open = oldWindowOpen;
        // Leave the help screen if still in it.
        $("#monitorTab").click();
        done();
    });
});