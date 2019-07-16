const EventEmitter = require('events');

EventEmitter.defaultMaxListeners = 1000;

class OpenOpPanel extends EventEmitter {
    command(selector) {

        this.api
            .moveToElement(".dataflowArea.active " + selector, 30, 15)
            .mouseButtonClick('right')
            .waitForElementVisible("#dagNodeMenu", 1000)
            .moveToElement("#dagNodeMenu li.configureNode", 10, 1)
            .mouseButtonClick('left')
            .waitForElementNotPresent("#formWaitingBG")
            .element('css selector', ".opPanel:not(.xc-hidden) .advancedEditor", (result) => {
                if (result.status !== -1) {
                    // it exists
                    this.api.isVisible(".opPanel:not(.xc-hidden) .advancedEditor", results => {
                        if (results.value) {
                            this.api.click(".opPanel:not(.xc-hidden) .xc-switch:not(.andOrSwitch)");
                        }
                        this.emit('complete');
                    });
                } else {
                    // does not exist
                    this.emit('complete');
                }
            });

        return this;
    }
}

module.exports = OpenOpPanel;