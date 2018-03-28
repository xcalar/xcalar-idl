// setup should happen before load test files
// --badil: will stop when first test fails
mocha.setup({
    "ui": "bdd",
    "bail": true,
    // must include Setup Test and optionally include other test
    // e.g. /Mocha Setup Test|Workbook Test/
    // default:
    // "grep": /Mocha Setup Test|.*/
    "grep": getTestNameRegex()
});
// global
expect = chai.expect;
assert = chai.assert;

function getTestNameRegex() {
    var urlArgs = xcHelper.decodeFromUrl(window.location.href);
    var test = urlArgs.test || "xcSocket Test.*";
    var testNameRegex = new RegExp("Mocha Setup Test|" + test);
    return testNameRegex;
}

var testDatasets;

window.UnitTest = (function(UnitTest, $) {
    var minModeCache;
    var test;
    var resultsSent = false;

    function sendResultsToParent() {
        resultsSent = true;
        var urlArgs = xcHelper.decodeFromUrl(window.location.href);
        var request = {
            testId: urlArgs.testId,
            testName: urlArgs.test,
            pass: parseInt($("#mocha-stats").find(".passes em").text()),
            fail: parseInt($("#mocha-stats").find(".failures em").text()),
            time: parseInt($("#mocha-stats").find(".duration em").text())
        };
        parent.postMessage(JSON.stringify(request), "*");
    }

    UnitTest.setup = function() {
        $(document).ready(function() {
            xcGlobal.setup();
            setupTestDatasets();
            mocha.run(function(a, b) {
                if (parent.location.href.indexOf("unitTestManager.html") < 0) {
                    // used for puppeteer
                    $("body").append('<div id="testFinish">Test Fnish</div>');
                    alert("Test Exited");
                }
                if (!resultsSent) {
                    sendResultsToParent();
                }
            });
            window.onbeforeunload = function() {
                return;
            };
            test = TestSuite.createTest();
        });

        $("#toggleXC").click(function() {
            $("#xc").toggle();
        });

        $("#toggleTest").click(function() {
            $("#unitTestBody").toggleClass("hideTest");
        });

        $("#toggleCoverage").click(function() {
            $("#unitTestBody").toggleClass("hideCoverage");
        });

        $('#backXC').click(function() {
            var promise = TblManager.freeAllResultSetsSync();
            PromiseHelper.alwaysResolve(promise)
            .then(XcSupport.releaseSession)
            .then(function() {
                xcManager.removeUnloadPrompt();
                window.location = paths.indexAbsolute;
            })
            .fail(function(error) {
                console.error(error);
            });
        });

        $('#toggleTestSize').click(function() {
            $('#mocha').toggleClass('small');
        });

        $('#toggleXCSize').click(function() {
            $('#xc').toggleClass('large');
        });

        var prevPct = null;
        window.mochaPct = 0;
        consolePct();

        function consolePct() {
            setTimeout(function() {
                if (!ifvisible.now()) {
                    if (prevPct === window.mochaPct) {
                        console.info("Test is still " + window.mochaPct + "% completed");
                    } else {
                        console.info(window.mochaPct + "% completed");
                    }
                }
                prevPct = window.mochaPct;
                if (window.mochaPct === 100) {
                    if (!resultsSent) {
                        sendResultsToParent();
                    }
                    console.info("TEST FINISHED");
                    if (String(mocha.options.grep) === "/Mocha Setup Test|.*/") {
                        UnitTest.getCoverage();
                    }
                } else {
                    consolePct();
                }
            }, 10000);
        }

        // Uncomment this to add button to increase blanket size.

        // $('#toggleCoverageSize').click(function() {
        //     $('#blanket-main').toggleClass('large');
        // });
    };

    function setupTestDatasets() {
        testDatasets = {
            "sp500": {
                "targetName": gDefaultSharedRoot,
                "path": "/netstore/datasets/sp500.csv",
                "url": "netstore/datasets/sp500.csv",
                "sources": [{
                    "targetName": gDefaultSharedRoot,
                    "path": "/netstore/datasets/sp500.csv"
                }],
                "format": "CSV",
                "fieldDelim": "\t",
                "lineDelim": "\n",
                "hasHeader": false,
                "moduleName": "",
                "funcName": "",
                "pointCheck": ".datasetTbodyWrap:not(.hidden) #previewTable td:contains(20041101)"
            },

            "schedule": {
                "targetName": gDefaultSharedRoot,
                "path": "/netstore/datasets/indexJoin/schedule/",
                "url": "netstore/datasets/indexJoin/schedule/",
                "sources": [{
                    "targetName": gDefaultSharedRoot,
                    "path": "/netstore/datasets/indexJoin/schedule/"
                }],
                "format": "JSON",
                "moduleName": "",
                "funcName": "",
                "pointCheck": ".datasetTbodyWrap:not(.hidden) #previewTable td:contains(1)"
            },

            "fakeYelp": {
                "targetName": gDefaultSharedRoot,
                "path": "/netstore/datasets/unittest/test_yelp.json",
                "url": "netstore/datasets/unittest/test_yelp.json",
                "sources": [{
                    "targetName": gDefaultSharedRoot,
                    "path": "/netstore/datasets/unittest/test_yelp.json"
                }],
                "format": "JSON",
                "moduleName": "",
                "funcName": "",
                "pointCheck": ".datasetTbodyWrap:not(.hidden) #previewTable th:eq(1):contains(yelping_since)"
            }
        }
    }

    UnitTest.testFinish = function(checkFunc, interval) {
        var deferred = PromiseHelper.deferred();
        var checkTime = interval || 200;
        var outCnt = 80;
        var timeCnt = 0;

        var timer = setInterval(function() {
            var res = checkFunc();
            if (res === true) {
                // make sure graphisc shows up
                clearInterval(timer);
                deferred.resolve();
            } else if (res === null) {
                clearInterval(timer);
                deferred.reject("Check Error!");
            } else {
                console.info("check not pass yet!");
                timeCnt += 1;
                if (timeCnt > outCnt) {
                    clearInterval(timer);
                    console.error("Time out!", checkFunc);
                    deferred.reject("Time out");
                }
            }
        }, checkTime);

        window.onbeforeunload = function() {
            return;
       };

        return deferred.promise();
    };

    UnitTest.addDS = function(testDSObj, dsName) {
        console.clear();
        var deferred = PromiseHelper.deferred();
        if (dsName == null) {
            dsName = "uniteTest";
        }

        dsName = dsName + Math.floor(Math.random() * 10000);

        var url = testDSObj.url;
        var pointCheck = testDSObj.pointCheck || "";
        $("#dataStoresTab").click();
        if (!$("#inButton").hasClass('active')) {
            $("#inButton").click();
        }

        test.loadDS(dsName, url, pointCheck)
        .then(function() {
            deferred.resolve(dsName);
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    UnitTest.addTable = function(dsName) {
        var deferred = PromiseHelper.deferred();

        if (!$("#dataStoresTab").hasClass("active")) {
            $("#dataStoresTab").click();
            if (!$("#inButton").hasClass('active')) {
                $("#inButton").click();
            }
        }

        // XXX this create table way doesn't make sure
        // creating process is finishing
        // need to refine

        var sortColumnsAtoZ = true;
        test.createTable(dsName, sortColumnsAtoZ)
        .then(deferred.resolve)
        .fail(deferred.reject);

        return deferred.promise();
    };

    // add both ds and table
    // deferred dsName, tableName
    UnitTest.addAll = function(testDSObj, dsName) {
        var deferred = PromiseHelper.deferred();
        var testDS;

        UnitTest.addDS(testDSObj, dsName)
        .then(function(res) {
            testDS = res;
            return UnitTest.addTable(res);
        })
        .then(function(tableName, prefix) {
            deferred.resolve(testDS, tableName, prefix);
        })
        .fail(function(error) {
            console.error("Add fail", error);
            deferred.reject(error);
        });

        return deferred.promise();
    };

    UnitTest.deleteTable = function(table, type) {
        type = type || TableType.Active;
        var tableId;
        if (type === TableType.Orphan) {
            tableId = table;
        } else {
            tableId = xcHelper.getTableId(table);
        }
        return TblManager.deleteTables(tableId, type, true);
    };

    UnitTest.deleteDS = function(dsName) {
        var deferred = PromiseHelper.deferred();
        var $grid = DS.getGridByName(dsName);
        var dsId = $grid.data("dsid");
        var dsObj = DS.getDSObj(dsId);

        DS.__testOnly__.unlockDS(dsId)
        .then(function() {
            return DS.__testOnly__.delDSHelper($grid, dsObj, {"failToShow": true});
        })
        .then(deferred.resolve)
        .fail(function() {
            // now seems we have issue to delete ds because of ref count,
            // this should be reolsved with now backend way to hanld ds
            deferred.resolve();
        });

        return deferred.promise();
    };

    UnitTest.deleteAll = function(table, ds) {
        var deferred = PromiseHelper.deferred();

        UnitTest.deleteTable(table)
        .then(function() {
            return UnitTest.deleteDS(ds);
        })
        .then(deferred.resolve)
        .fail(function(error) {
            console.error("Delete fail", error);
            deferred.reject(error);
        });
        return deferred.promise();
    };

    UnitTest.deleteAllTables = function() {
        var deferred = PromiseHelper.deferred();

        DeleteTableModal.show(true)
        .then(function() {
            $('#deleteTableModal').find('.listSection .checkbox')
                                  .addClass('checked');
            return PromiseHelper.alwaysResolve(DeleteTableModal.__testOnly__.submitForm());
        })
        .then(function() {
            return DeleteTableModal.__testOnly__.closeModal();
        })
        .then(deferred.resolve);

        return deferred.promise();
    };

    UnitTest.onMinMode = function() {
        minModeCache = gMinModeOn;
        gMinModeOn = true;
    };

    UnitTest.offMinMode = function() {
        gMinModeOn = minModeCache;
        minModeCache = null;
    };

    UnitTest.hasStatusBoxWithError = function(error) {
        var $statusBox = $("#statusBox");
        assert.isTrue($statusBox.is(":visible"));
        var text = $statusBox.find(".message").text();
        if (text != error) {
            console.error(text, error);
        }
        expect(text).to.equal(error);
        StatusBox.forceHide();
    };

    UnitTest.hasAlertWithTitle = function(title, options) {
        options = options || {};
        var $alertModal = $("#alertModal");
        assert.isTrue($alertModal.is(":visible"));
        title = title.toLowerCase();
        if ($("#alertHeader .text").text().toLowerCase() != title) {
            console.error($("#alertHeader .text").text().toLowerCase(), title);
        }
        expect($("#alertHeader .text").text().toLowerCase()).to.equal(title);
        if (options.inputVal != null) {
            $alertModal.find('input').val(options.inputVal);
        }
        if (options.confirm) {
            $alertModal.find(".confirm").eq(0).click();
        } else {
            $alertModal.find(".cancel").click();
        }

        if (!options.nextAlert) {
            assert.isFalse($alertModal.is(":visible"));
        }
    };

    UnitTest.hasAlertWithText = function(text, options) {
        options = options || {};
        var $alertModal = $("#alertModal");
        assert.isTrue($alertModal.is(":visible"));
        expect($("#alertContent .text").text()).to.equal(text);
        if (options.inputVal != null) {
            $alertModal.find('input').val(options.inputVal);
        }
        if (options.confirm) {
            $alertModal.find(".confirm").eq(0).click();
        } else {
            $alertModal.find(".cancel").click();
        }

        if (!options.nextAlert) {
            assert.isFalse($alertModal.is(":visible"));
        }
    };

    UnitTest.timeoutPromise = function(amtTime) {
        var waitTime = amtTime || 1000;
        var deferred = PromiseHelper.deferred();
        setTimeout(function() {
            deferred.resolve();
        }, waitTime);
        return deferred;
    };

    UnitTest.removeOrphanTable = function() {
        var deferred = PromiseHelper.deferred();

        TableList.refreshOrphanList()
        .then(function() {
            return TblManager.deleteTables(gOrphanTables, TableType.Orphan);
        })
        .then(deferred.resolve)
        .fail(deferred.resolve);

        return deferred.promise();
    };

    UnitTest.getCoverage = function() {
        var res = "";
        $("#blanket-main").find(".blanket:not(.bl-title)").each(function() {
            var $div = $(this);
            var $children = $div.find("> .bl-cl");
            var title = $children.eq(0).text();
            var perCentage = $children.eq(1).text().split("%")[0].trim();
            var cover = $children.eq(2).text();
            // pass limit or not
            var isSuccess = $div.hasClass("bl-success");
            res += title + "\t" + cover + "\t" + perCentage + "\t" +
                   isSuccess + "\n";
        });
        xcHelper.downloadAsFile("unitTestReport", res);
        return res;
    };

    return (UnitTest);
}({}, jQuery));
