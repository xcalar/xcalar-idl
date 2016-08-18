function dsPreviewModuleTest() {
    // Note that this function is called in very early time
    // so do not initialize any resuable varible here
    // instead, initialize in the it() function
    var $previewTable;
    var $highLightBtn;
    var $rmHightLightBtn;

    var $fileName;
    var $formatText;

    var $csvDelim; // csv delimiter args
    var $fieldText;
    var $lineText;

    var $udfArgs;
    var $udfModuleList;
    var $udfFuncList;

    var $headerCheckBox; // promote header checkbox
    var $udfCheckbox; // udf checkbox

    var $statusBox;

    before(function(){
        $previewTable = $("#previewTable");
        $highLightBtn = $("#preview-highlight");
        $rmHightLightBtn = $("#preview-rmHightlight");

        $fileName = $("#dsForm-dsName");
        $formatText  = $("#fileFormat .text");

        $csvDelim = $("#csvDelim"); // csv delimiter args
        $fieldText = $("#fieldText");
        $lineText = $("#lineText");

        $udfArgs  = $("#udfArgs");
        $udfModuleList = $("#udfArgs-moduleList");
        $udfFuncList = $("#udfArgs-funcList");

        $headerCheckBox = $("#promoteHeaderCheckbox"); // promote header checkbox
        $udfCheckbox = $("#udfCheckbox"); // udf checkbox

        $statusBox = $("#statusBox");
    });

    describe("Basic Function Test", function() {
        it('parseTdHelper should work', function() {
            var parseTdHelper = DSPreview.__testOnly__.parseTdHelper;
            var testCases = [{
                // test1: when not th, has delimiter
                "delimiter": ",",
                "isTh": false,
                "data": ["h", ",", "i"],
                "expectRes": '<td class="cell">h</td>' +
                             '<td class="cell">i</td>'
            },
            {
                // test2: when not th, no delimiter
                "delimiter": "",
                "isTh": false,
                "data": ["h", ",", "i"],
                "expectRes": '<td class="cell">' +
                                '<span class="td">h</span>' +
                                '<span class="td has-margin has-comma">' +
                                    ',' +
                                '</span>' +
                                '<span class="td">i</span>' +
                             '</td>'
            },
            {
                // test3: when not th, other delimiter
                "delimiter": "\t",
                "isTh": false,
                "data": ["h", ",", "i"],
                "expectRes": '<td class="cell">h,i</td>'
            },
            {
                // test4: when is th, has delimiter
                "delimiter": ",",
                "isTh": true,
                "data": ["h", ",", "i"],
                "expectRes": '<th>' +
                                '<div class="header">' +
                                    '<div class="colGrab"' +
                                    ' data-sizetoheader="true"></div>' +
                                    '<div class="text cell">h</div>' +
                                '</div>' +
                            '</th>' +
                            '<th>' +
                                '<div class="header">' +
                                    '<div class="colGrab"' +
                                    ' data-sizetoheader="true"></div>' +
                                    '<div class="text cell">i</div>' +
                                '</div>' +
                            '</th>'
            },
            {
                // test5: when not th, delimiter ",", data has backslash
                "delimiter": "\t",
                "isTh": false,
                "data": ["h", "\\", ",", "i"],
                "expectRes": '<td class="cell">h\\,i</td>'
            }];

            testCases.forEach(function(testCase) {
                var td = parseTdHelper(testCase.data, testCase.delimiter,
                                        testCase.isTh);
                expect(td).to.equal(testCase.expectRes);
            });
        });

        it("getTbodyHTML() shoud work", function() {
            var getTbodyHTML = DSPreview.__testOnly__.getTbodyHTML;

            var testCases = [{
                // test1: when no header
                "datas": [["t", "e", "s", "t"]],
                "delimiter": "",
                "hasHeader": false,
                "expectRes": '<tbody>' +
                                '<tr>' +
                                    '<td class="lineMarker promote" ' +
                                    'title="Promote Header" ' +
                                    'data-toggle="tooltip" ' +
                                    'data-placement="top" ' +
                                    'data-container="body">' +
                                        '<div class="promoteWrap">' +
                                            '<div class="iconWrapper">' +
                                                '<span class="icon"></span>' +
                                            '</div>' +
                                        '<div class="divider"></div>' +
                                        '</div>' +
                                    '</td>' +
                                    '<td class="cell">' +
                                        '<span class="td">t</span>' +
                                        '<span class="td">e</span>' +
                                        '<span class="td">s</span>' +
                                        '<span class="td">t</span>' +
                                    '</td>' +
                                '</tr>' +
                            '</tbody>'
            },
            {
                // test2: when has header
                "datas": [["t", "e", "s", "t"], ["h", "i"]],
                "delimiter": "",
                "hasHeader": true,
                "expectRes": '<tbody>' +
                                '<tr>' +
                                    '<td class="lineMarker">1</td>' +
                                    '<td class="cell">' +
                                        '<span class="td">h</span>' +
                                        '<span class="td">i</span>' +
                                    '</td>' +
                                '</tr>' +
                            '</tbody>'
            }
            ];

            testCases.forEach(function(testCase) {
                var delimiter = testCase.delimiter
                var hasHeader = testCase.hasHeader;

                DSPreview.__testOnly__.set(delimiter, hasHeader, "");
                var tbody = getTbodyHTML(testCase.datas);
                expect(tbody).to.equal(testCase.expectRes);
            });

            DSPreview.__testOnly__.set("", false, "");
        });

        it("getTheadHTML should work", function() {
            var getTheadHTML = DSPreview.__testOnly__.getTheadHTML;

            var testCases = [{
                // test1: when no header
                "datas": [["h", "i"]],
                "tdLen": 2,
                "delimiter": "",
                "hasHeader": false,
                "expectRes": '<thead>' +
                                '<tr>' +
                                    '<th class="rowNumHead">' +
                                        '<div class="header"></div>' +
                                    '</th>' +
                                    '<th>' +
                                        '<div class="header">' +
                                            '<div class="text">Column0</div>' +
                                        '</div>' +
                                    '</th>' +
                                '</tr>' +
                              '</thead>'
            },
            {
                // test2: when has header
                "datas": [["h", "i"]],
                "tdLen": 2,
                "delimiter": "",
                "hasHeader": true,
                "expectRes": '<thead>' +
                                '<tr>' +
                                    '<th class="undo-promote">' +
                                        '<div class="header" ' +
                                        'title="Undo Promote Header" ' +
                                        'data-toggle="tooltip" ' +
                                        'data-placement="top" ' +
                                        'data-container="body">' +
                                            '<span class="icon"></span>' +
                                        '</div>' +
                                    '</th>' +
                                    '<th>' +
                                        '<div class="header">' +
                                            '<div class="text cell">' +
                                                '<span class="td">h</span>' +
                                                '<span class="td">i</span>' +
                                            '</div>' +
                                        '</div>' +
                                    '</th>' +
                                '</tr>' +
                              '</thead>'
            }
            ];

            testCases.forEach(function(testCase) {
                var delimiter = testCase.delimiter
                var hasHeader = testCase.hasHeader;

                DSPreview.__testOnly__.set(delimiter, hasHeader, "");
                var tHead = getTheadHTML(testCase.datas, testCase.tdLen);
                expect(tHead).to.equal(testCase.expectRes);
            });

            DSPreview.__testOnly__.set("", false, "");
        });

        it("highlightHelper() should work", function() {
            var $cell = $('<div class="text cell">'+
                            '<span class="td">h</span>' +
                            '<span class="td">,</span>' +
                            '<span class="td">i</span>' +
                        '</div>');
            DSPreview.__testOnly__.highlightHelper($cell, ",");

            expect($cell.html()).to.equal('<span class="td">h</span>' +
                                '<span class="td highlight">,</span>' +
                                '<span class="td">i</span>');
        });
    });

    describe("Suggest Test", function() {
        var $content;

        before(function() {
            $content = $("#previewSugg .content");
        });

        it("should suggest proper delimiter", function() {
            var $actions;

            DSPreview.__testOnly__.set("", false, "");

            // when nothing to delimit
            $previewTable.html('');
            DSPreview.__testOnly__.suggestHelper();

            $actions = $content.find(".action");
            expect($actions.length).to.equal(1);
            expect($actions.eq(0).hasClass("hint")).to.be.false;
            expect($actions.eq(0).text()).equal('Save & Exit');


            // when delimiter on comma
            $previewTable.html('<span class="has-comma"></span>');
            DSPreview.__testOnly__.suggestHelper();

            $actions = $content.find(".action");
            expect($actions.length).to.equal(2);
            expect($actions.eq(0).hasClass("commaDelim")).to.be.true;
            expect($actions.eq(0).text()).equal('Apply comma as delimiter');
            expect($actions.eq(1).hasClass("hint")).to.be.true;
            expect($actions.eq(1).text()).equal('or Highlight another character as delimiter');

            // when delimiter on tab
            $previewTable.html('<span class="has-tab"></span>');
            DSPreview.__testOnly__.suggestHelper();

            $actions = $content.find(".action");
            expect($actions.length).to.equal(2);
            expect($actions.eq(0).hasClass("tabDelim")).to.be.true;
            expect($actions.eq(0).text()).equal('Apply tab as delimiter');
            expect($actions.eq(1).hasClass("hint")).to.be.true;
            expect($actions.eq(1).text()).equal('or Highlight another character as delimiter');
        });

        it("Should suggest about highlight when has highlighter", function() {
            DSPreview.__testOnly__.set("", false, ",");
            DSPreview.__testOnly__.suggestHelper();

            var $actions = $content.find(".action");
            expect($actions.length).to.equal(2);
            expect($actions.eq(0).hasClass("apply-highlight")).to.be.true;
            expect($actions.eq(0).text()).equal('Apply hightlighted characters as delimiter');
            expect($actions.eq(1).hasClass("rm-highlight")).to.be.true;
            expect($actions.eq(1).text()).equal('Remove highlights');
        });

        it("Should suggest in error url", function() {
            var $actions;
            // load execl error
            DSPreview.__testOnly__.errorSuggestHelper("test.xlsx");

            $actions = $content.find(".action");
            expect($actions.length).to.equal(2);
            expect($actions.eq(0).hasClass("excelLoad hasHeader")).to.be.true;
            expect($actions.eq(0).text()).equal(DSPreviewTStr.LoadExcelWithHeader);
            expect($actions.eq(1).hasClass("excelLoad")).to.be.true;
            expect($actions.eq(1).text()).equal(DSPreviewTStr.LoadExcel);

            // load json error
            DSPreview.__testOnly__.errorSuggestHelper("test.json");

            $actions = $content.find(".action");
            expect($actions.length).to.equal(1);
            expect($actions.eq(0).hasClass("jsonLoad")).to.be.true;
            expect($actions.eq(0).text()).equal(DSPreviewTStr.LoadJSON);

            // other kind of error
            DSPreview.__testOnly__.errorSuggestHelper("test");

            $actions = $content.find(".action");
            expect($actions.length).to.equal(1);
            expect($actions.eq(0).hasClass("hint")).to.be.true;
            expect($actions.eq(0).text()).equal(DSPreviewTStr.LoadUDF);
        });

        it("headerPromoteDetect() should work", function() {
            // when no delimiter
            DSPreview.__testOnly__.set("", false, "");
            expect(DSPreview.__testOnly__.headerPromoteDetect()).to.be.false;

            // when has delimiter
            DSPreview.__testOnly__.set(",", false, "");
            // case1
            $previewTable.html('<table><tbody>' +
                                    '<tr>' +
                                        '<td>1</td>' +
                                        '<td>2</td>' +
                                    '<tr>' +
                                    '<tr>' +
                                        '<td>b</td>' +
                                        '<td>b</td>' +
                                    '<tr>' +
                                '</tbody></table>');
            expect(DSPreview.__testOnly__.headerPromoteDetect()).to.be.false;

            // case2
            $previewTable.html('<table><tbody>' +
                                    '<tr>' +
                                        '<td>H1</td>' +
                                        '<td>H2</td>' +
                                        '<td>H3</td>' +
                                    '<tr>' +
                                    '<tr>' +
                                        '<td>1</td>' +
                                        '<td>2</td>' +
                                        '<td>3</td>' +
                                    '<tr>' +
                                '</tbody></table>');
            expect(DSPreview.__testOnly__.headerPromoteDetect()).to.be.true;
        });

        after(function() {
            DSPreview.__testOnly__.set("", false, "");
            $previewTable.empty();
            $content.empty();
        });
    });

    describe("Get Preview Table Test", function() {
        it ("Should get a table from raw data", function() {
            var data = [["h", ",", "i"], ["t", "e", "s", "t"]];
            DSPreview.__testOnly__.set("", false, "", data);
            DSPreview.__testOnly__.getPreviewTable();

            // has 2 rows and 2 columns
            expect($previewTable.find("th").length).to.equal(2);
            expect($previewTable.find("tbody tr").length).to.equal(2);

            DSPreview.__testOnly__.set(",", false, "", data);
            DSPreview.__testOnly__.getPreviewTable();

            // has 2 rows and 3 columns
            expect($previewTable.find("th").length).to.equal(3);
            expect($previewTable.find("tbody tr").length).to.equal(2);
        });

        it("Should highlight delimiter", function() {
            var data = [["h", ",", "i"]];
            DSPreview.__testOnly__.set("", false, "", data);
            DSPreview.__testOnly__.getPreviewTable();

            // can highlight
            DSPreview.__testOnly__.applyHighlight(",");
            expect(DSPreview.__testOnly__.get().highlighter).to.equal(",");
            expect($previewTable.find(".highlight").length).to.equal(1);
            expect($highLightBtn.hasClass("active")).to.be.true;
            expect($rmHightLightBtn.hasClass("active")).to.be.true;

            // can remove highlight
            DSPreview.__testOnly__.applyHighlight("");
            expect(DSPreview.__testOnly__.get().highlighter).to.equal("");
            expect($previewTable.find(".highlight").length).to.equal(0);
            expect($highLightBtn.hasClass("active")).to.be.false;
            expect($rmHightLightBtn.hasClass("active")).to.be.false;
        });

        it("Should apply delimiter", function() {
            var data = [["h", ",", "i"]];
            DSPreview.__testOnly__.set("", false, "", data);
            DSPreview.__testOnly__.getPreviewTable();

            // can apply delimiter
            DSPreview.__testOnly__.applyDelim(",");
            var res = DSPreview.__testOnly__.get();
            expect(res.delimiter).to.equal(",");
            expect(res.highlighter).to.equal("");
            expect($rmHightLightBtn.hasClass("active")).to.be.true;
            expect($previewTable.find(".has-comma").length).to.equal(0);

            // can remove delimiter
            DSPreview.__testOnly__.applyDelim("");
            expect(DSPreview.__testOnly__.get().delimiter).to.equal("");
            expect($rmHightLightBtn.hasClass("active")).to.be.false;
            expect($previewTable.find(".has-comma").length).to.equal(1);
        });

        it("Should toggle promote", function() {
            var data = [["h", ",", "i"]];
            DSPreview.__testOnly__.set("", false, "", data);
            DSPreview.__testOnly__.getPreviewTable();

            // toggle to have header
            DSPreview.__testOnly__.togglePromote();
            expect(DSPreview.__testOnly__.get().hasHeader).to.be.true;
            expect($previewTable.find(".undo-promote").length).to.equal(1);

            // toggle to remove header
            DSPreview.__testOnly__.togglePromote();
            expect(DSPreview.__testOnly__.get().hasHeader).to.be.false;
            expect($previewTable.find(".undo-promote").length).to.equal(0);
        });

        it("Should clear preview table", function() {
            var data = [["h", ",", "i"]];
            DSPreview.__testOnly__.set(",", true, "", data);
            DSPreview.__testOnly__.getPreviewTable();

            DSPreview.__testOnly__.clearAll();
            var res = DSPreview.__testOnly__.get();
            expect(res.delimiter).to.equal("");
            expect(res.highlighter).to.equal("");
            expect(res.hasHeader).to.equal(false);
            expect($previewTable.html()).to.equal("");
        });

        after(function() {
            DSPreview.__testOnly__.set("", false, "");
            $previewTable.empty();
        });
    });

    describe("Preview API Test", function() {
        it("DSPreview.show() should work", function(done) {
            var loadUrl = testDatasets.sp500.protocol + testDatasets.sp500.path;
            DSPreview.show(loadUrl)
            .then(function() {
                // expect($previewTable.is(":visible")).to.be.true;
                expect($previewTable.html()).not.to.equal("");
                done();
            })
            .fail(function() {
                throw "Fail Case!";
            });
        });

        it("DSPreview.clear() should work", function(done) {
            DSPreview.clear()
            .then(function() {
                var res = DSPreview.__testOnly__.get();
                expect(res.delimiter).to.equal("");
                expect(res.highlighter).to.equal("");
                expect(res.hasHeader).to.equal(false);
                done();
            })
            .fail(function() {
                throw "Fail Case!";
            });
        });

        after(function() {
            // DSPreview.clear() doesn't remove preview table's html,
            // so call clearAll() to totally clear
            DSPreview.__testOnly__.clearAll();
        });
    });

    // XXX moved to dsPreview.js (getNameFromPath)
        // it('Should get short name', function(done) {
        //     var getShortName = FileBrowser.__testOnly__.getShortName;
        //     var testName = xcHelper.randName("testName");
        //     var oldhas = DS.has;

        //     // basic
        //     getShortName(testName)
        //     .then(function(res) {
        //         expect(res).to.equal(testName);
        //         var test2 = testName + ".test";
        //         return getShortName(testName);
        //     })
        //     .then(function(res) {
        //         // should stripe the dot
        //         expect(res).to.equal(testName);
        //     })
        //     .then(function() {
        //         DS.has = function(name) {
        //             if (name === testName) {
        //                 return true;
        //             } else {
        //                 return false;
        //             }
        //         };

        //         return getShortName(testName);
        //     })
        //     .then(function(res) {
        //         expect(res).to.equal(testName + "1");
        //         DS.has = oldhas;
        //         done();
        //     })
        //     .fail(function() {
        //         throw "Error case";
        //     });
        // });


    // describe("Format Change Test", function() {
    //     beforeEach(function() {
    //         DSForm.__testOnly__.resetForm();
    //     });

    //     it("Format Should be CSV", function() {
    //         DSForm.__testOnly__.toggleFormat("CSV");
    //         expect($formatText.data("format")).to.equal("CSV");

    //         // UI part
    //         assert.isTrue($headerCheckBox.is(":visible"), "has header checkbox");
    //         assert.isTrue($udfCheckbox.is(":visible"), "has udf checkbox");
    //         assert.isTrue($csvDelim.is(":visible"), "has delimiter section");
    //         assert.isTrue($fieldText.is(":visible"), "has field delimiter");
    //         assert.isTrue($lineText.is(":visible"), "has line delimiter");
    //     });

    //     it("Format Should be JSON", function() {
    //         DSForm.__testOnly__.toggleFormat("JSON");
    //         expect($formatText.data("format")).to.equal("JSON");

    //         // UI part
    //         assert.isFalse($headerCheckBox.is(":visible"), "no header checkbox");
    //         assert.isTrue($udfCheckbox.is(":visible"), "has udf checkbox");
    //         assert.isFalse($csvDelim.is(":visible"), "no delimiter section");
    //     });

    //     it("Format Should be Text", function() {
    //         DSForm.__testOnly__.toggleFormat("Text");
    //         expect($formatText.data("format")).to.equal("TEXT");

    //         // UI part
    //         assert.isTrue($headerCheckBox.is(":visible"), "has header checkbox");
    //         assert.isTrue($udfCheckbox.is(":visible"), "has udf checkbox");
    //         assert.isTrue($csvDelim.is(":visible"), "has delimiter section");
    //         assert.isFalse($fieldText.is(":visible"), "no field delimiter");
    //         assert.isTrue($lineText.is(":visible"), "has line delimiter");
    //     });

    //     it("Format Should be Excel", function() {
    //         DSForm.__testOnly__.toggleFormat("Excel");
    //         expect($formatText.data("format")).to.equal("EXCEL");

    //         // UI part
    //         assert.isTrue($headerCheckBox.is(":visible"), "has header checkbox");
    //         assert.isFalse($udfCheckbox.is(":visible"), "no udf checkbox");
    //         assert.isFalse($csvDelim.is(":visible"), "no delimiter section");
    //     });

    //     after(function() {
    //         DSForm.__testOnly__.resetForm();
    //     });
    // });

    //  describe("Check UDF Test", function() {
    //     var checkUDF;

    //     before(function() {
    //         checkUDF = DSForm.__testOnly__.checkUDF;
    //         DSForm.__testOnly__.toggleFormat("CSV");
    //     });

    //     it("Should be valid with no udf", function() {
    //         var res = checkUDF();
    //         expect(res).to.be.an('object');
    //         expect(res).to.have.property('isValid', true);
    //         expect(res).to.have.property('hasUDF', false);
    //         expect(res).to.have.property('moduleName', '');
    //         expect(res).to.have.property('funcName', '');
    //     });

    //     it("Should be invalid with udf check but no module", function() {
    //         $("#udfCheckbox .checkbox").click();
    //         var res = checkUDF();
    //         expect(res).to.be.an('object');
    //         expect(res).to.have.property('isValid', false);
    //         expect(res).to.have.property('hasUDF', true);
    //         expect(res).to.have.property('moduleName', '');
    //         expect(res).to.have.property('funcName', '');
    //         // check status box
    //         assert.isTrue($statusBox.is(":visible"), "see statux box");
    //         assert.equal($statusBox.find(".message").text(), ErrTStr.NoEmptyList);
    //     });

    //     it("Should be invalid with no func", function() {
    //         $("#udfArgs-moduleList .text").val("testModule");
    //         var res = checkUDF();
    //         expect(res).to.be.an('object');
    //         expect(res).to.have.property('isValid', false);
    //         expect(res).to.have.property('hasUDF', true);
    //         expect(res).to.have.property('moduleName', 'testModule');
    //         expect(res).to.have.property('funcName', '');
    //         // check status box
    //         assert.isTrue($statusBox.is(":visible"), "see statux box");
    //         assert.equal($statusBox.find(".message").text(), ErrTStr.NoEmptyList);
    //     });

    //     it("Should be valid with module and func", function() {
    //         $("#udfArgs-funcList .text").val("testFunc");
    //         var res = checkUDF();
    //         expect(res).to.be.an('object');
    //         expect(res).to.have.property('isValid', true);
    //         expect(res).to.have.property('hasUDF', true);
    //         expect(res).to.have.property('moduleName', 'testModule');
    //         expect(res).to.have.property('funcName', 'testFunc');
    //     });

    //     after(function() {
    //         DSForm.__testOnly__.resetForm();
    //     });
    // });

    // describe("promoptHeaderAlert Test", function() {
    //     var minModeCache;
    //     var promoptHeaderAlert;
    //     var $alertModal;

    //     before(function() {
    //         $alertModal = $("#alertModal");
    //         promoptHeaderAlert = DSForm.__testOnly__.promoptHeaderAlert;
    //     });

    //     it("Should alert when CSV with no header", function(done) {
    //         promoptHeaderAlert("CSV", false)
    //         .always(function() {
    //             assert.isFalse($alertModal.is(":visible"), "close alert");
    //             done();
    //         });

    //         assert.isTrue($alertModal.is(":visible"), "see alert");
    //         $alertModal.find(".close").click();
    //     });

    //     it("Should not alert when CSV with header", function(done) {
    //         promoptHeaderAlert("CSV", true)
    //         .always(function() {
    //             assert.isFalse($alertModal.is(":visible"), "close alert");
    //             done();
    //         });
    //     });

    //     it("Should alert when Raw with no header", function(done) {
    //         promoptHeaderAlert("raw", false)
    //         .always(function() {
    //             assert.isFalse($alertModal.is(":visible"), "close alert");
    //             done();
    //         });

    //         assert.isTrue($alertModal.is(":visible"), "see alert");
    //         $alertModal.find(".close").click();
    //     });

    //     it("Should not alert when Raw with header", function(done) {
    //         promoptHeaderAlert("raw", true)
    //         .always(function() {
    //             assert.isFalse($alertModal.is(":visible"), "close alert");
    //             done();
    //         });
    //     });

    //     it("Should alert when Excel with no header", function(done) {
    //         promoptHeaderAlert("Excel", false)
    //         .always(function() {
    //             assert.isFalse($alertModal.is(":visible"), "close alert");
    //             done();
    //         });

    //         assert.isTrue($alertModal.is(":visible"), "see alert");
    //         $alertModal.find(".close").click();
    //     });

    //     it("Should not alert when Excel with header", function(done) {
    //         promoptHeaderAlert("Excel", true)
    //         .always(function() {
    //             assert.isFalse($alertModal.is(":visible"), "close alert");
    //             done();
    //         });
    //     });

    //     it("Should not alert when format is JSON", function(done) {
    //         promoptHeaderAlert("JSON", true)
    //         .always(function() {
    //             assert.isFalse($alertModal.is(":visible"), "close alert");
    //             done();
    //         });
    //     });
    // });
    
    // // remove to dsPreview
    // // describe("UDF Func Test", function() {
    // //     before(function() {
    // //         DSForm.__testOnly__.toggleFormat("CSV");
    // //         $udfCheckbox.find(".checkbox").click();
    // //     });

    // //     it("Should have default udf", function() {
    // //         assert.isTrue($udfArgs.is(":visible"), "should see udf section");
    // //         expect($udfModuleList.find("input").val()).to.be.empty;
    // //         expect($udfFuncList.find("input").val()).to.be.empty;

    // //         // module default:openExcel should exists
    // //         expect($udfModuleList.find('li:contains(default)')).not.to.be.empty;
    // //         expect($udfFuncList.find('li:contains(openExcel)')).not.to.be.empty;
    // //     });

    // //     it("Should select a udf module", function() {
    // //         DSForm.__testOnly__.selectUDFModule("default");
    // //         expect($udfModuleList.find("input").val()).to.equal("default");
    // //         expect($udfFuncList.find("input").val()).to.be.empty;
    // //     });

    // //     it("Should select a udf func", function() {
    // //         DSForm.__testOnly__.selectUDFFunc("openExcel");
    // //         expect($udfModuleList.find("input").val()).to.equal("default");
    // //         expect($udfFuncList.find("input").val()).to.equal("openExcel");
    // //     });

    // //     it("Should reset udf", function() {
    // //         DSForm.__testOnly__.resetUdfSection();
    // //         expect($udfModuleList.find("input").val()).to.be.empty;
    // //         expect($udfFuncList.find("input").val()).to.be.empty;
    // //     });

    // //     after(function() {
    // //         DSForm.__testOnly__.resetForm();
    // //     });
    // // });

    // describe("Submit Form Test", function() {
    //     var testDS;

    //     before(function() {
    //         testDS = xcHelper.uniqueRandName("testSuitesSp500", DS.has, 10);
    //         $("#fileProtocol input").val(testDatasets.sp500.protocol);
    //         $filePath.val(testDatasets.sp500.path);
    //         $fileName.val(testDS);
    //         // test the case when have header(otherwise it will have header prmopt)
    //         $("#promoteHeaderCheckbox .checkbox").addClass("checked");
    //     });

    //     // no format is always not empty, default is CSV
    //     // it("Should not allow empty format", function(done) {
    //     //     DSForm.__testOnly__.submitForm()
    //     //     .then(function() {
    //     //         // Intentionally fail the test
    //     //         throw "Fail Case!";
    //     //     })
    //     //     .fail(function(error) {
    //     //         expect(error).to.equal("Checking Invalid");
    //     //         done();
    //     //     });
    //     // });

    //     it("Should not pass invalid url", function(done) {
    //         DSForm.__testOnly__.toggleFormat("CSV");
    //         $filePath.val("netstore/datasets/sp500-invalidurl");

    //         DSForm.__testOnly__.submitForm()
    //         .then(function() {
    //             // Intentionally fail the test
    //             throw "Fail Case!";
    //         })
    //         .fail(function(error) {
    //             console.log(error)
    //             expect(error).to.be.an("object")
    //             expect(error.status).to.equal(StatusT.StatusNoEnt);
    //             done();
    //         });
    //     });

    //     it("Should load ds", function(done) {
    //         DSForm.__testOnly__.toggleFormat("CSV");
    //         $filePath.val("netstore/datasets/sp500.csv");

    //         var $grid;

    //         DSForm.__testOnly__.submitForm()
    //         .then(function() {
    //             expect(DS.has(testDS)).to.be.true;
    //             $grid = DS.getGridByName(testDS);
    //             expect($grid).not.to.be.null;

    //             var innerDeferred = jQuery.Deferred();
    //             // dealy delete ds since show the sample table needs time
    //             setTimeout(function() {
    //                 var dsObj = DS.getDSObj($grid.data("dsid"));
    //                 DS.__testOnly__.delDSHelper($grid, dsObj)
    //                 .then(innerDeferred.resolve)
    //                 .fail(innerDeferred.reject);
    //             }, 300);
    //             return innerDeferred.promise();
    //         })
    //         .then(function() {
    //             // make sure ds is deleted
    //             expect(DS.has(testDS)).to.be.false;
    //             $grid = DS.getGridByName(testDS);
    //             expect($grid).to.be.null;
    //             done();
    //         })
    //         .fail(function(error) {
    //             // Intentionally fail the test
    //             throw "Fail Case!";
    //         });
    //     });
    // });

    after(function() {
        $("#promoteHeaderCheckbox .checkbox").removeClass("checked");
    });
}
