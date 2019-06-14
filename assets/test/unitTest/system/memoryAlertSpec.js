describe('Memory Alert Test', () => {
    let $memoryAlert;

    before(() => {
        $memoryAlert = $("#memoryAlert");
    });

    describe('detectUsage Test', () => {
        let fakeTopOutput;
        let oldRefresh;

        function setMemUsage(used, total) {
            let node = fakeTopOutput.topOutputPerNode[0];
            node.xdbUsedBytes = used;
            node.xdbTotalBytes = total;
        }

        before(() => {
            fakeTopOutput = {
                numNodes: 1,
                topOutputPerNode: [{
                    xdbUsedBytes: 0,
                    xdbTotalBytes: 1
                }]
            };

            oldRefresh = TblManager.refreshOrphanList;

            TblManager.refreshOrphanList = () => PromiseHelper.resolve();
            UnitTest.onMinMode();
        });

        afterEach(() => {
            $memoryAlert.removeClass('red')
                .removeClass('yellow')
                .removeClass("tableAlert");
        });

        it('should red alert memory', (done) => {
            setMemUsage(1, 1);
            MemoryAlert.Instance.detectUsage(fakeTopOutput)
                .then(() => {
                    expect($memoryAlert.hasClass('red')).to.be.true;
                    expect($memoryAlert.hasClass('yellow')).to.be.false;
                    UnitTest.hasAlertWithTitle(MonitorTStr.LowMem);
                    done();
                })
                .fail(() => {
                    done('fail');
                });
        });

        it('should not show alert if Alert is on', (done) => {
            setMemUsage(1, 1);
            let oldFunc = Alert.isOpen;
            Alert.isOpen = () => true;

            MemoryAlert.Instance.detectUsage(fakeTopOutput)
                .then(() => {
                    expect($memoryAlert.hasClass('red')).to.be.true;
                    assert.isFalse($("#alertMOdal").is(":visible"));
                    done();
                })
                .fail(() => {
                    done('fail');
                })
                .always(() => {
                    Alert.isOpen = oldFunc;
                });
        });

        it('should not show alert if Alert is turned off', (done) => {
            setMemUsage(1, 1);
            let oldFlag = MemoryAlert.Instance._turnOffRedMemoryAlert;
            MemoryAlert.Instance._turnOffRedMemoryAlert = true;

            MemoryAlert.Instance.detectUsage(fakeTopOutput)
                .then(() => {
                    expect($memoryAlert.hasClass('red')).to.be.true;
                    assert.isFalse($("#alertMOdal").is(":visible"));
                    done();
                })
                .fail(() => {
                    done('fail');
                })
                .always(() => {
                    MemoryAlert.Instance._turnOffRedMemoryAlert = oldFlag;
                });
        });

        it('should yellow alert memory', (done) => {
            setMemUsage(0.7, 1);
            MemoryAlert.Instance.detectUsage(fakeTopOutput)
                .then(() => {
                    expect($memoryAlert.hasClass('red')).to.be.false;
                    expect($memoryAlert.hasClass('yellow')).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
        });

        it('should have no table alert', (done) => {
            const oldFunc = MemoryAlert.Instance.hasNoTables;
            MemoryAlert.Instance.hasNoTables = () => true;

            setMemUsage(0.7, 1);
            MemoryAlert.Instance.detectUsage(fakeTopOutput)
                .then(() => {
                    expect($memoryAlert.hasClass('tableAlert')).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                })
                .always(() => {
                    MemoryAlert.Instance.hasNoTables = oldFunc;
                });
        });

        it('should have table alert', (done) => {
            const oldFunc = MemoryAlert.Instance.hasNoTables;
            MemoryAlert.Instance.hasNoTables = () => false;

            setMemUsage(0.7, 1);
            MemoryAlert.Instance.detectUsage(fakeTopOutput)
                .then(() => {
                    expect($memoryAlert.hasClass('tableAlert')).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                })
                .always(() => {
                    MemoryAlert.Instance.hasNoTables = oldFunc;
                });
        });

        it('should not alert in normal case', (done) => {
            setMemUsage("test", 1);
            MemoryAlert.Instance.detectUsage(fakeTopOutput)
                .then(() => {
                    expect($memoryAlert.hasClass('red')).to.be.false;
                    expect($memoryAlert.hasClass('yellow')).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
        });

        after(() => {
            TblManager.refreshOrphanList = oldRefresh;
            UnitTest.offMinMode();
        });
    });

    describe('refreshTables func Test', () => {
        it('refreshTables should resolve if no acitve workbook', (done) => {
            const oldFunc = WorkbookManager.getActiveWKBK;
            let test = false;
            WorkbookManager.getActiveWKBK = () => {
                test = true;
                return null;
            };

            MemoryAlert.Instance.refreshTables()
                .then(() => {
                    expect(test).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                })
                .always(() => {
                    WorkbookManager.getActiveWKBK = oldFunc;
                });
        });

        it('refreshTables should resolve if no tables', (done) => {
            const oldFunc = TblManager.refreshOrphanList;
            const oldHasNoTables = MemoryAlert.Instance.hasNoTables;

            let test = false;
            TblManager.refreshOrphanList = () => {
                test = true;
                return PromiseHelper.resolve();
            };
            MemoryAlert.Instance.hasNoTables = () => true;

            MemoryAlert.Instance.refreshTables()
                .then(() => {
                    expect(test).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                })
                .always(() => {
                    TblManager.refreshOrphanList = oldFunc;
                    MemoryAlert.Instance.hasNoTables = oldHasNoTables;
                });
        });

        it('refreshTables should resolve in normal case', (done) => {
            const oldGOrphanTables = gOrphanTables;
            const oldFunc = TblManager.refreshOrphanList;

            let test = false;
            TblManager.refreshOrphanList = () => {
                test = true;
                return PromiseHelper.resolve();
            };
            gOrphanTables = ['a'];

            MemoryAlert.Instance.refreshTables()
                .then((arg) => {
                    expect(arg).to.be.undefined;
                    expect(test).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                })
                .always(() => {
                    gOrphanTables = oldGOrphanTables;
                    TblManager.refreshOrphanList = oldFunc;
                });
        });
    });

    describe('MemoryAlert.check Test', () => {
        let oldRefreshTables;
        let oldApiTop;
        let test = false;

        before(() => {
            oldRefreshTables = MemoryAlert.Instance.refreshTables;
            oldApiTop = XcalarApiTop;

            MemoryAlert.Instance.refreshTables = () => {
                test = true;
                return PromiseHelper.resolve();
            }
            XcalarApiTop = () => PromiseHelper.resolve({
                numNodes: 1,
                topOutputPerNode: [{
                    xdbUsedBytes: 0,
                    xdbTotalBytes: 1
                }]
            });
        });

        beforeEach(() => {
            test = false;
        });

        it('should resolve if is still check', (done) => {
            MemoryAlert.Instance._isCheckingMem = true;

            MemoryAlert.Instance.check()
                .then(() => {
                    expect(test).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                })
                .always(() => {
                    MemoryAlert.Instance._isCheckingMem = false;
                });
        });

        it('should resolve if no warn', (done) => {
            $memoryAlert.removeClass('red').removeClass('yellow')

            MemoryAlert.Instance.check(true)
                .then(() => {
                    expect(test).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
        });

        it('should resolve in normal case', (done) => {
            MemoryAlert.Instance.check()
                .then(() => {
                    expect(test).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
        });

        it('should reject in error case', (done) => {
            XcalarApiTop = () => PromiseHelper.reject('test');

            MemoryAlert.Instance.check()
                .then(() => {
                    done('fail');
                })
                .fail((error) => {
                    expect(error).to.equal('test');
                    done();
                });
        });

        after(() => {
            XcalarApiTop = oldApiTop;
            MemoryAlert.Instance.refreshTables = oldRefreshTables;
        });
    });

    describe('UI Behavior Test', () => {
        it("should trigger meomryAlert with table", () => {
            const oldFunc = DeleteTableModal.Instance.show;
            let test = false;
            DeleteTableModal.Instance.show = () => { test = true; };
            $memoryAlert.addClass("yellow")
                .addClass("tableAlert")
                .click();
            expect(test).to.be.true;
            DeleteTableModal.Instance.show = oldFunc;
        });

        it("should trigger meomryAlert with ds", () => {
            $memoryAlert.addClass("yellow")
                .removeClass("tableAlert")
                .click();
            expect($("#mainMenu").hasClass("open")).to.be.true;
            expect($("#datastoreMenu").hasClass("active")).to.be.true;
            // close menu
            $("#datastoreMenu .minimizeBtn").click();
            $memoryAlert.removeClass("yellow");
        });

        it("should go to workbook monitor in meomryAlert", () => {
            const oldFunc = WorkbookPanel.goToMonitor;
            let test = false;
            $("#container").addClass("switchingWkbk");
            WorkbookPanel.goToMonitor = () => { test = true; };

            $("#memoryAlert").click();
            expect(test).to.be.true;

            // clear up
            WorkbookPanel.goToMonitor = oldFunc;
            $("#container").removeClass("switchingWkbk");
        });

        it("should open meau in nromal meomryAlert", () => {
            const oldFunc = MainMenu.openPanel;
            let mainMenu, subMenu;

            MainMenu.openPanel = (arg1, arg2) => {
                mainMenu = arg1;
                subMenu = arg2;
            };

            $memoryAlert.removeClass("yellow red").click();
            expect(mainMenu).to.equal("monitorPanel");
            expect(subMenu).to.equal("systemButton");

            // clear up
            MainMenu.openPanel = oldFunc;
        });
    });
});