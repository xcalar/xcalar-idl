describe("Dataset-File Browser Test", function() {
    var $fileBrowser;
    var $pathLists;
    var $pathSection;
    var $mainTabCache;

    before(function(){
        $fileBrowser = $("#fileBrowser");
        $pathLists = $("#fileBrowserPathMenu");
        $pathSection = $("#fileBrowserPath");

        $mainTabCache = $(".topMenuBarTab.active");
        $("#dataStoresTab").click();
        UnitTest.onMinMode();
    });

    describe('Basic function test', function() {
        var $testGrid;
        var testFiles;
        var testHtml;

        before(function(){
            testHtml = '<div class="grid-unit">' +
                            '<div class="label" data-name="test"></div>' +
                        '</div>';
            $testGrid = $(testHtml);

            testFiles = [{
                "name": "test1.csv",
                "attr": {
                    "isDirectory": false,
                    "mtime": 1434159233,
                    "size": 1
                }
            },
            {
                "name": "test2.json",
                "attr": {
                    "isDirectory": false,
                    "mtime": 1451005071,
                    "size": 3
                }
            },
            {
                "name": "test3",
                "attr": {
                    "isDirectory": true,
                    "mtime": 1458167245,
                    "size": 2
                }
            }
            ];
        });

        it('should get current target', function() {
            var $section = $pathSection.find(".targetName");
            var oldVal = $section.text();
            $section.text("testTarget");
            var res = FileBrowser.__testOnly__.getCurrentTarget();
            expect(res).to.equal("testTarget");
            $section.text(oldVal);
        });

        it('should set current target', function() {
            var $section = $pathSection.find(".targetName");
            var oldVal = $section.text();
            FileBrowser.__testOnly__.setTarget("testTarget2");
            var res = FileBrowser.__testOnly__.getCurrentTarget();
            expect(res).to.equal("testTarget2");
            $section.text(oldVal);
        });

        it('Should get current path', function() {
            $pathLists.prepend('<li id="fileBrowserTestLi">test</li>');
            var res = FileBrowser.__testOnly__.getCurrentPath();
            expect(res).to.equal("test");
            $pathLists.find("li:first-of-type").remove();
        });

        it("should get history path", function() {
            var res = FileBrowser.__testOnly__.getHistoryPath("testTarget");
            expect(res).to.equal("/"); // default value
        });

        it("should set history path", function() {
            FileBrowser.__testOnly__.setHistoryPath("testTarget", "testPath");
            var res = FileBrowser.__testOnly__.getHistoryPath("testTarget");
            expect(res).to.equal("testPath"); // default value
        });

        it('Should get grid\'s name', function() {
            var res = FileBrowser.__testOnly__.getGridUnitName($testGrid);
            expect(res).to.equal("test");
        });

        it('Should focus on grid', function() {
            var $container = $("#fileBrowserContainer");
            $container.append($testGrid);
            FileBrowser.__testOnly__.focusOn(null);
            expect($testGrid.hasClass("active")).to.be.false;

            FileBrowser.__testOnly__.focusOn("test", true);
            expect($testGrid.hasClass("active")).to.be.true;
        });

        it('Should append path', function() {
            var testPath =  "/test";
            FileBrowser.__testOnly__.appendPath(testPath);
            var $li = $pathLists.find("li:first-of-type");
            var $pathText = $("#fileBrowserPath .text");
            expect($li.text()).to.equal(testPath);
            expect($pathText.val()).to.equal("/test");
            $li.remove();
            $pathText.val("");
        });

        it('Should filter files', function() {
            var regEx = new RegExp("json");
            var res = FileBrowser.__testOnly__.filterFiles(testFiles, regEx);
            // have test2.jsons
            expect(res.length).to.equal(1);
            expect(res[0].name).to.equal("test2.json");
        });

        it('Should sort files', function() {
            var sortFiles = FileBrowser.__testOnly__.sortFiles;
            var res;

            // test sort by size
            res = sortFiles(testFiles, "size");
            // folder comes first no matter the size
            expect(res[0].name).to.equal("test3");
            expect(res[1].name).to.equal("test1.csv");
            expect(res[2].name).to.equal("test2.json");

            // test sort by date
            res = sortFiles(testFiles, "date");
            expect(res[0].name).to.equal("test1.csv");
            expect(res[1].name).to.equal("test2.json");
            expect(res[2].name).to.equal("test3");

            // test sort by name
            res = sortFiles(testFiles, "name");
            expect(res[0].name).to.equal("test1.csv");
            expect(res[1].name).to.equal("test2.json");
            expect(res[2].name).to.equal("test3");

            // test sort by type
            res = sortFiles(testFiles, "type");
            expect(res[0].name).to.equal("test3");
            expect(res[1].name).to.equal("test1.csv");
            expect(res[2].name).to.equal("test2.json");
        });

        it('Should handle redirect error', function(done) {
            FileBrowser.__testOnly__.redirectHandler("testPath")
            .then(function() {
                var error = xcHelper.replaceMsg(ErrWRepTStr.NoPath, {
                    "path": "testPath"
                });
                UnitTest.hasStatusBoxWithError(error);
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("isDS() should work", function() {
            var isDS = FileBrowser.__testOnly__.isDS;
            var $grid = $('<div></div>');
            expect(isDS($grid)).to.be.false;
            // case 2
            $grid = $('<div class="ds"></div>');
            expect(isDS($grid)).to.be.true;
        });

        it("previewDS() should work", function() {
            var oldFunc = FilePreviewer.show;
            var previewDS = FileBrowser.__testOnly__.previewDS;
            var $grid = $("#notExistGrid");
            var test = null;

            FilePreviewer.show = function(options) {
                test = options.path;
            };

            previewDS($grid);
            expect(test).to.be.null;
            // case 2
            $grid = $('<div><div class="label" data-name="test"></div></div>');
            previewDS($grid);
            expect(test).not.to.be.null;
            expect(test).to.contain("test");

            FilePreviewer.show = oldFunc;
        });

        it("findVerticalIcon should work", function() {
            var findVerticalIcon = FileBrowser.__testOnly__.findVerticalIcon;
            var $curIcon = $(testHtml);
            $curIcon.after($testGrid);

            var $res = findVerticalIcon($curIcon, keyCode.Up);
            expect($res).to.equal($curIcon);

            // case 2
            $curIcon.before($testGrid);
            $res = findVerticalIcon($curIcon, keyCode.Down);
            expect($res.length).to.equal(0);
        });

        it("showScrolledFiles should work", function() {
            var showScrolledFiles = FileBrowser.__testOnly__.showScrolledFiles;
            var $fileBrowserMain = $("#fileBrowserMain");
            var $sizer = $('<div class="sizer"></div>');
            $("#fileBrowserContainer").append($sizer);
            var isGridView = $fileBrowserMain.hasClass("gridView");
            // case 1
            $fileBrowserMain.addClass("gridView");
            $sizer.hide();
            showScrolledFiles();
            expect($sizer.css("display")).to.equal("block");
            // case 2
            $fileBrowserMain.removeClass("gridView");
            $sizer.hide();
            showScrolledFiles();
            expect($sizer.css("display")).to.equal("block");

            // clear up
            $sizer.remove();
            if (isGridView) {
                $fileBrowserMain.addClass("gridView");
            }
        });

        it("should submit form", function() {
            var sumbitForm = FileBrowser.__testOnly__.sumbitForm;
            var oldFunc = DSPreview.show;
            var test = null;
            DSPreview.show = function(options) {
                test = options;
            };
            // error case
            // use default path
            $pathLists.prepend("<li>/</li>");
            sumbitForm();
            expect(test).to.be.null;
            UnitTest.hasStatusBoxWithError(ErrTStr.InvalidFile);

            // normal case 1
            $pathSection.find(".targetName").text(gDefaultSharedRoot);
            $pathLists.prepend("<li>/test/</li>");
            sumbitForm();
            expect(test).to.be.an("object");
            expect(test.targetName).to.equal(gDefaultSharedRoot);
            expect(test.path).to.equal("/test/");
            expect(test.format).to.be.null;

            // normal case 2
            $pathLists.prepend("<li>/</li>");
            var $ds = $('<div>' +
                            '<div class="fileName" data-name="test.csv"></div>' +
                        '</div>');
            sumbitForm($ds);
            expect(test).to.be.an("object");
            expect(test.targetName).to.equal(gDefaultSharedRoot);
            expect(test.path).to.equal("/test.csv");
            expect(test.format).to.equal("CSV");

            DSPreview.show = oldFunc;
        });

        it("showPathError should work", function() {
            FileBrowser.__testOnly__.showPathError();
            UnitTest.hasStatusBoxWithError(ErrTStr.InvalidFilePath);
        });

        it("getFolderInfo should work", function() {
            var oldFunc = FileInfoModal.show;
            var test = null;
            FileInfoModal.show = function(res) {
                test = res;
            };
            var curFiles = FileBrowser.__testOnly__.getCurFiles();
            curFiles[-1] = {
                "name": "test",
                "attr": {
                    "mtime": 123,
                    "isDirectory": false,
                    "size": 456
                }
            };
            var $grid = $('<div data-index="-1"></div>');
            FileBrowser.__testOnly__.getFolderInfo($grid);
            expect(test).to.be.an("object");
            expect(test.path).to.be.equal("test");
            expect(test.name).to.be.equal("test");
            expect(test.isFolder).to.be.equal(false);
            expect(test.size).to.be.equal("456B");

            FileInfoModal.show = oldFunc;
            delete curFiles[-1];
        });

        it("oversizeHandler should work", function() {
            FileBrowser.__testOnly__.oversizeHandler();
            expect($("#innerFileBrowserContainer").text())
            .to.contains(DSTStr.FileOversize);
        });

        after(function() {
            $testGrid.remove();
        });
    });

    describe("Go To Path Test", function() {
        var oldFunc;
        var goToPath;
        var $li;

        before(function() {
            oldFunc = XcalarListFiles;
            goToPath = FileBrowser.__testOnly__.goToPath;
            $li = $('<li>' + "/netstore/datasets/" + '</li>');
        });

        it('Should go to path', function(done) {
            goToPath($li)
            .then(function() {
                assert.isTrue($li.hasClass("select"));
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should not go to path with empty value", function(done) {
            FileBrowser.__testOnly__.goToPath()
            .then(function() {
                assert.isFalse($("#alertModal").is(":visible"));
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should handle go to path error", function(done) {
            XcalarListFiles = function() {
                return PromiseHelper.reject({"error": "test"});
            };

            FileBrowser.__testOnly__.goToPath($li)
            .then(function() {
                done("fail");
            })
            .fail(function() {
                assert.isTrue($("#alertModal").is(":visible"));
                $("#alertModal").find(".cancel").click();
                done();
            });
        });

        after(function() {
            XcalarListFiles = oldFunc;
        });
    });

    describe("Error Case Test", function() {
        var oldFunc;

        before(function() {
            oldFunc = XcalarListFiles;
        });

        it("Should handle old browser error", function(done) {
            var oldBrowserErr = "Deferred From Old Browser";
            XcalarListFiles = function() {
                return PromiseHelper.reject({error: oldBrowserErr});
            };

            FileBrowser.show(null, "")
            .then(function() {
                done("fail");
            })
            .fail(function(error) {
                expect(error).to.be.an("object");
                expect(error.error).to.equal(oldBrowserErr);
                done();
            });
        });

        it("Should handle normal fail case", function(done) {
            var errorMsg = "test";
            XcalarListFiles = function() {
                return PromiseHelper.reject({"error": errorMsg});
            };

            FileBrowser.show(gDefaultSharedRoot, "")
            .then(function() {
                done("fail");
            })
            .fail(function(error) {
                expect(error).to.be.an("object");
                expect(error.error).to.equal(errorMsg);

                expect($("#innerFileBrowserContainer").find(".error").text())
                .not.to.equal("");
                done();
            });
        });

        it("Should handle normal fail case when browser other path", function(done) {
            var errorMsg = "test2";
            XcalarListFiles = function() {
                return PromiseHelper.reject({"error": errorMsg});
            };

            FileBrowser.show(gDefaultSharedRoot, "/test/")
            .then(function() {
                done("fail");
            })
            .fail(function(error) {
                expect(error).to.be.an("object");
                expect(error.error).to.equal(errorMsg);

                expect($("#innerFileBrowserContainer").find(".error").text())
                .not.to.equal("");
                done();
            });
        });

        after(function() {
            XcalarListFiles = oldFunc;
        });
    });

    describe("Public API and basic behavior test", function() {
        it("should clear filebrrowser", function() {
            $("#fileBrowserUp").removeClass("disabled");
            FileBrowser.clear();
            expect($("#fileBrowserUp").hasClass("disabled"));
        });

        it('Should show the filebrowser', function(done) {
            FileBrowser.show(gDefaultSharedRoot, "")
            .then(function() {
                var $li = $pathLists.find("li:first-of-type");
                expect($li.text()).to.equal("/");
                assert.isTrue($fileBrowser.is(":visible"));
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it('Should click to toggle view', function() {
            var $fileBrowserMain = $("#fileBrowserMain");
            var isListView = $fileBrowserMain.hasClass("listView");

            // change view
            $("#fileBrowserGridView").click();
            expect($fileBrowserMain.hasClass("listView"))
            .to.equal(!isListView);

            // change view again
            $("#fileBrowserGridView").click();
            expect($fileBrowserMain.hasClass("listView"))
            .to.equal(isListView);

            StatusBox.forceHide();
        });

        it("Should click focus and deFocus a grid", function() {
            var $grid = findGrid("netstore");
            expect($grid.hasClass("active")).to.be.false;
            // focus
            $grid.click();
            expect($grid.hasClass("active")).to.be.true;
            // deFocus
            $("#fileBrowserContainer").click();
            expect($grid.hasClass("active")).to.be.false;
        });

        it("Should dbclick to enter a folder", function(done) {
            var $grid = findGrid("netstore");
            $grid.trigger(jQuery.Event("dblclick"));

            expect($fileBrowser.hasClass("loadMode")).to.be.true;

            var checkFunc = function() {
                return !$fileBrowser.hasClass("loadMode");
            };

            UnitTest.testFinish(checkFunc)
            .then(function() {
                var $datasets = findGrid("datasets");
                expect($datasets.length).to.equal(1);
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should alert in dblclick of folder when error", function(done) {
            var $datasets = findGrid("datasets");
            var checkFunc = function() {
                return !$fileBrowser.hasClass("loadMode");
            };

            var oldFunc = XcalarListFiles;

            XcalarListFiles = function() {
                return PromiseHelper.reject({"error": "test"});
            };

            $datasets.trigger(jQuery.Event("dblclick"));

            UnitTest.testFinish(checkFunc)
            .then(function() {
                var $alertModal = $("#alertModal");
                assert.isTrue($alertModal.is(":visible"));
                expect($("#alertHeader").find(".text").text())
                .to.equal(ThriftTStr.ListFileErr);
                $alertModal.find(".cancel").click();
                done();
            })
            .fail(function() {
                done("fail");
            })
            .always(function() {
                XcalarListFiles = oldFunc;
            });
        });

        it("Should click up button to go back", function(done) {
            $("#fileBrowserUp").click();

            expect($fileBrowser.hasClass("loadMode")).to.be.true;

            var checkFunc = function() {
                return !$fileBrowser.hasClass("loadMode");
            };

            UnitTest.testFinish(checkFunc)
            .then(function() {
                var $grid = findGrid("netstore");
                expect($grid.length).to.equal(1);

                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should click refresh button to refresh", function(done) {
            $("#fileBrowserRefresh").click();
            expect($fileBrowser.hasClass("loadMode")).to.be.true;

            var checkFunc = function() {
                return !$fileBrowser.hasClass("loadMode");
            };

            UnitTest.testFinish(checkFunc)
            .then(function() {
                var $grid = findGrid("netstore");
                expect($grid.length).to.equal(1);
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should click cancel button to back to form", function() {
            $fileBrowser.find(".cancel").click();
            assert.isFalse($fileBrowser.is(":visible"));
            assert.isTrue($("#dsFormView").is(":visible"));
        });
    });

    describe("Confirm Behavior Test", function() {
        var oldFunc;
        var test = null;

        before(function() {
            oldFunc = DSPreview.show;
            DSPreview.show = function(options) {
                test = options;
            };
        });

        it("Should click confirm to sumbitForm", function(done) {
            FileBrowser.show(gDefaultSharedRoot, "")
            .then(function() {
                var $grid = findGrid("netstore");
                $grid.click(); // focus on it
                $fileBrowser.find(".confirm").click();
                expect(test).to.be.an("object");
                expect(test.path).contain("netstore");
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should dblclick a dataset to sumbitForm", function(done) {
            var sp500 = testDatasets.sp500;
            FileBrowser.show(sp500.targetName, sp500.path)
            .then(function() {
                var $grid = findGrid("sp500.csv");
                $grid.trigger(jQuery.Event("dblclick"));
                expect(test).to.be.an("object");
                expect(test.path).contain("sp500.csv");
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        after(function() {
            DSPreview.show = oldFunc;
            $fileBrowser.find(".cancel").click();
        });
    });

    describe("Sort Behavior Test", function() {
        before(function(done) {
            // not using the cached history
            FileBrowser.show(gDefaultSharedRoot, "/netstore")
            .then(function() {
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should click sort button to open sort menu", function() {
            var $sortBtn = $("#fileBrowserSort");
            var $menu = $("#fileBrowserSortMenu");

            assert.isFalse($menu.is(":visible"));
            // click not open the menu
            $sortBtn.click();
            assert.isFalse($menu.is(":visible"));
            // normal mouse up not open the menu
            $sortBtn.mouseup();
            assert.isFalse($menu.is(":visible"));
            // unsortable case not show it
            $fileBrowser.addClass("unsortable");
            $sortBtn.trigger(fakeEvent.mouseup);
            assert.isFalse($menu.is(":visible"));
            // left mouse up open the menu
            $fileBrowser.removeClass("unsortable");
            $sortBtn.trigger(fakeEvent.mouseup);
            assert.isTrue($menu.is(":visible"));
            // close it
            $sortBtn.trigger(fakeEvent.mouseup);
            assert.isFalse($menu.is(":visible"));
        });

        it("Should use sort menu to sort", function() {
            var $li = $("#fileBrowserSortMenu").find('li[data-sortkey="size"]');
            expect($li.hasClass("select")).to.be.false;
            // when not left click
            $li.mouseup();
            expect($li.hasClass("select")).to.be.false;

            $li.trigger(fakeEvent.mouseup);
            expect($li.hasClass("select")).to.be.true;
        });

        it("Should sort using title label", function() {
            var $fileBrowserMain = $("#fileBrowserMain");
            var isListView = $fileBrowserMain.hasClass("listView");

            if (!isListView) {
                // change to list view
                $("#fileBrowserGridView").click();
            }
            var $grid = findGrid("netstore");
            // make it active
            $grid.click();
            expect($grid.hasClass("active")).to.be.true;

            // sort by name
            var $nameTitle = $fileBrowserMain.find(".title.fileName");
            var $nameLabel = $nameTitle.find(".label");
            // cannot sort if unsortable
            $fileBrowser.addClass("unsortable");
            $nameLabel.click();
            expect($nameTitle.hasClass("select")).to.be.false;
            // sort
            $fileBrowser.removeClass("unsortable");
            $nameLabel.click();
            expect($nameTitle.hasClass("select")).to.be.true;
            var $curGrid = findGrid("netstore");
            expect($curGrid.hasClass("active")).to.be.true;
            var index = $curGrid.index();
            var $nextGrid = $curGrid.next();
            // var nextGridIndex = $nextGrid.index();
            var nextGridName = $nextGrid.find('.label').data("name");
            // reverse
            $nameLabel.click();
            expect($nameTitle.hasClass("select")).to.be.true;
            $curGrid = findGrid("netstore");
            expect($curGrid.hasClass("active")).to.be.true;

            if ($curGrid.index() === index) { // if grid is right in the middle
                $nextGrid = findGrid(nextGridName);
                expect($nextGrid.index()).to.equal(index - 1);
            } else {
                expect($curGrid.index()).not.to.equal(index);
            }

            if (!isListView) {
                // change back the view
                $("#fileBrowserGridView").click();
            }
        });

        after(function() {
            $fileBrowser.find(".cancel").click();
        });
    });

    describe("Search Behavior Test", function() {
        var $searchSection = $("#fileBrowserSearch");

        before(function(done) {
            // not using the cached history
            FileBrowser.show(gDefaultSharedRoot, "/netstore")
            .then(function() {
                // make sure it's focused
                var $grid = findGrid("netstore");
                $grid.click();
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should search files", function() {
            $searchSection.find("input").val("netstore").trigger("input");
            // should only have one result
            var $grids = $("#innerFileBrowserContainer").find(".grid-unit");
            expect($grids.length).to.equal(1);
            expect($grids.eq(0).hasClass("active")).to.be.true;
        });

        it("Should clear search", function() {
            $searchSection.find(".clear").mousedown();
            var $grids = $("#innerFileBrowserContainer").find(".grid-unit");
            expect($grids.length).to.be.above(1);
            var $grid = findGrid("netstore");
            expect($grid.hasClass("active")).to.be.true;
        });

        it("Should match re.match's way to search", function() {
            var $input = $searchSection.find("input");
            // should no result
            $input.val("ets").trigger("input");
            var $grids = $("#innerFileBrowserContainer").find(".grid-unit");
            expect($grids.length).to.equal(0);
            // should have one result
            $input.val(".*ets").trigger("input");
            $grids = $("#innerFileBrowserContainer").find(".grid-unit");
            expect($grids.length).to.be.at.least(1);
        });

        it("Should hanld invalid search", function() {
            var $input = $searchSection.find("input");
            $searchSection.find("input").val("*").trigger("input");
            // should only have one result
            var error = $("#innerFileBrowserContainer").text();
            expect(error).to.equal(ErrTStr.InvalidRegEx);
            expect($input.hasClass("error")).to.be.true;
        });

        it("Should clear search to remove invalid search", function() {
            var $input = $searchSection.find("input");
            $searchSection.find(".clear").mousedown();
            var $grids = $("#innerFileBrowserContainer").find(".grid-unit");
            expect($grids.length).to.be.above(1);
            expect($input.hasClass("error")).to.be.false;
        });

        after(function() {
            $fileBrowser.find(".cancel").click();
        });
    });

    describe("Path Behavior Test", function() {
        var $pathSection;

        before(function(done) {
            $pathSection = $("#fileBrowserPath");
            // not using the cached history
            FileBrowser.show(gDefaultSharedRoot, "/netstore")
            .then(function() {
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should not tigger anything when using invalid key", function() {
            var $input = $pathSection.find(".text");
            var $grid = findGrid("netstore");
            $grid.click();

            var e = jQuery.Event("keyup", {"which": keyCode.Up});
            $input.trigger(e);
            expect($fileBrowser.hasClass("loadMode")).to.be.false;
        });

        it("Should go into folder when enter on path", function(done) {
            var $input = $pathSection.find(".text");
            $input.val("netstore");

            var e = jQuery.Event("keyup", {"which": keyCode.Enter});
            $input.trigger(e);
            expect($fileBrowser.hasClass("loadMode")).to.be.true;

            var checkFunc = function() {
                return !$fileBrowser.hasClass("loadMode");
            };

            UnitTest.testFinish(checkFunc)
            .then(function() {
                expect($input.val()).to.equal("/netstore/");
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should retrive path by input", function(done) {
            var $input = $pathSection.find(".text");
            $input.val("/").trigger("keyup");

            var checkFunc = function() {
                var $grid = findGrid("netstore");
                return $grid.length > 0;
            };

            UnitTest.testFinish(checkFunc)
            .then(function() {
                var $grid = findGrid("netstore");
                expect($grid.length).to.be.equal(1);
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        after(function() {
            $fileBrowser.find(".cancel").click();
        });
    });

    describe("KeyBoard Behavior Test", function() {
        before(function(done) {
            $pathSection = $("#fileBrowserPath");
            // not using the cached history
            FileBrowser.show(gDefaultSharedRoot, "/netstore")
            .then(function() {
                // remove active focus
                $("#innerFileBrowserContainer").click();
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should have nothing happen if target is wrong", function() {
            var target = $("#fileBrowserPreview").get(0);

            gMouseEvents.setMouseDownTarget(null);
            triggerKeyBoradEvent(78, target); // 78 = "n"

            var $grids = $fileBrowser.find(".grid-unit.active");
            expect($grids.length).to.equal(0);
        });

        it("Should have nothing happen if has invalid last target", function() {
            gMouseEvents.setMouseDownTarget($("body"));
            $("#fileBrowserSearch").find("input").focus().trigger("focus");
            triggerKeyBoradEvent(78); // 78 = "n"

            var $grids = $fileBrowser.find(".grid-unit.active");
            expect($grids.length).to.equal(0);
        });

        it("Should have nothing happen if tareget is input", function() {
            var target = $("#fileBrowserPath").find(".text").get(0);

            gMouseEvents.setMouseDownTarget(null);
            triggerKeyBoradEvent(78, target); // 78 = "n"

            var $grids = $fileBrowser.find(".grid-unit.active");
            expect($grids.length).to.equal(0);
        });

        it("Should focus on grid start with n", function() {
            gMouseEvents.setMouseDownTarget(null);
            triggerKeyBoradEvent(78); // 78 = "n"

            var $grids = $fileBrowser.find(".grid-unit.active");
            expect($grids.length).to.equal(1);
            expect($grids.eq(0).find(".fileName").data("name"))
            .to.contain("n");
        });

        it("Should go left and right using keyboard", function() {
            var isGrid = !$("#fileBrowserMain").hasClass("listView");

            if (!isGrid) {
                // change to grid view
                $("#fileBrowserGridView").click();
            }

            var $grid = findGrid("netstore");
            $grid.click(); // focus on it

            var index = $grid.index();
            // move left
            triggerKeyBoradEvent(keyCode.Left);
            var $activeGrid = $fileBrowser.find(".grid-unit.active");
            expect($activeGrid.index()).to.equal(index - 1);
            // move right
            triggerKeyBoradEvent(keyCode.Right);
            $activeGrid = $fileBrowser.find(".grid-unit.active");
            expect($activeGrid.index()).to.equal(index);

            if (!isGrid) {
                // change back
                $("#fileBrowserGridView").click();
            }
        });

        it("Should go up and down in list view", function() {
            var isListView = $("#fileBrowserMain").hasClass("listView");

            if (!isListView) {
                // change to list view
                $("#fileBrowserGridView").click();
            }

            var $grid = findGrid("netstore");
            $grid.click(); // focus on it

            var index = $grid.index();
            // move left
            triggerKeyBoradEvent(keyCode.Up);
            var $activeGrid = $fileBrowser.find(".grid-unit.active");
            expect($activeGrid.index()).to.equal(index - 1);
            // move right
            triggerKeyBoradEvent(keyCode.Down);
            $activeGrid = $fileBrowser.find(".grid-unit.active");
            expect($activeGrid.index()).to.equal(index);

            if (!isListView) {
                // change back
                $("#fileBrowserGridView").click();
            }
        });

        it("Should enter to go into folder", function(done) {
            var $grid = findGrid("netstore");
            $grid.click(); // focus on it

            triggerKeyBoradEvent(keyCode.Enter);

            expect($fileBrowser.hasClass("loadMode")).to.be.true;

            var checkFunc = function() {
                return !$fileBrowser.hasClass("loadMode");
            };

            UnitTest.testFinish(checkFunc)
            .then(function() {
                var $input = $("#fileBrowserPath").find(".text");
                expect($input.val()).to.equal("/netstore/");
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should backsape to go back", function(done) {
            triggerKeyBoradEvent(keyCode.Backspace);

            var checkFunc = function() {
                var $grid = findGrid("netstore");
                return $grid.length > 0;
            };

            UnitTest.testFinish(checkFunc)
            .then(function() {
                var $grid = findGrid("netstore");
                expect($grid.length).to.be.equal(1);
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        after(function() {
            $fileBrowser.find(".cancel").click();
        });

        function triggerKeyBoradEvent(keyBoradCode, target) {
            if (target == null) {
                target = $("#innerFileBrowserContainer").get(0);
            }

            var e = jQuery.Event("keydown", {
                "which": keyBoradCode,
                "target": target
            });
            $(document).trigger(e);
        }
    });

    describe("Right Click Menu Behavior Test", function() {
        var $fileBrowserMenu;

        before(function(done) {
            $fileBrowserMenu = $("#fileBrowserMenu");
            // not using the cached history
            FileBrowser.show(gDefaultSharedRoot, "/netstore/")
            .then(function() {
                done();
            })
            .fail(function() {
                done("fail");
            });
        });

        it("Should show menu on folder", function() {
            var target = $fileBrowser.find(".grid-unit.folder").get(0);
            triggerContextMenu(target);
            assert.isTrue($fileBrowserMenu.is(":visible"));
            expect($fileBrowserMenu.hasClass("dsOpts")).to.be.false;
            expect($fileBrowserMenu.hasClass("folderOpts")).to.be.true;
        });

        it("Should show menu on ds", function() {
            $fileBrowserMenu.hide();
            var target = $fileBrowser.find(".grid-unit.ds").get(0);
            triggerContextMenu(target);
            assert.isTrue($fileBrowserMenu.is(":visible"));
            expect($fileBrowserMenu.hasClass("dsOpts")).to.be.true;
            expect($fileBrowserMenu.hasClass("folderOpts")).to.be.false;
        });

        it("Should not show menu on empty space", function() {
            $fileBrowserMenu.hide();
            var target = $("#fileBrowserMain").get(0);
            triggerContextMenu(target);
            assert.isFalse($fileBrowserMenu.is(":visible"));
        });

        it("Should trigger preview via menu", function() {
            var oldFunc = FilePreviewer.show;
            var test = null;
            FilePreviewer.show = function(url) {
                test = url;
            };
            var target = $fileBrowser.find(".grid-unit.ds").get(0);
            triggerContextMenu(target);

            $fileBrowserMenu.find(".preview").mouseup();
            expect(test).not.to.be.null;

            FilePreviewer.show = oldFunc;
        });

        it("Should trigger getInfo via menu", function() {
            var oldFunc = FileInfoModal.show;
            var test = null;
            FileInfoModal.show = function(options) {
                test = options;
            };
            var target = $fileBrowser.find(".grid-unit.ds").get(0);
            triggerContextMenu(target);

            $fileBrowserMenu.find(".getInfo").mouseup();
            expect(test).to.be.an("object");

            FileInfoModal.show = oldFunc;
        });

        after(function() {
            $fileBrowser.find(".cancel").click();
        });

        function triggerContextMenu(target) {
            var e = jQuery.Event("contextmenu", {"target": target});
            $("#fileBrowserMain").trigger(e);
        }
    });

    after(function() {
        // go back to previous tab
        $mainTabCache.click();
        UnitTest.offMinMode();
    });

    function findGrid(name) {
        var selector = '.grid-unit .fileName[data-name="' + name + '"]';
        var $grid = $fileBrowser.find(selector).closest(".grid-unit");
        return $grid;
    }
});