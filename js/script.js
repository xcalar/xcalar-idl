/**
    This file is where all the global variables go, as well as any
    document.ready functions. Any misc functions that kind of applies to the
    entire page and doesn't really have any specific purpose should come here as
    well.
*/

// =================================== Globals =================================
var gNumEntriesPerPage = 20;
var gMaxEntriesPerPage = 50;
var gNewCellWidth = 125;
var gMouseStatus = null;
var gMouseEvents = new MouseEvents();
var gDragObj = {};
var gRescol = {
    "minCellHeight": 30,
    "cellMinWidth" : 15,
    "clicks"       : 0,
    "delay"        : 500,
    "timer"        : null
};
var gResrow = {};
var gMinTableWidth = 30;
// XXX TODOS(bug 2319): this part should change to right scope after backend fix
/*
  "AUTH": Authentication info (should be XcalarApiKeyScopeSession)
  "PREF": user preference info (XXX this should be XcalarApiKeyScopeUser, no support yet!)
  "WKBK": Workbook info (XXX this should be XcalarApiKeyScopeUser, no support yet!)
  "META": all meta data need for UI (XXX this should be XcalarApiKeyScopeUser, no support yet!)
  "LOG" : SQL Log (this use append) (XXX this should be XcalarApiKeyScopeUser, no support yet!)
  "FLAG": special commitFlag to make sure UI have right to write (should be XcalarApiKeyScopeSession)
 */
var gKVScope = {
    "AUTH": XcalarApiKeyScopeT.XcalarApiKeyScopeGlobal,
    "PREF": XcalarApiKeyScopeT.XcalarApiKeyScopeGlobal,
    "WKBK": XcalarApiKeyScopeT.XcalarApiKeyScopeGlobal,
    "META": XcalarApiKeyScopeT.XcalarApiKeyScopeGlobal,
    "LOG" : XcalarApiKeyScopeT.XcalarApiKeyScopeGlobal,
    "FLAG": XcalarApiKeyScopeT.XcalarApiKeyScopeSession,
    "VER" : XcalarApiKeyScopeT.XcalarApiKeyScopeGlobal
};
var gTables = {}; // This is the main global array containing structures
                    // Stores TableMeta structs
var gOrphanTables = [];
var gActiveTableId = "";
var gDSObj = {};    //obj for DS folder structure
var gRetinaObj = {}; //obj for retina modal
var gLastClickTarget = $(window); // track which element was last clicked
var gDatasetBrowserResultSetId = 0; // resultSetId for currently viewed
var gIsTableScrolling = false;
var gMinModeOn = false;
var gExportNoCheck = false;
var gExportFDelim = "\t";
var gExportRDelim = "\n";
var KB = 1024;
var MB = 1024 * KB;
var GB = 1024 * MB;
var TB = 1024 * GB;
var PB = 1024 * TB;

// Shut up the console logs
var verbose = false;
var superVerbose = false;

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
        Support.releaseSession();
        sleep("500ms");
        freeAllResultSets();
        sleep("500ms");
    } else {
        freeAllResultSetsSync()
        .then(function() {
            return (Support.releaseSession());
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
    StartManager.setup = function() {
        gMinModeOn = true; // startup use min mode;

        var timer = setTimeout(function() {
            // add waiting icon since restore wkbk may take long time
            $("#initialLoadScreen .waitingIcon").css({
                left: "50%",
                top : "50%"
            }).fadeIn();
        }, 3000);

        Compatible.check();
        setupThrift();
        // Support.setup() get username, so need to be at very eary time
        Support.setup();
        setupLogout();

        XVM.checkVersionMatch()
        .then(setupSession)
        .then(function() {
            documentReadyGeneralFunction();
            setupTooltips();
            setupMenuBar();

            StatusMessage.setup();
            RightSideBar.setup();
            DataStore.setup();
            TblMenu.setup();
            WSManager.setup();
            loadMonitorPanel();
            DagPanel.setup();
            DFGPanel.setup();
            setupModals();

            WSManager.focusOnWorksheet();
        })
        .then(function() {
            // this should come in last!
            // KVStore.safeSetup();

            if (!isBrowseFireFox) {
                gMinModeOn = false; // turn off min mode
            }

            console.log('%c Have fun with Xcalar Insight! ',
            'background: linear-gradient(to bottom, #378cb3, #5cb2e8); ' +
            'color: #ffffff; font-size:20px; font-family:Open Sans, Arial;');

            XVM.commitVersionInfo();
            // start heartbeat check
            Support.heartbeatCheck();
        })
        .fail(function(error) {
            if (typeof error === "string"){
                // when it's a front end error, already has handler
                console.error("Setup fails", error);
            } else if (error.status === StatusT.StatusSessionNotFound) {
                var instr = "If you still see the error after re-login, " +
                            "please copy your log and restart the server.";
                Alert.show({
                    "title"     : "Cannot Retrieve Old Workbook",
                    "instr"     : instr,
                    "msg"       : "Please Use new workbook or logout and try again!",
                    "lockScreen": true,
                    "logout"    : true,
                    "buttons"   : [{
                        "name": "New Workbook",
                        "func": function() {
                            WKBKManager.inActiveAllWKBK();
                        }
                    }],
                    "hideButtons": ['copySql']
                });
            } else {
                // when it's an error from backend we cannot handle
                var title;
                if (error.error.indexOf('Update required') !== -1) {
                    title = "Xcalar Version Mismatch";
                } else if (error.error.indexOf('Connection') !== -1) {
                    title = "Connection Error";
                } else {
                    title = "Setup Fails";
                }
                Alert.error(title, error, {"lockScreen": true});
                StatusMessage.updateLocation(true, StatusMessageTStr.Error);
            }
        })
        .always(function() {
            clearTimeout(timer);
            $("#initialLoadScreen").remove();
        });
    };

    function setupSession() {
        var deferred = jQuery.Deferred();

        WKBKManager.setup()
        .then(Support.holdSession)
        .then(Authentication.setup)
        .then(readFromStorage)
        .then(initializeTable)
        .then(deferred.resolve)
        .fail(deferred.reject);

        return deferred.promise();
    }

    function setupModals() {
        JSONModal.setup();
        FileBrowser.setup();
        Profile.setup();
        ExportModal.setup();
        Alert.setup();
        JoinModal.setup();
        AggModal.setup();
        OperationsModal.setup();
        WorkbookModal.setup();
        DataFlowModal.setup();
        DFGParamModal.setup();
        AddScheduleModal.setup();
        MultiCastModal.setup();
    }

    function loadMonitorPanel() {
        $('#monitorPanel').load(paths.monitor, function() {
            MonitorPanel.setup();
        });
    }

    function setupLogout() {
        var $userName = $("#userName");
        var $popOut = $("#userNamePopout");
        var username = Support.getUser();

        $userName.text(username);
        $('#userNameArea').show();
        $popOut.find(".text").text(username);

        $userName.click(function(event) {
            var top  = $userName.position().top + $userName.height();
            var left = $userName.position().left + $userName.width() / 2 -
                        $popOut.width() / 2;

            event.stopPropagation();

            $popOut.toggle();
            $popOut.css({"top": top, "left": left});
        });

        $("body").click(function() {
            $popOut.hide();
        });

        $("#signout").click(function() {
            unloadHandler();
        });
    }

    function setupTooltips() {
        $("body").tooltip({
            selector: '[data-toggle="tooltip"]',
            delay   : {
                "show": 100,
                "hide": 100
            },
            html: true
        });

        $("body").on('mouseenter', '[data-toggle="tooltip"]', function() {
            $('.tooltip').hide();
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

            switch ($curTab.attr("id")) {
                case ("workspaceTab"):
                    $("#workspacePanel").addClass("active");
                    WSManager.focusOnWorksheet();
                    break;
                case ("schedulerTab"):
                    $('#schedulerPanel').addClass("active");
                    break;
                case ("dataStoresTab"):
                    $("#datastorePanel").addClass("active");
                    DataSampleTable.sizeTableWrapper();
                    break;
                case ("monitorTab"):
                    $('#monitorPanel').addClass("active");
                    MonitorPanel.updateDonuts();
                    MonitorGraph.start();
                    break;
                default:
                    $(".underConstruction").addClass("active");
            }
            if (lastTabId === "monitorTab") {
                MonitorGraph.clear();
            }
            StatusMessage.updateLocation();
        });
    }

    function initializeTable() {
        var deferred = jQuery.Deferred();
        var tableCount = 0;

        StatusMessage.updateLocation(true, StatusMessageTStr.LoadingTables);
        XcalarGetTables()
        .then(function(backEndTables) {
            var backTables = backEndTables.nodeInfo;
            var numBackTables = backEndTables.numNodes;
            var tableMap = {};

            for (var i = 0; i < numBackTables; i++) {
                // record the table
                tableMap[backTables[i].name] = 1;
            }

            var hasTable = false;
            var promises = [];
            var failures = [];
            var tableName;
            var tableId;
            var currentTable;
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

                // create active tables
                for (var j = 0; j < numWsTables; j++) {
                    tableId = wsTables[j];
                    currentTable = gTables[tableId];

                    if (!currentTable) {
                        WSManager.removeTable(tableId);
                        console.error("not find table", tableId);
                        continue;
                    }

                    currentTable.beActive();
                    tableName = currentTable.tableName;
                    delete tableMap[tableName];
                    ++tableCount;

                    promises.push((function(tName, tId) {
                        var innerDeferred = jQuery.Deferred();

                        TblManager.parallelConstruct(tId)
                        .then(innerDeferred.resolve)
                        .fail(function(thriftError) {
                            failures.push("Add table " + tName +
                                         "fails: " + thriftError.error);
                            innerDeferred.resolve(thriftError);
                        });

                        return (innerDeferred.promise());
                    }).bind(this, tableName, tableId));
                }

                // create hidden tables
                var wsHiddenTables = ws.hiddenTables;
                var numHiddenWsTables = wsHiddenTables.length;
                for (var j = 0; j < numHiddenWsTables; j++) {
                    tableId = wsHiddenTables[j];
                    currentTable = gTables[tableId];

                    if (!currentTable) {
                        WSManager.removeTable(tableId);
                        console.error("not find table", tableId);
                        continue;
                    }

                    tableName = currentTable.tableName;
                    delete tableMap[tableName];
                    ++tableCount;

                    currentTable.beInActive();
                }
            }

            // create no worksheet tables
            var noSheetTables = WSManager.getNoSheetTables();
            var numNoSheetTables = noSheetTables.length;

            for (var i = 0; i < numNoSheetTables; i++) {
                tableId = noSheetTables[i];
                currentTable = gTables[tableId];

                if (!currentTable) {
                    // this case is fine since some are in agg table list
                    console.info("not find table", tableId);
                    continue;
                }

                tableName = currentTable.tableName;
                delete tableMap[tableName];
                ++tableCount;

                currentTable.beInActive();
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
                    currentTable = gTables[tableId];

                    if (!currentTable) {
                        // this case is fine since some are in agg table list
                        console.info("not find table", tableId);
                        continue;
                    }

                    tableName = currentTable.tableName;
                    delete tableMap[tableName];
                    ++tableCount;
                }

                numArchivedTables = ws.hiddenTables.length;

                for (var j = 0; j < numArchivedTables; j++) {
                    tableId = ws.hiddenTables[j];
                    currentTable = gTables[tableId];

                    if (!currentTable) {
                        // this case is fine since some are in agg table list
                        console.info("not find table", tableId);
                        continue;
                    }

                    tableName = gTables[tableId].tableName;
                    delete tableMap[tableName];
                    ++tableCount;
                }
            }

            // setup leftover tables
            setupOrphanedList(tableMap);

            chain(promises)
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

                    if (failures.length === tableCount) {
                        deferred.reject("InitializeTable fails!");
                    } else {
                        deferred.resolve();
                    }
                } else {
                    deferred.resolve();
                }
            })
            .fail(function(error) {
                deferred.reject(error);
            });
        })
        .fail(function(error) {
            console.error("InitializeTable fails!", error);
            deferred.reject(error);
        });

        return (deferred.promise());
    }

    function documentReadyGeneralFunction() {
        var backspaceIsPressed = false;
        var hasRelease = false;
        var $rowInput = $("#rowInput");

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
                default:
                    break;
            }

            if (isPreventEvent) {
                event.preventDefault();
            }
        });

        $(document).keyup(function(event){
            if (event.which === keyCode.Backspace) {
                backspaceIsPressed = false;
            }
        });

        window.onbeforeunload = function() {
            if (backspaceIsPressed) {
                backspaceIsPressed = false;
                return ("You are leaving Xcalar. " +
                        "Please logout or you may lose work.");
            } else {
                return ("Please logout or you may lose unsaved work.");
                /**
                hasRelease = true;
                Support.releaseSession();
                sleep("500ms");
                freeAllResultSets();
                sleep("500ms"); */
            }
        };

        window.onunload = function() {
            if (!hasRelease) {
                // XXX this may not work
                // now it's fine since backend do not has refCount
                unloadHandler(true);
            }
        };

        var timer;
        var resizing = false;
        $(window).resize(function() {
            if (!resizing) {
                $('.menu').hide();
                resizing = true;
            }
            clearTimeout(timer);
            timer = setTimeout(function() {
                var table = gTables[gActiveTableId];
                if (table && table.resultSetCount !== 0) {
                    generateFirstVisibleRowNum();
                }
                moveTableDropdownBoxes();
                resizing = false;
            }, 100);
            moveTableTitles();
        });

        // using this to keep window from scrolling on dragdrop
        $(window).scroll(function() {
            $(this).scrollLeft(0);
        });

        // using this to keep window from scrolling up and down;
        $('#container').scroll(function() {
            $(this).scrollTop(0);
        });

        var mainFrameScrolling = false;
        $('#mainFrame').scroll(function() {
            if (!mainFrameScrolling) {
                mainFrameScrolling = true;
                // apply the following actions only once per scroll session
                $('.menu').hide();
                removeMenuKeyboardNavigation();
                $(".highlightBox").remove();
                $('.xcTableWrap').find('.dropdownBox').hide();
                $('.tooltip').hide();
            }
            $(this).scrollTop(0);
            mainFrameScrolling = true;

            clearTimeout(timer);
            timer = setTimeout(function() {
                $('.xcTableWrap').find('.dropdownBox').show();
                moveTableDropdownBoxes();
                mainFrameScrolling = false;
            }, 300);

            moveFirstColumn();
            moveTableTitles();
        });

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
                $('body').removeClass('noSelection');
            }

            if (!$target.is('#fnBar') && !$target.closest('.header').length) {
                if ($target.closest('.selectedCell').length !== 0) {
                    return;
                } else if ($target.attr('id') === 'mainFrame') {
                    return;
                } else if ($target.closest('.menu').length !== 0 &&
                            $target.closest('#workspacePanel').length !== 0) {
                    return;
                }
                $('.selectedCell').removeClass('selectedCell');
                FnBar.clear();
            }
        });
        $(document).mousemove(function(event) {
            if (gMouseStatus == null) {
                return;
            }

            switch (gMouseStatus) {
                case ("resizingCol"):
                    gRescolMouseMove(event);
                    break;
                case ("resizingRow"):
                    gResrowMouseMove(event);
                    break;
                case ("movingTable"):
                    dragTableMouseMove(event);
                    break;
                case ("movingCol"):
                    dragdropMouseMove(event);
                    break;
                case ("rowScroller"):
                    RowScroller.mouseMove(event);
                    break;
                default:  // do nothing
            }
        });

        $(document).mouseup(function() {
            if (gMouseStatus == null) {
                return;
            }
            switch (gMouseStatus) {
                case ("resizingCol"):
                    gRescolMouseUp();
                    break;
                case ("resizingRow"):
                    gResrowMouseUp();
                    break;
                case ("movingTable"):
                    dragTableMouseUp();
                    break;
                case ("movingCol"):
                    dragdropMouseUp();
                    break;
                case ("rowScroller"):
                    RowScroller.mouseUp();
                    break;
                default: // do nothing
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
                var lastRowNum = xcHelper.getLastVisibleRowNum(tableId);
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
    }

    return StartManager;
}({}, jQuery));

