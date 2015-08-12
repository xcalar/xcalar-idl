window.RightSideBar = (function($, RightSideBar) {
    var editor;
    
    RightSideBar.setup = function() {
        setupButtons();
        setuptableListSection();
        setupUDF();
        setupHelpSection();
        setupSQL();
        CLIBox.setup();
    };

    RightSideBar.initialize = function() {
        var activeTables = [];
        var hiddenTables = [];

        for (var tableId in gTables2) {
            var table = gTables2[tableId];
            if (table.active) {
                activeTables.push(table);
            } else {
                hiddenTables.push(table);
            }
        }

        RightSideBar.addTables(activeTables, IsActive.Active);
        RightSideBar.addTables(hiddenTables, IsActive.Inactive);

        generateOrphanList(gOrphanTables);
    };

    RightSideBar.addTables = function(tables, active) {
        // tables is an array of metaTables;
        generateTableLists(tables, active);

        if (!active) {
            $('#archivedTableList').find('.btnLarge').show();
        }
    };

    // move table to inactive list
    RightSideBar.moveTable = function(tableId) {
        var $tableList = $('#activeTablesList .tableInfo[data-id="' +
                            tableId + '"]');
        var $timeLine = $tableList.closest(".timeLine");
        var table = xcHelper.getTableFromId(tableId);

        RightSideBar.addTables([table], IsActive.Inactive);

        $tableList.find(".tableListBox")
                  .removeClass('active')
                  .next()
                  .slideUp(0)
                  .removeClass('open');

        $tableList.remove();

        // clear time line
        if ($timeLine.find(".tableInfo").length === 0) {
            $timeLine.remove();
        }
    };

    RightSideBar.renameTable = function(tableId, newTableName) {
        var $tableList = $('#activeTablesList .tableInfo[data-id="' +
                            tableId + '"]');
        $tableList.find(".tableName").text(newTableName);
    };

    RightSideBar.updateTableInfo = function(table) {
        var tableId    = table.tableId;
        var $tableList = $('#activeTablesList .tableInfo[data-id="' +
                            tableId + '"]');

        $tableList.remove();
        RightSideBar.addTables([table], IsActive.Active);
    };

    RightSideBar.tableBulkAction = function(action, type) {
        var deferred    = jQuery.Deferred();
        var validAction = ["add", "delete"];

        // validation check
        if (validAction.indexOf(action) < 0) {
            deferred.reject("Invalid action!");
            return (deferred.promise());
        }
        var $tableList;
        if (type === 'inactive') {
            $tableList = $('#archivedTableList');
        } else if (type === 'orphan') {
            $tableList = $('#orphanedTableList');
        }
        var $tablesSelected = $tableList.find(".addTableBtn.selected")
                                        .closest(".tableInfo");
        var $buttons = $tableList.find('.btnLarge');
        var promises = [];
        var failures = [];

        $buttons.addClass('btnInactive');

        $tablesSelected.each(function(index, ele) {
            promises.push((function() {
                var innerDeferred = jQuery.Deferred();
                var $li = $(ele);
                var tableId = $li.data("id");
                var table = xcHelper.getTableFromId(tableId);
                var tableName;

                if (table == null && type !== 'orphan') {
                    console.error("Error: do not find the table");
                    innerDeferred.reject();
                    return (innerDeferred.promise());
                }

                if (type === "orphan") {
                    tableName = $li.data("tablename");
                } else {
                    tableName = table.tableName;
                }

                if (action === "add") {
                    if (type === 'orphan') {
                        renameOrphanIfNeeded(tableName)
                        .then(function(newTableName) {
                            tableName = newTableName;
                            tableId = xcHelper.getTableId(tableName);
                            WSManager.addTable(tableId);
                            return (prepareOrphanForActive(tableName));
                        })
                        .then(function() {
                            doneHandler($li, tableName);
                            return (addTable(tableName, null,
                                    AfterStartup.After, null));
                        })
                        .then(function(){
                            var index = gOrphanTables.indexOf(tableName);
                            gOrphanTables.splice(index, 1);
                            innerDeferred.resolve();
                        })
                        .fail(function(error) {
                            WSManager.removeTable(tableId);
                            failHandler($li, tableName, error);
                            innerDeferred.resolve(error);
                        });
                    } else {
                        var lookupTable = gTables2[tableId];
                        lookupTable.active = true;
                        lookupTable.timeStamp = xcHelper.getTimeInMS();

                        // should release the old resultSetId and than add

                        XcalarSetFree(table.resultSetId)
                        .then(function() {
                            table.resultSetId = -1;
                            return (setTableMeta(tableName));
                        })
                        .then(function() {
                            return (addTable(tableName, null,
                                             AfterStartup.After, null));
                        })
                        .then(function() {
                            doneHandler($li, tableName);
                            innerDeferred.resolve();
                        })
                        .fail(function(error) {
                            failHandler($li, tableName, error);
                            innerDeferred.resolve(error);
                        });
                    }
                } else if (action === "delete") {
                    var sqlOptions = {
                        "operation": "deleteTable",
                        "tableName": tableName
                    };

                    if (type === 'orphan') {
                        XcalarDeleteTable(tableName, sqlOptions)
                        .then(function() {
                            doneHandler($li, tableName);
                            var index = gOrphanTables.indexOf(tableName);
                            gOrphanTables.splice(index, 1);
                            Dag.makeInactive(tableName, true);
                            innerDeferred.resolve();
                        })
                        .fail(function(error) {
                            failHandler($li, tableName, error);
                            innerDeferred.resolve(error);
                        });
                    } else {
                        deleteTable(tableId, DeleteTable.Delete, sqlOptions)
                        .then(function() {
                            doneHandler($li, tableName);
                            innerDeferred.resolve();
                        })
                        .fail(function(error) {
                            failHandler($li, tableName, error);
                            innerDeferred.resolve(error);
                        });
                    }
                }

                return (innerDeferred.promise());

            }).bind(this));
        });

        chain(promises)
        .then(function() {
            // anything faile to alert
            if (failures.length > 0) {
                deferred.reject(failures.join("\n"));
            } else {
                deferred.resolve();
            }
        });

        return (deferred.promise());

        function doneHandler($li, tableName) {
            var $timeLine = $li.closest(".timeLine");
            $li.remove();
            if ($timeLine.find('.tableInfo').length === 0) {
                $timeLine.remove();
                if ($tableList.find('.tableInfo').length === 0 ) {
                    if ($tableList.closest('#orphanedTableList').length !== 0) {
                        $tableList.find('.selectAll, .clearAll').hide();
                    } else {
                        $tableList.find('.secondButtonWrap').hide();
                    }
                    
                }
                
            }
            // add sql
            if (action === "add") {
                SQL.add('Send To Worksheet', {
                    "operation": "addTable",
                    "tableName": tableName
                });
            }
        }

        function failHandler($li, tableName, error) {
            $li.find(".addTableBtn.selected")
                            .removeClass("selected");
            failures.push(tableName + ": {" + error.error + "}");
        }
    };

    function renameOrphanIfNeeded(tableName) {
        var deferred = jQuery.Deferred();
        tableId = xcHelper.getTableId(tableName);
        var newTableName;
        if (!tableId) {
            newTableName = tableName + Authentication.fetchHashTag();
            var sqlOptions = {
                "operation": "renameTable",
                "oldName"  : tableName,
                "newName"  : newTableName
            };
            XcalarRenameTable(tableName, newTableName, sqlOptions)
            .then(function() {
                console.log('renamed')
                deferred.resolve(newTableName);
            })
            .fail(function(error) {
                deferred.reject(error);
            })
        } else {
            deferred.resolve(tableName);
        }

        return (deferred.promise());
    }
    

    function prepareOrphanForActive(tableName) {
        var deferred = jQuery.Deferred();

        XcalarMakeResultSetFromTable(tableName)
        .then(function(result) {
            var newTableCols = [];
            var colName = result.keyAttrHeader.name;
            var index = 1;
            if (colName !== 'recordNum') {
                var progCol = ColManager.newCol({
                            "index"   : 1,
                            "name"    : colName,
                            "width"   : gNewCellWidth,
                            "isNewCol": false,
                            "userStr" : '"' + colName + '" = pull(' +
                                        colName + ')',
                            "func": {
                                "func": "pull",
                                "args": [colName]
                            }
                        });

                newTableCols.push(progCol);
                index++;
            }
            // new "DATA" column
            newTableCols.push(ColManager.newDATACol(index));
            return (setgTable(tableName, newTableCols));
        })
        .then(function() {
            deferred.resolve();
        })
        .fail(function(error) {
            console.error(error);
            deferred.reject(error);
        });
        return (deferred.promise());
    }

    // setup buttons to open right side bar
    function setupButtons() {
        var delay             = 300;
        var clickable         = true;
        var $btnArea          = $("#rightSideBarBtns");
        var $sliderBtns       = $btnArea.find(".sliderBtn");
        var $rightSideBar     = $("#rightSideBar");
        var $rightBarSections = $rightSideBar.find(".rightBarSection");

        $btnArea.on("click", ".sliderBtn", function() {
            if (!clickable) {
                return;
            }

            var $sliderBtn = $(this);
            var index      = $sliderBtn.index();
            var $section   = $rightSideBar.find('.rightBarSection').eq(index);

            if (!$rightSideBar.hasClass("open") ||
                !$section.hasClass("active")) 
            {
                // right side bar is closed or
                // switch to this section
                $sliderBtns.removeClass("active");
                $sliderBtn.addClass("active");

                $rightBarSections.removeClass("active");
                $rightBarSections.removeClass("lastOpen");
                // mark the section and open the right side bar
                $section.addClass("active");
                $section.addClass("lastOpen");

                $rightSideBar.addClass("open");

                if ($section.attr("id") === "sqlSection") {
                    SQL.scrollToBottom($('#rightBarTextArea'));
                    $("#sqlButtonWrap").show();
                } else {
                    $("#sqlButtonWrap").hide();
                }
                if ($section.attr("id") === "cliSection") {
                    CLIBox.realignNl();
                }
            } else {
                // section is active, close right side bar
                if (!$rightSideBar.hasClass('poppedOut')) {
                    // disable closing if popped out
                    closeRightSidebar();
                }
                
            }

            delayClick();
        });

        $rightSideBar.on("click", ".iconClose", function() {
            if ($rightSideBar.hasClass('poppedOut')) {
                setTimeout(function() {
                    closeRightSidebar();
                }, 100);
            } else {
                closeRightSidebar();
            }
            popInModal($rightSideBar);
        });

        $rightSideBar.on("click", ".popOut", function() {
            if ($rightSideBar.hasClass('poppedOut')) {
                popInModal($rightSideBar);
            } else {
                popOutModal($rightSideBar);
            }
            
        });

        $rightSideBar.on("click", ".machineSQL", function() {
            $(this).removeClass("machineSQL");
            $(this).addClass("humanSQL");
            $("#rightBarMachineTextArea").hide();
            $("#rightBarTextArea").show();
        });

        $rightSideBar.on("click", ".humanSQL", function() {
            $(this).removeClass("humanSQL");
            $(this).addClass("machineSQL");
            $("#rightBarMachineTextArea").show();
            $("#rightBarTextArea").hide();
        });

        $rightSideBar.draggable({
            handle     : '.heading',
            containment: 'window',
            cursor     : '-webkit-grabbing'
        });

        $rightSideBar.resizable({
            handles    : "n, e, s, w, se",
            minHeight  : 500,
            minWidth   : 264,
            containment: "document"
        });

        $rightSideBar.on("resize", function() {
            CLIBox.realignNl();
        });

        $("#pulloutTab").click(function() {
            if (!clickable) {
                return;
            }

            var $section = $rightSideBar.children(".lastOpen");
            var index    = 0;

            if (!$rightSideBar.hasClass("open")) {
                if ($section.length === 0) {
                     // first time open right side bar
                    $section = $rightBarSections.eq(0);
                } else {
                    // open last opened section
                    index = $section.index();
                }

                $section.addClass("active")
                        .addClass("lastOpen");

                $sliderBtns.eq(index).addClass("active");

                $rightSideBar.addClass("open");
            } else {

                closeRightSidebar();
            }

            delayClick();
        });

        function delayClick() {
            clickable = false;

            setTimeout(function() {
                clickable = true;
            }, delay);
        }

        function closeRightSidebar() {
            $rightSideBar.removeClass("open");
            $sliderBtns.removeClass("active");
            // since close right side bar has slider animition,
            // delay the close of section
            setTimeout(function() {
                $rightBarSections.removeClass("active");
            }, delay);
        }
    }

    // setup table list section
    function setuptableListSection() {
        var $tabsSection       = $("#tableListSectionTabs");
        var $tableListSections = $("#tableListSections .tableListSection");
        var $selectBtns        = $('#archivedTableList .secondButtonWrap,' +
                                   '#orphanedTableList .secondButtonWrap');

        $tabsSection.on("click", ".tableListSectionTab", function() {
            var $tab  = $(this);
            var index = $(this).index();

            $tabsSection.find(".active").removeClass("active");
            $tab.addClass('active');

            $tableListSections.hide();
            $tableListSections.eq(index).show();
        });

        // toggle table list box
        $("#tableListSections").on("click", ".tableListBox", function() {
            var $box = $(this);
            var $ol  = $box.next();

            if ($ol.hasClass("open") && $box.hasClass("active")) {
                $box.removeClass("active");
                $ol.slideUp(200).removeClass("open");
            } else {
                if ($ol.children().length === 0) {
                    return;
                }
                $box.addClass("active");
                $ol.slideDown(200).addClass("open");
            }
        });

        $selectBtns.find('.selectAll').click(function() {
            var $tableListSection = $(this).closest('.tableListSection');
            var $listBtns = $tableListSection.find('.buttonWrap')
                                             .find('.btnLarge');
            $listBtns.removeClass('btnInactive');
            $tableListSection.find('.addTableBtn').addClass("selected");
        });

        $selectBtns.find('.clearAll').click(function() {
            var $tableListSection = $(this).closest('.tableListSection');
            var $listBtns = $tableListSection.find('.buttonWrap')
                                             .find('.btnLarge');
            $listBtns.addClass('btnInactive');
            $tableListSection.find('.addTableBtn').removeClass("selected");
        });

        $selectBtns.find('.refresh').click(function() {
            refreshOrphanList();
        });

        $("#inactiveTablesList, #orphanedTablesList").on("click",
                                                    ".addTableBtn", function() {
            var $btn = $(this);

            $btn.toggleClass("selected");
            var $tableListSection = $btn.closest('.tableListSection');
            var $listBtns = $tableListSection.find('.buttonWrap')
                                             .find('.btnLarge');

            if ($tableListSection.find(".addTableBtn.selected").length === 0) {
                $listBtns.addClass('btnInactive');
            } else {
                $listBtns.removeClass('btnInactive');
            }
            // stop propogation
            return false;
        });

        $("#submitTablesBtn").click(function() {
            addBulkTableHelper();
        });

        $('#submitOrphanedTablesBtn').click(function() {
            addBulkTable('orphan');
        });

        $("#deleteTablesBtn, #deleteOrphanedTablesBtn").click(function() {
            var type;
            if ($(this).is('#deleteTablesBtn')) {
                type = "inactive";
            } else {
                type = "orphan";
            }
            Alert.show({
                "title": "DELETE " + type + " TABLES",
                "msg"  : "Are you sure you want to delete the " +
                         "selected tables?",
                "isCheckBox": true,
                "confirm"   : function() {
                    RightSideBar.tableBulkAction("delete", type)
                    .then(function() {
                        commitToStorage();
                    })
                    .fail(function(error) {
                        Alert.error("Delete Table Fails", error);
                    });
                }
            });
        });
    }

    // setup UDF section
    RightSideBar.getEditor = function() {
        return (editor);
    };

    function setupUDF() {
        
        var textArea = document.getElementById("udf-codeArea");
        editor = CodeMirror.fromTextArea(textArea, {
            "mode": {
                "name"                  : "python",
                "version"               : 3,
                "singleLineStringErrors": false
            },
            "lineNumbers"  : true,
            "indentUnit"   : 4,
            "matchBrackets": true
        });

        /* switch between UDF sections */
        var $sections = $("#udfSection .mainSection");
        var $radios   = $("#udf-tabs .select-item .radio");

        $("#udf-tabs").on("click", ".select-item", function() {
            var $option = $(this);
            var tabId = $option.data("tab");

            $radios.removeClass("checked");
            $option.find(".radio").addClass("checked");

            $sections.addClass("hidden");
            $("#" + tabId).removeClass("hidden");

            if (tabId === "udf-fnSection") {
                editor.refresh();
            }
        });
        /* end of switch between UDF sections */

        /* upload file section */
        var $inputFile = $("#udf-fileBrowser");
        var $filePath  = $("#udf-filePath");
        // browser file
        $("#udf-browseBtn").click(function() {
            $inputFile.click();
            return false;
        });
        // display the chosen file's path
        $inputFile.change(function() {
            $filePath.val($(this).val().replace(/C:\\fakepath\\/i, ''));
        });
        // clear file path
        $("#udf-clearPath").click(function() {
            $inputFile.val("");
            $filePath.val("");
            $filePath.focus();
        });
        // upload file
        $("#udf-fileUpload").click(function() {
            var file = $inputFile[0].files[0];
            var path = file.name;
            var moduleName = path.substring(0, path.indexOf("."));
            var $submitBtn = $(this);
            if (path === "") {
                var text = "File Path is empty," +
                           " please choose a file you want to upload";

                StatusBox.show(text, $filePath, true, 150);
            } else {
                var reader = new FileReader();
                reader.onload = function(event) {
                    xcHelper.disableSubmit($submitBtn);
                    // XXX: Change cursor, handle failure
                    XcalarUploadPython(moduleName, event.target.result)
                    .then(function() {
                        // clearance
                        $inputFile.val("");
                        $filePath.val("");
                        commitToStorage();
                        uploadSuccess();
                    })
                    .always(function() {
                        xcHelper.enableSubmit($submitBtn);
                    });
                };

                reader.readAsText(file);
            }
        });
        /* end of upload file section */

        /* function input section */
        var $listSection   = $("#udf-fnList");
        var $listDropdown  = $("#udf-fnMenu");
        var $template      = $("#udf-fnTemplate");
        var $downloadBtn   = $("#udf-fnDownload");

        $("#udfSection .rightBarContent").click(function(event) {
            event.stopPropagation();

            $listSection.removeClass('open');
            $listDropdown.hide();
        });
        // open drowdown menu
        $listSection.on("click", function(event) {
            event.stopPropagation();

            $listSection.toggleClass("open");
            $listDropdown.toggle();
        });
        // select one option
        $listSection.on("click", ".list li", function(event) {
            var $li = $(this);

            event.stopPropagation();

            $listSection.removeClass('open');
            $listDropdown.hide();

            $template.val($li.text());

            if ($li.attr("name") === "blank") {
                $downloadBtn.addClass("hidden");
            } else {
                $downloadBtn.removeClass("hidden");
            }
        });
        /* end of function input section */

        /* upload written function section */
        var $fnName = $("#udf-fnName");

        $("#udf-fnUpload").click(function() {
            var fileName = $fnName.val();

            if (fileName === "") {
                var text = "Module name is empty, please input a module name!";

                StatusBox.show(text, $fnName, true, 50);
                return;
            }
            
            // Get code written and call thrift call to upload
            var entireString = editor.getValue();
            if (entireString.trim() === "") {
                var text = "Function field is empty, please input a function.";
                StatusBox.show(text, $('.CodeMirror'), false, 30,
                               {side: 'left'});
                return;
            }

            var moduleName;
            if (fileName.indexOf(".") >= 0) {
                moduleName = fileName.substring(0, fileName.indexOf("."));
            } else {
                moduleName = fileName;
            }

            // XXX: Change cursor, handle failure
            XcalarUploadPython(moduleName, entireString)
            .then(function() {
                // clearance
                $fnName.val("");
                $template.val("");
                $downloadBtn.addClass("hidden");
                commitToStorage();
                uploadSuccess();
            })
            .fail(function(error) {
                var title = "Error";
                if (error.status === 301) {
                    // XX might not actually be a syntax error
                    title = "Syntax Error";
                }
                
                Alert.error(title, error);
            });
        });
        /* end of upload written function section */

        multiJoinUDFUpload();
    }

    function multiJoinUDFUpload() {
        var moduleName = "multiJoinModule";
        var entireString =
            'def multiJoin(*arg):\n' +
                '\tstri = ""\n' +
                '\tfor a in arg:\n' +
                    '\t\tstri = stri + str(a) + ".Xc."\n' +
                '\treturn stri\n';
        XcalarUploadPython(moduleName, entireString);
    }

    function uploadSuccess() {
        var alertOptions = {};
        alertOptions.title = "UPLOAD SUCCESS";
        alertOptions.msg = "Your python script has been successfully uploaded!";
        alertOptions.isCheckBox = false;
        alertOptions.confirm = function() {
            $("#udfBtn").parent().click();
        };
        Alert.show(alertOptions);
    }

    function setupSQL() {
        $("#rightBarMachineTextArea").hide();
    }

    // XXX Current it works as a reset button
    function setupHelpSection() {
        // XXX !!! landmine section to restart node
        $("#helpSubmit").click(function() {
            console.info('Reset Fired!');
            emptyAllStorage()
            .then(function() {
                console.info("Shut Down Successfully!");
                return (XcalarStartNodes(2));
            }, function(error) {
                console.error("Failed to write! Commencing shutdown", error);
                return (XcalarStartNodes(2));
            })
            .then(function() {
                console.info("Restart Successfully!");
                // refresh page
                location.reload();
            });
        });

        // Toggleing helper tooltips
        $('#helpOnOff').click(function() {
            toggleRefresh($(this));
        });

        function toggleRefresh($target) {
            if ($target.hasClass('off')) {
                $('#helpOnOff').removeClass('off');
                Tips.display();
            } else {
                $('#helpOnOff').addClass('off');
                Tips.destroy();
            }
        }
    }

    function addBulkTableHelper() {
        var $tables = $("#inactiveTablesList").find(".addTableBtn.selected")
                                              .closest(".tableInfo");
        // var $sheetTables = $tables.filter(function() {
        //     return !$(this).find(".worksheetInfo").hasClass("inactive");
        // });

        // $sheetTables.each(function() {
        //     var tableId = $(this).data("id");
        //     WSManager.activeTable(tableId);
        // });

        var $noSheetTables = $tables.filter(function() {
            return $(this).find(".worksheetInfo").hasClass("inactive");
        });

        if ($noSheetTables.length > 0) {
            var instr = "You have tables that are not in any worksheet," +
                        " please choose a worksheet to send for those tables!";

            $noSheetTables.addClass("highlight");
            // must get highlight class  from source
            var $clone = $("#rightSideBar").clone();

            $clone.addClass("faux");
            $("#modalBackground").after($clone);

            $clone.css({"z-index": "initial"});

            Alert.show({
                "title"  : "SEND TO WORKSHEET",
                "instr"  : instr,
                "optList": {
                    "label": "Worksheet to send:",
                    "list" : WSManager.getWSLists(true)
                },
                "confirm": function() {
                    $noSheetTables.removeClass("highlight");
                    $("#rightSideBar.faux").remove();

                    var wsName  = Alert.getOptionVal();
                    var wsIndex = WSManager.getWSByName(wsName);

                    if (wsIndex == null) {
                        Alert.error("Invalid worksheet name",
                                    "please input a valid name!");
                    } else {
                        $noSheetTables.each(function() {
                            var tableId = $(this).data("id");
                            WSManager.rmNoSheetTable(tableId);
                            WSManager.addTable(tableId, wsIndex);
                        });

                        addBulkTable('inactive');
                    }
                },
                "cancel": function() {
                    $noSheetTables.removeClass("highlight");
                    $("#rightSideBar.faux").remove();
                }
            });

        } else {
            addBulkTable('inactive');
        }
    }

    function addBulkTable(type) {
        RightSideBar.tableBulkAction("add", type)
        .then(function() {
            if (!$("#workspaceTab").hasClass("active")) {
                $("#workspaceTab").click();
            }
            WSManager.focusOnLastTable();
            commitToStorage();
        })
        .fail(function(error) {
            var tableType;
            if (type === 'inactive') {
                tableType = 'Archived';
            } else if (type === 'orphan') {
                tableType = 'Orphaned';
            }
            Alert.error("Error In Adding " + tableType + " Table", error);
        });
    }

    function generateTableLists(tables, active) {
        var sortedTables = sortTableByTime(tables); // from oldest to newest
        
        var dates = xcHelper.getTwoWeeksDate();
        var p     = dates.length - 1;    // the length should be 8
        var days  = ["Sunday", "Monday", "Tuesday", "Wednesday",
                     "Thursday", "Friday", "Saturday"];

        var $tableList = (active === true) ? $("#activeTablesList") :
                                             $("#inactiveTablesList");

        for (var i = 0; i < sortedTables.length; i++) {
            var table     = sortedTables[i][0];
            var timeStamp = sortedTables[i][1];

            // pointer to a day after at 0:00 am
            while (p >= 0 && (timeStamp >= dates[p].getTime())) {
                --p;
            }

            var dateIndex = p + 1;

            // when no such date exists
            if ($tableList.find("> li.date" + p).length === 0) {
                var date = "";
                var d;

                switch (dateIndex) {
                    case 0:
                        d = dates[dateIndex];
                        date = "Today " + xcHelper.getDate("/", d);
                        break;
                    case 1:
                        d = dates[dateIndex];
                        date = "Yesterday " + xcHelper.getDate("/", d);
                        break;
                    // Other days in the week
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        d = dates[dateIndex];
                        date = days[d.getDay()] + " " +
                               xcHelper.getDate("/", d);
                        break;
                    case 7:
                        date = "Last week";
                        break;
                    case 8:
                        date = "Older";
                        break;
                    default:
                        break;
                }

                var timeLineHTML =
                    '<li class="clearfix timeLine date' + p + '">' +
                        '<div class="timeStamp">' + date + '</div>' +
                        '<ul class="tableList"></ul>' +
                    '</li>';

                $tableList.prepend(timeLineHTML);
            }

            var $dateDivider = $tableList.find(".date" + p + " .tableList");
            var numCols;
            if (table.tableCols) {
                numCols = table.tableCols.length;
            } else {
                numCols = 0;
            }
            var time;

            if (dateIndex >= 7) {
                time = xcHelper.getDate("-", null, timeStamp);
            } else {
                time = xcHelper.getTime(null, timeStamp);
            }

            var tableName = table.tableName;
            var tableId   = table.tableId;
            var wsIndex   = WSManager.getWSFromTable(tableId);
            var wsInfo;

            if (wsIndex == null) {
                wsInfo = '<div class="worksheetInfo inactive">No sheet</div>';
            } else {
                wsInfo =
                    '<div class="worksheetInfo worksheet-' + wsIndex + '">' +
                        WSManager.getWSName(wsIndex) +
                    '</div>';
            }

            var html =
                '<li class="clearfix tableInfo" ' +
                    'data-id="' + tableId + '">' +
                    '<div class="timeStampWrap">' +
                        '<div class="timeStamp">' +
                            '<span class="time">' + time + '</span>' +
                        '</div>' +
                        wsInfo +
                    '</div>' +
                    '<div class="tableListBox">' +
                        '<div class="iconWrap">' +
                            '<span class="icon"></span>' +
                        '</div>' +
                        '<span class="tableName">' + tableName + '</span>' +
                        '<span class="addTableBtn"></span>' +
                        '<span class="numCols">' + numCols + '</span>' +
                    '</div>' +
                    '<ol>';

            for (var j = 0; j < numCols; j++) {
                // if (table.tableCols[j].name != 'DATA') {
                html += '<li>' + table.tableCols[j].name + '</li>';
                // }
            }

            html += '</ol></li>';

            $dateDivider.prepend(html);
            if ($('#archivedTableList').find('.tableInfo').length !== 0) {
                $('#archivedTableList .secondButtonWrap').show();
            }
        }
    }

    function generateOrphanList(tables) {
        var numTables = tables.length;
        var html = "";
        for (var i = 0; i < numTables; i++) {
            var tableName = tables[i];
            var tableId   = xcHelper.getTableId(tableName);
            html += '<li class="clearfix tableInfo" ' +
                     'data-id="' + tableId + '"' +
                     'data-tablename="' + tableName + '">' +
                        '<div class="tableListBox">' +
                            '<div class="iconWrap">' +
                                '<span class="icon"></span>' +
                            '</div>' +
                            '<span class="tableName">' + tableName + '</span>' +
                            '<span class="addTableBtn"></span>' +
                        '</div>' +
                     '</li>';
        }
        var $orphanedTableList = $('#orphanedTableList');
        $('#orphanedTablesList').html(html);
        if (numTables > 0) {
            $orphanedTableList.find('.btnLarge').show();
            $orphanedTableList.find('.selectAll, .clearAll').show();
        }
        $orphanedTableList.find('.secondButtonWrap').show();
    }

    function refreshOrphanList() {
        XcalarGetTables()
        .then(function(backEndTables) {
            var backTables = backEndTables.tables;
            var numBackTables = backTables.length;
            var tableMap = {};
            for (var i = 0; i < numBackTables; i++) {
                tableMap[backTables[i].tableName] = backTables[i];
            }
            for (var tId in gTables2) {
                var tableName = gTables2[tId].tableName;
                if (tableMap[tableName]) {
                    delete tableMap[tableName];
                }
            }
            setupOrphanedList(tableMap);
            setTimeout(function() {
                generateOrphanList(gOrphanTables);
            }, 400);
            
            var $waitingIcon = $('<div class="waitingIcon" ' +
                              'style="top:50%; width:100%; display:block;' +
                              'background-position-x: 50%"></div>');
            $('#orphanedTableList').append($waitingIcon);
            setTimeout(function(){
                $waitingIcon.fadeOut(100, function() {
                    $waitingIcon.remove();
                });
            }, 1400);
        });
    }

    function sortTableByTime(tables) {
        var sortedTables = [];

        tables.forEach(function(table) {
            var tableId = table.tableId;
            var timeStamp;
            if (gTables2[tableId]) {
                timeStamp = gTables2[tableId].timeStamp;
            }
            if (timeStamp == null) {
                console.error("Time Stamp undefined");
                timeStamp = xcHelper.getTimeInMS(null, "2014-02-14");
                timeStamp = "";
            }

            sortedTables.push([table, timeStamp]);
        });

        // sort by time, from the oldest to newset
        sortedTables.sort(function(a, b) {
            return (a[1] - b[1]);
        });

        return (sortedTables);
    }

    function popOutModal($rightSideBar) {
        $rightSideBar.addClass('poppedOut');
        $('#rightSideBarBtns').appendTo($rightSideBar);
        $rightSideBar.find('.popOut')
                     .attr('data-original-title', 'pop back in');
        $('.tooltip').hide();

    }

    function popInModal($rightSideBar) {
        $rightSideBar.removeClass('poppedOut');
        $('#rightSideBarBtns').appendTo('#worksheetBar');
        $rightSideBar.attr('style', "");
        $rightSideBar.find('.popOut')
                     .attr('data-original-title', 'pop out');
        $('.tooltip').hide();
        CLIBox.realignNl();
    }

    return (RightSideBar);
}(jQuery, {}));

window.HelpController = (function($, HelpController){

    HelpController.tooltipOff = function() {
        $('body').addClass('tooltipOff');
        $('#helpOnOff').addClass('off');
    };

    HelpController.tooltipOn = function() {
        $('body').removeClass('tooltipOff');
        $('#helpOnOff').removeClass('off');
    };

    HelpController.isOff = function() {
        return ($('body').hasClass('tooltipOff'));
    };

    return (HelpController);

}(jQuery, {}));
