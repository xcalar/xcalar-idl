describe("SQLOpPanel Test", function() {
    var sqlOpPanel;
    var $sqlOpPanel;
    var node;
    var sqlEditor;
    var prefix = "prefix";
    var openOptions = {};
    var parentNode;

    before(function(done) {
        MainMenu.openPanel("dagPanel");
        UnitTest.testFinish(() => DagPanel.hasSetup())
        .always(function() {
            node = new DagNodeSQL({});
            parentNode = new DagNodeSQL({});
            parentNode.getLineage = function() {
                return {getColumns: function() {
                    return [new ProgCol({
                        backName: xcHelper.getPrefixColName(prefix, 'average_stars'),
                        type: "number"
                    }), new ProgCol({
                        backName: xcHelper.getPrefixColName(prefix, 'stringCol'),
                        type: "string"
                    })]
                }}
            };
            node.getParents = function() {
                return [parentNode];
            }
            openOptions = {
                udfDisplayPathPrefix : UDFFileManager.Instance.getCurrWorkbookDisplayPath()
            };

            sqlOpPanel = SQLOpPanel.Instance;
            sqlEditor = sqlOpPanel.getSQLEditor();
            editor = sqlOpPanel._editor;
            $sqlOpPanel = $('#sqlOpPanel');
            done();
        });

    });

    describe("Basic SQL Panel UI Tests", function() {

        it ("Should be hidden at start", function () {
            sqlOpPanel.close();
            expect($('#sqlOpPanel').hasClass("xc-hidden")).to.be.true;
        });

        it ("Should be visible when show is called", function () {
            sqlOpPanel.show(node, openOptions);
            expect($('#sqlOpPanel').hasClass("xc-hidden")).to.be.false;
            if ($sqlOpPanel.find(".advancedEditor").is(":visible")) {
                $("#sqlOpPanel .bottomSection .xc-switch").click();
            }
        });

        it ("Should be hidden when close is called after showing", function () {
            sqlOpPanel.show(node, openOptions);
            sqlOpPanel.close();
            $('#formWaitingBG').remove();
            expect($('#sqlOpPanel').hasClass("xc-hidden")).to.be.true;
        });

        it ("Should be hidden when close is clicked", function () {
            sqlOpPanel.show(node, openOptions);
            $('#sqlOpPanel .close').click();
            $('#formWaitingBG').remove();
            expect($('#sqlOpPanel').hasClass("xc-hidden")).to.be.true;
        });
    });

    describe("SQL Panel Tests", function() {

        before(function () {
            sqlOpPanel.show(node, openOptions);
            $('#formWaitingBG').remove();
        });

        describe("initial state", function() {
            it("should have 0 identifier", function() {
                expect($sqlOpPanel.find("#sqlIdentifiers li").length).to.equal(0);
                expect($sqlOpPanel.find(".tableInstruction").is(":visible")).to.be.true;
            });
            it("drop as you go should be checked", function() {
                expect($sqlOpPanel.find(".dropAsYouGo .checkbox.checked").length).to.equal(1);
            });
            it("editor should be blank", function() {
                expect(sqlEditor.getValue()).to.equal(SQLOpPanel._udfDefault);
            });
        });

        describe("table mapping", function() {
            it("shoud have identifiers after connection changes", function() {
                node.connectToParent(parentNode, 0);
                expect($sqlOpPanel.find("#sqlIdentifiers li").length).to.equal(1);
                expect($("#sqlIdentifiers").find("li .source").text().trim()).to.equal("1");
                expect($("#sqlIdentifiers").find("li .dest").text().trim()).to.equal("");
                expect($sqlOpPanel.find(".tableInstruction").is(":visible")).to.be.false;
                node.disconnectFromParent(parentNode, 0);
                expect($sqlOpPanel.find("#sqlIdentifiers li").length).to.equal(0);
                expect($sqlOpPanel.find(".tableInstruction").is(":visible")).to.be.true;
            });
        });

        describe("resizing", function() {
            it("bottom section should expand and shrink", function() {
                expect($("#sqlIdentifiers").is(":visible")).to.be.true;
                $sqlOpPanel.find(".editorTitle .maximize").click();
                expect($("#sqlIdentifiers").is(":visible")).to.be.false;
                $sqlOpPanel.find(".editorTitle .maximize").click();
                expect($("#sqlIdentifiers").is(":visible")).to.be.true;
            });
        });
    });

    describe("submit", function() {
        it("should submit", function(done) {
            node.connectToParent(parentNode, 0);
            $("#sqlIdentifiers").find(".dest").val("test").trigger("change");
            sqlEditor.setValue("Select * FROM test");
            let called = false;
            node.compileSQL = () => {
                called = true;
                node.setXcQueryString("queryString");
                return PromiseHelper.resolve({newTableName: "newName", allCols: [], xcQueryString: "queryString", tableSrcMap: new Map()});
            };
            $sqlOpPanel.find(".submit").click();
            UnitTest.testFinish(()=> {
                return !$sqlOpPanel.is(":visible");
            })
            .then(() => {
                expect(called).to.be.true;
                expect(node.getIdentifiers().size).to.equal(1);
                expect(node.getIdentifiers().get(1)).to.equal("test");
                expect(node.xcQueryString).to.equal("queryString");
                expect(node.configured).to.be.true;
                expect(node.getParam().sqlQueryStr).to.equal("Select * FROM test");
                done();
            })
        });
    });

    describe("Advanced Mode related SQL Panel Tests", function() {
        it("Should show statusbox error if columns isnt a field", function() {
            sqlOpPanel.show(node, openOptions);
            $('#formWaitingBG').remove();
            if (!sqlOpPanel._isAdvancedMode()) {
                $("#sqlOpPanel .bottomSection .xc-switch").click();
            }
            editor.setValue(JSON.stringify({}, null, 4));
            $("#sqlOpPanel .bottomSection .btn-submit").click();
            expect($("#statusBox").hasClass("active")).to.be.true;
            UnitTest.hasStatusBoxWithError(" should have required property 'sqlQueryString'");
            sqlOpPanel.close();
        });

        it("should submit", function(done) {
            let struct = {
                "sqlQueryString": "Select * FROM a",
                "identifiers": {
                    "1": "a"
                },
                "identifiersOrder": [
                    1
                ],
                "dropAsYouGo": true
            };
            sqlOpPanel.show(node, openOptions);
            $('#formWaitingBG').remove();
            if (!sqlOpPanel._isAdvancedMode()) {
                $("#sqlOpPanel .bottomSection .xc-switch").click();
            }
            editor.setValue(JSON.stringify(struct, null, 4));
            $("#sqlOpPanel .bottomSection .btn-submit").click();
            expect($("#alertModal").is(":visible")).to.be.false;

            node.compileSQL = () => {
                return PromiseHelper.resolve({newTableName: "newName", allCols: [], xcQueryString: "queryString", tableSrcMap: new Map()});
            };

            UnitTest.testFinish(()=> {
                return !$sqlOpPanel.is(":visible");
            })
            .then(() => {
                expect(node.getIdentifiers().size).to.equal(1);
                expect(node.getIdentifiers().get(1)).to.equal("a");
                expect(node.configured).to.be.true;
                expect(node.getParam().sqlQueryStr).to.equal("Select * FROM a");
                done();
            })
        });
    });

    after(function() {
        sqlOpPanel.close();
    });
});
