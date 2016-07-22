/*
    This file is where all the document.ready functions go.
    Any misc functions that kind of applies to the
    entire page and doesn't really have any specific purpose should come here as
    well.
*/
// ================================ Misc ======================================
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') +
                 1).split('&');
    if (window.location.href.indexOf("?") < 0) {
        return [];
    }

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function unloadHandler(isAsync, doNotLogout) {
    if (isAsync) {
        // async unload should only be called in beforeload
        // this time, no commit, only free result set
        // as commit may only partially finished, which is dangerous
        freeAllResultSets();
    } else {
        freeAllResultSetsSync()
        .then(function() {
            return Support.releaseSession();
        })
        .fail(function(error) {
            console.error(error);
        })
        .always(function() {
            removeUnloadPrompt();
            if (doNotLogout) {
                window.location = paths.index;
            } else {
                sessionStorage.setItem("xcalar-username", "");
                window.location = paths.dologout;
            }
        });
    }
}

function removeUnloadPrompt() {
    window.onbeforeunload = function() {}; // Do not enable prompt
    window.onunload = function() {}; // do not call unload again
}

function xcDrag(event) {
    event.dataTransfer.setData("text", $(event.target).text());
}

function setupOrphanedList(tableMap) {
    var tables = [];
    for (var table in tableMap) {
        tables.push(table);
    }
    gOrphanTables = tables;
}
// ========================== Document Ready ==================================
function documentReadyIndexFunction() {
    $(document).ready(StartManager.setup);
}

window.StartManager = (function(StartManager, $) {
    var setupStatus = SetupStatus.Setup;

    StartManager.setup = function() {
        // use promise for better unit test
        var deferred = jQuery.Deferred();
        gMinModeOn = true; // startup use min mode;
        $("body").addClass("xc-setup");

        setupLogout();
        Compatible.check();
        setupThrift();
        // Support.setup() get username, so need to be at very eary time
        Support.setup();

        setupTooltips();
        setupMenuBar();
        StatusMessage.setup();
        RightSideBar.setup();
        DataStore.setup();
        TblMenu.setup();
        WSManager.setup();
        MonitorPanel.setup();
        DagPanel.setup();
        DFGPanel.setup();
        setupModals();

        XVM.checkVersionMatch()
        .then(setupSession)
        .then(function() {
            documentReadyGeneralFunction();
            RightSideBar.initialize();
            WorkbookModal.initialize();
            // restore user settings
            JoinModal.restore();
            FileBrowser.restore();

            setupExtensions();
            WSManager.focusOnWorksheet();
        })
        .then(function() {
            if (!isBrowseFireFox) {
                gMinModeOn = false; // turn off min mode
            }

            setupStatus = SetupStatus.Success;

            console.log('%c ' + CommonTxtTstr.XcWelcome + ' ',
            'background: linear-gradient(to bottom, #378cb3, #5cb2e8); ' +
            'color: #ffffff; font-size:18px; font-family:Open Sans, Arial;');

            XVM.commitVersionInfo();
            // start heartbeat check
            Support.heartbeatCheck();
            deferred.resolve();
        })
        .fail(function(error) {
            setupStatus = SetupStatus.Fail;
            if (error === WKBKTStr.NoWkbk){
                // when it's new workbook
                $('#initialLoadScreen').remove();
                WorkbookModal.forceShow();
                var text = StatusMessageTStr.Viewing + " " + WKBKTStr.Location;
                StatusMessage.updateLocation(true, text);
            } else if (error === WKBKTStr.Hold) {
                // when seesion is hold by others
                Alert.show({
                    "title"  : WKBKTStr.Hold,
                    "msg"    : WKBKTStr.HoldMsg,
                    "buttons": [
                        {
                            "name"     : WKBKTStr.Release,
                            "className": "cancel",
                            "func"     : function() {
                                Support.forceReleaseSession();
                            }
                        }
                    ],
                    "noCancel": true
                });
            } else if (error.status === StatusT.StatusSessionNotFound) {
                Alert.show({
                    "title"     : WKBKTStr.NoOldWKBK,
                    "instr"     : WKBKTStr.NoOldWKBKInstr,
                    "msg"       : WKBKTStr.NoOldWKBKMsg,
                    "lockScreen": true,
                    "logout"    : true,
                    "buttons"   : [{
                        "name": WKBKTStr.NewWKBK,
                        "func": function() {
                            WKBKManager.inActiveAllWKBK();
                        }
                    }],
                    "hideButtons": ['copySql']
                });
            } else {
                // when it's an error from backend we cannot handle
                var title;
                if (error.error != null && error.error.indexOf('Update required') !== -1) {
                    title = ThriftTStr.UpdateErr;
                } else if (error.error != null && error.error.indexOf('Connection') !== -1) {
                    title = ThriftTStr.CCNBEErr;
                } else {
                    title = ThriftTStr.SetupErr;
                }
                Alert.error(title, error, {"lockScreen": true});
                StatusMessage.updateLocation(true, StatusMessageTStr.Error);
            }

            deferred.reject(error);
        })
        .always(function() {
            $("body").removeClass("xc-setup");

            if (!gMinModeOn) {
                $("#initialLoadScreen").fadeOut(200, function() {
                    $("#initialLoadScreen").remove();
                    RowScroller.genFirstVisibleRowNum();
                });
            } else {
                $("#initialLoadScreen").remove();
                RowScroller.genFirstVisibleRowNum();
            }
        });

        return deferred.promise();
    };

    StartManager.getStatus = function() {
        return setupStatus;
    };

    function setupSession() {
        var deferred = jQuery.Deferred();

        WKBKManager.setup()
        .then(Support.holdSession)
        .then(Authentication.setup)
        .then(KVStore.restore)
        .then(initializeTable)
        .then(deferred.resolve)
        .fail(deferred.reject);

        return deferred.promise();
    }

    function setupExtensions() {
        try {
            ExtensionManager.setup();
            ExtensionPanel.setup();
        } catch (error) {
            console.error(error);
            Alert.error(ThriftTStr.SetupErr, error);
        }
    }

    // excludes alert modal wish is set up earlier
    function setupModals() {
        Alert.setup();
        JSONModal.setup();
        FileBrowser.setup();
        Profile.setup();
        ExportModal.setup();
        JoinModal.setup();
        AggModal.setup();
        OperationsModal.setup();
        WorkbookModal.setup();
        DataFlowModal.setup();
        DFGParamModal.setup();
        AddScheduleModal.setup();
        MultiCastModal.setup();
        DeleteTableModal.setup();
        ExtensionInfoModal.setup();
        ExtensionOpModal.setup();
        ExtModal.setup();
    }

    function setupLogout() {
        var username = sessionStorage.getItem("xcalar-fullUsername");
        if (username == null) {
            username = sessionStorage.getItem("xcalar-username");
        }

        $("#userName").text(username);

        $("#signout").click(function() {
            unloadHandler();
        });
    }

    function setupTooltips() {
        $("body").tooltip({
            "selector": '[data-toggle="tooltip"]',
            "html"    : true,
            "delay"   : {
                "show": 250,
                "hide": 100
            }
        });

        $("body").on("mouseenter", '[data-toggle="tooltip"]', function() {
            $(".tooltip").hide();
        });
    }

    function setupMenuBar() {
        RowScroller.setup();
        setupMainPanelsTab();
        FnBar.setup();
    }

    function setupMainPanelsTab() {
        var $tabs = $(".mainMenuTab");

        $tabs.click(function() {
            var $curTab = $(this);

            if ($curTab.hasClass("active")) {
                return;
            }
            var $lastActiveTab = $tabs.filter(".active");
            var lastTabId = $lastActiveTab.attr("id");
            $lastActiveTab.addClass('noTransition')
                          .find('.icon')
                          .addClass('noTransition');
            // we dont want transition when active tab goes to inactive
            setTimeout(function() {
                $tabs.removeClass('noTransition')
                     .find('.icon')
                     .removeClass('noTransition');
            }, 100);

            $tabs.removeClass("active");
            $('.mainPanel').removeClass('active');
            $curTab.addClass("active");

            var curTab = $curTab.attr("id");
            switch (curTab) {
                case ("workspaceTab"):
                    $("#workspacePanel").addClass("active");
                    WSManager.focusOnWorksheet();
                    break;
                case ("schedulerTab"):
                    $('#schedulerPanel').addClass("active");
                    break;
                case ("dataStoresTab"):
                    $("#datastorePanel").addClass("active");
                    DSTable.refresh();
                    DSCart.checkQueries();
                    if ($curTab.hasClass("firstTouch")) {
                        $curTab.removeClass("firstTouch");
                        DS.setupView();
                        DSForm.initialize();
                        // relese the old ref count if any
                        DS.release();
                    }
                    break;
                case ("monitorTab"):
                    $('#monitorPanel').addClass("active");
                    MonitorPanel.active();
                    break;
                case ("extensionTab"):
                    $('#extensionPanel').addClass("active");
                    ExtensionPanel.active();
                    break;
                default:
                    $(".underConstruction").addClass("active");
            }
            if (curTab !== "dataStoresTab") {
                // when switch to other tab, release result set
                DS.release();
            }

            if (lastTabId === "monitorTab") {
                MonitorPanel.inActive();
            } else if (lastTabId === "dataStoresTab") {
                DSCart.checkQueries();
            }
            if (lastTabId === "workspaceTab") {
                var $activeCompSwitch = $('.dagTab.active');
                if ($activeCompSwitch.length) {
                    $activeCompSwitch.attr('data-original-title',
                                            TooltipTStr.OpenQG);
                }
            }
            StatusMessage.updateLocation();
            $('.tableDonePopupWrap').remove();
        });
    }

    function restoreActiveTable(tableId, failures) {
        var deferred = jQuery.Deferred();
        var table = gTables[tableId];
        var passedUpdateResultSet = false;

        table.beActive();

        table.updateResultset()
        .then(function() {
            passedUpdateResultSet = true;
            return TblManager.parallelConstruct(tableId);
        })
        .then(deferred.resolve)
        .fail(function(error) {
            failures.push("Add table " + table.getName() +
                        "fails: " + error.error);
            if (!passedUpdateResultSet) {
                table.beOrphaned();
                WSManager.removeTable(tableId);
            }
            // still resolve but push error failures
            deferred.resolve();
        });

        return deferred.promise();
    }

    function initializeTable() {
        var deferred = jQuery.Deferred();

        StatusMessage.updateLocation(true, StatusMessageTStr.LoadingTables);

        xcHelper.getBackTableSet()
        .then(function(backTableSet) {
            var tableId;
            var tableName;

            // check if some table has front meta but not backend info
            // if yes, delete front meta
            for (tableId in gTables) {
                tableName = gTables[tableId].tableName;
                if (!backTableSet.hasOwnProperty(tableName)) {
                    console.warn(tableName, "is not in backend");
                    delete gTables[tableId];
                }
            }

            var hasTable = false;
            var promises = [];
            var failures = [];

            var ws;
            var wsId;
            var worksheets = WSManager.getWorksheets();
            var wsOrder = WSManager.getOrders();
            var numWorksheets = wsOrder.length; // counts only active worksheets

            for (var i = 0; i < numWorksheets; i++) {
                wsId = wsOrder[i];
                ws = worksheets[wsId];

                var wsTables = ws.tables;
                var numWsTables = wsTables.length;

                if (!hasTable && numWsTables > 0) {
                    hasTable = true;
                }

                // create active table
                for (var j = 0; j < numWsTables; j++) {
                    tableId = wsTables[j];

                    if (!checkIfTableHasMeta(tableId, backTableSet)) {
                        continue;
                    }

                    promises.push(restoreActiveTable.bind(this, tableId, failures));
                }

                // create archived tables
                var wsArchivedTables = ws.archivedTables;
                var numArchivedWsTables = wsArchivedTables.length;
                for (var j = 0; j < numArchivedWsTables; j++) {
                    tableId = wsArchivedTables[j];

                    if (!checkIfTableHasMeta(tableId, backTableSet)) {
                        continue;
                    }

                    gTables[tableId].beArchived();
                }
            }

            // create no worksheet tables
            var noSheetTables = WSManager.getNoSheetTables();
            var numNoSheetTables = noSheetTables.length;

            for (var i = 0; i < numNoSheetTables; i++) {
                tableId = noSheetTables[i];

                if (!checkIfTableHasMeta(tableId, backTableSet, true)) {
                    continue;
                }

                gTables[tableId].beArchived();
            }

            // set up tables in hidden worksheets
            var hiddenWorksheets = WSManager.getHiddenWS();
            var numHiddenWsTables = hiddenWorksheets.length;
            var numTables;
            var numArchivedTables;

            for (var i = 0; i < numHiddenWsTables; i++) {
                wsId = hiddenWorksheets[i];
                ws = worksheets[wsId];
                numTables = ws.tempHiddenTables.length;

                for (var j = 0; j < numTables; j++) {
                    tableId = ws.tempHiddenTables[j];
                    checkIfTableHasMeta(tableId, backTableSet);
                }

                numArchivedTables = ws.archivedTables.length;

                for (var j = 0; j < numArchivedTables; j++) {
                    tableId = ws.archivedTables[j];
                    checkIfTableHasMeta(tableId, backTableSet);
                }
            }

            // setup leftover tables
            setupOrphanedList(backTableSet);

            PromiseHelper.chain(promises)
            .then(function() {
                if (hasTable) {
                    RowScroller.resize();
                } else {
                    $('#mainFrame').addClass('empty');
                }
                StatusMessage.updateLocation();

                if (failures.length > 0) {
                    for (var c = 0; c < failures.length; c++) {
                        console.error(failures[c]);
                    }
                }

                deferred.resolve();
            })
            .fail(deferred.reject);
        })
        .fail(function(error) {
            console.error("InitializeTable fails!", error);
            deferred.reject(error);
        });

        function checkIfTableHasMeta(tableId, backTableSet, isNoSheetTable) {
            var curTable = gTables[tableId];

            if (curTable == null) {
                if (isNoSheetTable) {
                    // this case is fine since some are in agg table list
                    console.info("not find table", tableId);
                } else {
                    WSManager.removeTable(tableId);
                    console.error("not find table", tableId);
                }

                return false;
            } else {
                delete backTableSet[curTable.getName()];
                return true;
            }
        }

        return deferred.promise();
    }

    function documentReadyGeneralFunction() {
        var $rowInput = $("#rowInput");
        var backspaceIsPressed = false;

        $(document).keydown(function(event){
            var isPreventEvent;

            switch (event.which) {
                case keyCode.Backspace:
                    backspaceIsPressed = true;
                    break;
                case keyCode.PageUp:
                    isPreventEvent = tableScroll("pageUpdown", true);
                    break;
                case keyCode.Space:
                case keyCode.PageDown:
                    isPreventEvent = tableScroll("pageUpdown", false);
                    break;
                case keyCode.Up:
                    isPreventEvent = tableScroll("updown", true);
                    break;
                case keyCode.Down:
                    isPreventEvent = tableScroll("updown", false);
                    break;
                case keyCode.Home:
                    isPreventEvent = tableScroll("homeEnd", true);
                    break;
                case keyCode.End:
                    isPreventEvent = tableScroll("homeEnd", false);
                    break;
                case keyCode.Y:
                case keyCode.Z:
                    checkUndoRedo(event);
                    break;
                default:
                    break;
            }

            if (isPreventEvent) {
                event.preventDefault();
            }
        });

        $(document).keyup(function(event) {
            if (event.which === keyCode.Backspace) {
                backspaceIsPressed = false;
            }
        });

        $("#autoSaveBtn").click(function() {
            var $btn = $(this);
            xcHelper.disableSubmit($btn);

            KVStore.commit()
            .then(function() {
                xcHelper.showSuccess();
            })
            .fail(function(error) {
                Alert.error(AlertTStr.Error, error);
            })
            .always(function() {
                xcHelper.enableSubmit($btn);
            });
        });

        window.onbeforeunload = function() {
            unloadHandler(true);
            if (SQL.hasUnCommitChange()) {
                return CommonTxtTstr.LogoutWarn;
            } else if (backspaceIsPressed) {
                // when no commit change but may caused by backSapce
                backspaceIsPressed = false; // reset
                return CommonTxtTstr.LeaveWarn;
            } else {
                // when no change, no need to warn
                return null;
            }
        };

        var winResizeTimer;
        var resizing = false;
        var otherResize = false; // true if winresize is triggered by 3rd party code
        $(window).resize(function(event) {
            if (!resizing) {
                $('.menu').hide();
                $('#dagScrollBarWrap').hide();
                resizing = true;
            }

            if (event.target !== window) {
                otherResize = true;
            } else {
                otherResize = false;
                moveTableTitles();
            }
            clearTimeout(winResizeTimer);
            winResizeTimer = setTimeout(winResizeStop, 100);
        });

        function winResizeStop() {
            if (otherResize) {
                otherResize = false;
            } else {
                var table = gTables[gActiveTableId];
                if (table && table.resultSetCount !== 0) {
                    RowScroller.genFirstVisibleRowNum();
                    RowScroller.updateViewRange(gActiveTableId);
                }
                moveTableDropdownBoxes();
                TblManager.adjustRowFetchQuantity();
                DagPanel.setScrollBarId($(window).height());
                DagPanel.adjustScrollBarPositionAndSize();
            }
            resizing = false;
        }

        // using this to keep window from scrolling on dragdrop
        $(window).scroll(function() {
            $(this).scrollLeft(0);
        });

        // using this to keep window from scrolling up and down;
        $('#container').scroll(function() {
            $(this).scrollTop(0);
        });

        var mainFrameScrolling = false;
        var mainFrameScrollTimer;
        var scrollPrevented = false;
        $('#mainFrame').scroll(function() {
            if (!mainFrameScrolling) {
                mainFrameScrolling = true;
                // apply the following actions only once per scroll session
                $('.menu').hide();
                removeMenuKeyboardNavigation();
                $(".highlightBox").remove();
                // table head's dropdown has position issue if not hide
                $('.xcTheadWrap').find('.dropdownBox').hide();
                $('.tooltip').hide();
                if ($(this).hasClass('scrollLocked')) {
                    scrollPrevented = true;
                }
            }
            $(this).scrollTop(0);

            clearTimeout(mainFrameScrollTimer);
            mainFrameScrollTimer = setTimeout(mainFrameScrollingStop, 300);
            if (!scrollPrevented) {
                moveFirstColumn();
                moveTableTitles();
            }
        });

        function mainFrameScrollingStop() {
            $('.xcTheadWrap').find('.dropdownBox').show();
            moveTableDropdownBoxes();
            mainFrameScrolling = false;
            scrollPrevented = false;
        }

        $(document).mousedown(function(event) {
            var $target = $(event.target);
            gMouseEvents.setMouseDownTarget($target);
            var clickable = $target.closest('.menu').length > 0 ||
                            $target.closest('.clickable').length > 0 ||
                            $target.hasClass("highlightBox");
            if (!clickable && $target.closest('.dropdownBox').length === 0) {
                $('.menu').hide();
                removeMenuKeyboardNavigation();
                $('.highlightBox').remove();
            }

            // some code mirror elements don't have parents for some reason
            if (!$target.hasClass('fnbarPre') &&
                !$target.hasClass('CodeMirror-cursor') &&
                !$target.closest('.fnbarPre').length &&
                !$target.closest('#functionArea').length &&
                !$target.closest('.header').length) {


                if ($target.closest('.selectedCell').length !== 0) {
                    return;
                } else if ($target.attr('id') === 'mainFrame') {
                    return;
                } else if ($target.closest('.menu').length !== 0 &&
                            $target.closest('#workspacePanel').length !== 0) {
                    return;
                }
                $('#fnBar').removeClass('disabled');
                $('.selectedCell').removeClass('selectedCell');

                FnBar.clear();
            }
        });

        $(document).click(function(event) {
            gLastClickTarget = $(event.target);
        });

        $(window).blur(function() {
            $('.menu').hide();
            removeMenuKeyboardNavigation();
        });

        if (!window.isBrowseChrome) {
            //  prevent cursor from showing in IE and firefox
            $(document).on('focus', 'input[readonly]', function(){
                this.blur();
            });
        }

        function tableScroll(scrollType, isUp) {
            if (!$("#workspaceTab").hasClass("active") ||
                gActiveTableId == null)
            {
                return false;
            }

            var $visibleMenu = $('.menu:visible');
            if ($visibleMenu.length !== 0) {
                // if the menu is only .tdMenu, allow scroll
                if ($visibleMenu.length > 1 || !$visibleMenu.hasClass("tdMenu")) {
                    return false;
                }
            }

            var tableId = gActiveTableId;
            var $lastTarget = gMouseEvents.getLastMouseDownTarget();
            var isInMainFrame = $lastTarget == null ||
                                ($lastTarget.closest("#mainFrame").length > 0 &&
                                !$lastTarget.is("input"));

            if (isInMainFrame && xcHelper.isTableInScreen(tableId)) {
                if (gIsTableScrolling ||
                    $("#modalBackground").is(":visible") ||
                    !isTableScrollable(tableId)) {
                    // not trigger table scroll, but should return true
                    // to prevent table's natural scroll
                    return true;
                }

                var maxRow     = gTables[tableId].resultSetCount;
                var curRow     = $rowInput.data("val");
                var lastRowNum = RowScroller.getLastVisibleRowNum(tableId);
                var rowToGo;

                // validation check
                xcHelper.assert((lastRowNum != null), "Error Case!");

                if (scrollType === "homeEnd") {
                    // isUp === true for home button, false for end button
                    rowToGo = isUp ? 1 : maxRow;
                } else {
                    var rowToSkip;
                    if (scrollType === "updown") {
                        var $xcTbodyWrap = $("#xcTbodyWrap-" + tableId);
                        var scrollTop = $xcTbodyWrap.scrollTop();
                        var $trs = $("#xcTable-" + tableId + " tbody tr");
                        var trHeight = $trs.height();
                        var rowNum;

                        if (!isUp) {
                            rowNum = xcHelper.parseRowNum($trs.eq($trs.length - 1)) + 1;
                            if (rowNum - lastRowNum > 5) {
                                // when have more then 5 buffer on bottom
                                $xcTbodyWrap.scrollTop(scrollTop + trHeight);
                                return true;
                            }
                        } else {
                            rowNum = xcHelper.parseRowNum($trs.eq(0)) + 1;
                            if (curRow - rowNum > 5) {
                                // when have more then 5 buffer on top
                                $xcTbodyWrap.scrollTop(scrollTop - trHeight);
                                return true;
                            }
                        }

                        rowToSkip = 1;
                    } else if (scrollType === "pageUpdown") {
                        // this is one page's row
                        rowToSkip = lastRowNum - curRow;
                    } else {
                        // error case
                        console.error("Invalid case!");
                        return false;
                    }

                    rowToGo = isUp ? Math.max(1, curRow - rowToSkip) :
                                    Math.min(maxRow, curRow + rowToSkip);
                }

                if (isUp && curRow === 1 || !isUp && lastRowNum === maxRow) {
                    // no need for backend call
                    return true;
                }

                $(".menu").hide();
                removeMenuKeyboardNavigation();
                gMouseEvents.setMouseDownTarget(null);
                $rowInput.val(rowToGo).trigger(fakeEvent.enter);

                return true;
            }

            return false;
        }

        function checkUndoRedo(event) {
            if (!(isSystemMac && event.metaKey) &&
                !(!isSystemMac && event.ctrlKey))
            {
                return;
            }
            if ($('#workspacePanel').hasClass('active') &&
                !$('.modalContainer:visible').length &&
                !$('textarea:focus').length &&
                !$('input:focus').length) {

                event.preventDefault();
                $('.menu').hide();
                removeMenuKeyboardNavigation();
                $('.highlightBox').remove();

                if (event.which === keyCode.Z) {
                    $('#undo').click();
                } else if (event.which === keyCode.Y) {
                    $('#redo').click();
                }
            }
        }
    }

    return StartManager;
}({}, jQuery));

