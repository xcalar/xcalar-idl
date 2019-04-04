window.TblAnim = (function($, TblAnim) {
    // This module consists of column resizing, row resizing,
    // column drag and dropping, and table drag and dropping
    var dragInfo = {};
    var rowInfo = {};

    /* START COLUMN RESIZING */
    TblAnim.startColResize = function($el, event, options) {
        options = options || {};

        var rescol = gRescol;
        var $table = $el.closest('.dataTable');
        var target = options.target;
        var colNum = null;
        var $th = $el.closest('th');
        rescol.$th = $th;

        if (target === "datastore") {
            rescol.isDatastore = true;
            rescol.$tableWrap = $('#dsTableWrap');
            rescol.$dsTable = $('#dsTable');
            rescol.$previewTable = $('#previewTable');
        } else {
            rescol.tableId = xcHelper.parseTableId($table);
            colNum = xcHelper.parseColNum($th);
        }

        event.preventDefault();
        rescol.mouseStart = event.pageX;
        rescol.startWidth = rescol.$th.outerWidth();

        rescol.index = colNum;
        rescol.newWidth = rescol.startWidth;
        rescol.table = $table;
        rescol.tableHead = $el.closest('.xcTableWrap').find('.xcTheadWrap');
        if (options.minWidth != null) {
            rescol.minResizeWidth = options.minWidth;
        } else {
            rescol.minResizeWidth = rescol.cellMinWidth;
        }
        rescol.leftDragMax = rescol.minResizeWidth - rescol.startWidth;

        if (!rescol.$th.hasClass('selectedCell')) {
            $('.selectedCell').removeClass('selectedCell');
        }

        gMouseStatus = "checkingResizeCol";
        $(document).on('mousemove.checkColResize', checkColResize);
        $(document).on('mouseup.endColResize', endColResize);

        dblClickResize($el, target, options.minWidth);
    };

    function checkColResize(event) {
        var rescol = gRescol;
        rescol.pageX = event.pageX;
        // mouse must move at least 3 pixels horizontally to trigger draggin
        if (Math.abs(rescol.mouseStart - rescol.pageX) > 2) {
            $(document).off('mousemove.checkColResize', checkColResize);
            $(document).on('mousemove.onColResize', onColResize);
            gMouseStatus = "resizingCol";

            var $table = rescol.$th.closest('.dataTable');
            var colNum = rescol.index;
            if (rescol.$th.hasClass("userHidden")) {
                // This is a hidden column! we need to unhide it
                $table.find("th.col" + colNum + ",td.col" + colNum)
                      .removeClass("userHidden");
                gTables[rescol.tableId].tableCols[colNum - 1].isMinimized = false;
            }

            $table.addClass('resizingCol');
            $('.xcTheadWrap').find('.dropdownBox')
                            .addClass('dropdownBoxHidden');

            var cursorStyle = '<div id="resizeCursor"></div>';
            $('body').addClass('tooltipOff').append(cursorStyle);
        }
    }

    function onColResize(event) {
        var rescol = gRescol;
        var dragDist = (event.pageX - rescol.mouseStart);
        var newWidth;
        if (dragDist > rescol.leftDragMax) {
            newWidth = rescol.startWidth + dragDist;
        } else {
            // resizing too small so we set with to the minimum allowed
            newWidth = rescol.minResizeWidth;
        }
        rescol.$th.outerWidth(newWidth);
        rescol.newWidth = newWidth;

        if (rescol.isDatastore) {
            rescol.$tableWrap.width(rescol.$dsTable.width());
               // size line divider to fit table
            var tableWidth = rescol.$previewTable.width();
            rescol.$previewTable.find('.divider').width(tableWidth - 10);
        }
    }

    function endColResize() {
        $(document).off('mousemove.onColResize');
        $(document).off('mouseup.endColResize');
        var mouseStatus = gMouseStatus;
        gMouseStatus = null;
        if (mouseStatus === "checkingResizeCol") {
            $(document).off('mousemove.checkColResize');
            return;
        }

        var rescol = gRescol;
        var isDatastore = rescol.isDatastore;
        var wasResized = true;
        // var widthState;
        var prevSizedTo;
        $('#resizeCursor').remove();
        $('body').removeClass('tooltipOff');
        $('.xcTheadWrap').find('.dropdownBox').removeClass('dropdownBoxHidden');
        rescol.table.closest('.xcTableWrap').find('.rowGrab')
                                            .width(rescol.table.width());
        rescol.table.removeClass('resizingCol');
        $('.tooltip').remove();
        if (!isDatastore) {
            var table = gTables[rescol.tableId];
            var progCol = table.tableCols[rescol.index - 1];

            if (rescol.newWidth === rescol.cellMinWidth) {
                rescol.table
                      .find('th.col' + rescol.index + ',td.col' + rescol.index)
                      .addClass("userHidden");
                progCol.isMinimized = true;
            } else {
                progCol.width = rescol.$th.outerWidth();
            }
            var column = gTables[rescol.tableId].tableCols[rescol.index - 1];

            prevSizedTo = column.sizedTo;

            if (Math.abs(rescol.newWidth - rescol.startWidth) > 1) {
                // set autoresize to header only if column moved at least 2 pixels
                column.sizedTo = "auto";
            }
            if (rescol.newWidth === rescol.startWidth) {
                wasResized = false;
            }
        } else {
            rescol.isDatastore = false;
            if (Math.abs(rescol.newWidth - rescol.startWidth) > 1) {
                // set autoresize to header only if column moved at least 2 pixels
                rescol.$th.find('.colGrab').data('sizedtoheader', false);
            }
        }

        // for tableScrollBar
        TblFunc.moveFirstColumn();

        if (!isDatastore && wasResized) {
            Log.add(SQLTStr.ResizeCol, {
                "operation": SQLOps.DragResizeTableCol,
                "tableName": gTables[rescol.tableId].tableName,
                "tableId": rescol.tableId,
                "colNum": rescol.index,
                "fromWidth": rescol.startWidth,
                "toWidth": rescol.newWidth,
                "oldSizedTo": prevSizedTo,
                "htmlExclude": ["colNum", "fromWidth", "toWidth", "oldSizedTo"]
            });
        }
    }

    function dblClickResize($el, target, minWidth) {
        minWidth = minWidth || 17;
        // $el is the colGrab div inside the header
        gRescol.clicks++;  //count clicks
        if (gRescol.clicks === 1) {
            gRescol.timer = setTimeout(function() {
                gRescol.clicks = 0; //after action performed, reset counter
            }, gRescol.delay);
        } else {
            $('#resizeCursor').remove();
            $('body').removeClass('tooltipOff');
            $el.tooltip('destroy');
            gMouseStatus = null;
            $(document).off('mousemove.checkColResize');
            $(document).off('mousemove.onColResize');
            $(document).off('mouseup.endColResize');
            xcHelper.reenableTextSelection();
            $('.xcTheadWrap').find('.dropdownBox')
                             .removeClass('dropdownBoxHidden');
            clearTimeout(gRescol.timer);    //prevent single-click action
            gRescol.clicks = 0;      //after action performed, reset counter

            var tableId;
            var $th = $el.closest('th');
            var $table = $th.closest('.dataTable');
            $table.removeClass('resizingCol');

            // check if unhiding
            if (target !== "datastore" && $th.outerWidth() === 15) {
                tableId = $table.data('id');
                var index = xcHelper.parseColNum($th);
                $th.addClass('userHidden');
                $table.find('td.col' + index).addClass('userHidden');
                gTables[tableId].tableCols[index - 1].isMinimized = true;
                ColManager.maximizeCols([index], tableId, true);
                return;
            }

            var oldColumnWidths = [];
            var newColumnWidths = [];
            var oldSizedTo = [];

            xcTooltip.remove($table.find('.colGrab'));

            var $selectedCols;
            if (target === "datastore") {
                if ($th.hasClass('selectedCol')) {
                    $selectedCols = $table.find('th.selectedCol');
                } else {
                    $selectedCols = $th;
                }
            } else {
                $selectedCols = $table.find('th.selectedCell');
            }
            var numSelectedCols = $selectedCols.length;
            if (numSelectedCols === 0) {
                $selectedCols = $th;
                numSelectedCols = 1;
            }
            var indices = [];
            var colNums = [];
            $selectedCols.each(function() {
                indices.push($(this).index() - 1);
                colNums.push($(this).index());
            });

            var includeHeader = false;
            var sizeTo = "contents";

            if (target === "datastore") {
                $selectedCols.find('.colGrab').each(function() {
                    if (!$(this).data('sizedtoheader')) {
                        includeHeader = true;
                        return false;
                    }
                });

                $selectedCols.find('.colGrab').each(function() {
                    $(this).data('sizedtoheader', includeHeader);
                });

            } else {
                tableId = $table.data('id');
                var columns = gTables[tableId].tableCols;
                var i;
                for (i = 0; i < numSelectedCols; i++) {
                    if (columns[indices[i]].sizedTo !== "header" &&
                        columns[indices[i]].sizedTo !== "all") {
                        includeHeader = true;
                        sizeTo = "header";
                        break;
                    }
                }
                for (i = 0; i < numSelectedCols; i++) {
                    oldColumnWidths.push(columns[indices[i]].width);
                    oldSizedTo.push(columns[indices[i]].sizedTo);
                    columns[indices[i]].sizedTo = sizeTo;
                }
            }

            $selectedCols.each(function() {
                newColumnWidths.push(TblFunc.autosizeCol($(this), {
                    "dblClick": true,
                    "minWidth": minWidth,
                    "unlimitedWidth": true,
                    "includeHeader": includeHeader,
                    "datastore": target === "datastore"
                }));
            });

            if (target !== "datastore") {
                var table = gTables[tableId];

                Log.add(SQLTStr.ResizeCols, {
                    "operation": SQLOps.ResizeTableCols,
                    "tableName": table.tableName,
                    "tableId": tableId,
                    "sizeTo": sizeTo,
                    "oldSizedTo": oldSizedTo,
                    "columnNums": colNums,
                    "oldColumnWidths": oldColumnWidths,
                    "newColumnWidths": newColumnWidths,
                    "htmlExclude": ["columnNums", "oldColumnWidths",
                                    "newColumnWidths", "oldSizedTo"]
                });
            }
        }
    }

    // used for replaying and redo/undo
    TblAnim.resizeColumn = function(tableId, colNum, fromWidth, toWidth,
                                    sizeTo) {
        var $table = $('#xcTable-' + tableId);
        var progCol = gTables[tableId].tableCols[colNum - 1];
        var $th = $table.find('th.col' + colNum);
        var $allCells = $table.find("th.col" + colNum + ",td.col" + colNum);
        if ($th.hasClass("userHidden")) {
            // This is a hidden column! we need to unhide it

            $allCells.removeClass("userHidden");
            progCol.isMinimized = false;
        }
        if (toWidth <= 15) {
            $allCells.addClass("userHidden");
            progCol.isMinimized = true;
        } else {
            progCol.width = toWidth;
        }
        $th.outerWidth(toWidth);
        var oldSizedTo = progCol.sizedTo;
        if (sizeTo == null) {
            if (Math.abs(toWidth - fromWidth) > 1) {
                // set autoresize to header only if
                // column moved at least 2 pixels
                progCol.sizedTo = "auto";
            }
        } else {
            progCol.sizedTo = sizeTo;
        }
        TblFunc.matchHeaderSizes($table);

        Log.add(SQLTStr.ResizeCol, {
            "operation": SQLOps.DragResizeTableCol,
            "tableName": gTables[tableId].tableName,
            "tableId": tableId,
            "colNum": colNum,
            "fromWidth": fromWidth,
            "toWidth": toWidth,
            "oldSizedTo": oldSizedTo,
            "sizedTo": sizeTo,
            "htmlExclude": ["colNum", "fromWidth", "toWidth", "oldSizedTo",
                            "sizedTo"]
        });
    };

    /* END COLUMN RESIZING */

    /* START ROW RESIZING */

    TblAnim.startRowResize = function($el, event) {
        rowInfo.mouseStart = event.pageY;
        gMouseStatus = "checkingRowMove";
        rowInfo.$el = $el;
        var $table = $el.closest('.xcTbodyWrap');
        rowInfo.$table = $table;
        rowInfo.actualTd = $el.closest('td');
        rowInfo.$container = $table.closest(".xcTableWrap").parent();
        // we actually target the td above the one we're grabbing.
        if ($el.hasClass('last')) {
            rowInfo.targetTd = $table.find('tr:last').find('td').eq(0);
            rowInfo.actualTd = rowInfo.targetTd;
        } else {
            rowInfo.targetTd = $el.closest('tr').prev().find('td').eq(0);
        }

        rowInfo.startHeight = rowInfo.targetTd.outerHeight();

        $(document).on('mousemove.checkRowResize', checkRowResize);
        $(document).on('mouseup.endRowResize', endRowResize);
    };

    function checkRowResize(event) {
        var mouseDistance = event.pageY - rowInfo.mouseStart;
        if (mouseDistance + rowInfo.startHeight > gRescol.minCellHeight) {
            $(document).off('mousemove.checkRowResize');
            $(document).on('mousemove.onRowResize', onRowResize);
            gMouseStatus = "rowMove";

            // var el = rowInfo.$el;
            var $table = rowInfo.$table;

            rowInfo.tableId = xcHelper.parseTableId($table);

            rowInfo.rowIndex = rowInfo.targetTd.closest('tr').index();
            rowInfo.$divs = $table.find('tbody tr:eq(' + rowInfo.rowIndex +
                                        ') td > div');
            xcHelper.disableTextSelection();

            $('body').addClass('tooltipOff')
                     .append('<div id="rowResizeCursor"></div>');
            rowInfo.targetTd.closest('tr').addClass('changedHeight');
            rowInfo.actualTd.closest('tr').addClass('dragging');
            rowInfo.$divs.css('max-height', rowInfo.startHeight - 4);
            rowInfo.$divs.eq(0).css('max-height', rowInfo.startHeight);
            rowInfo.targetTd.outerHeight(rowInfo.startHeight);

            $table.find('tr:not(.dragging)').addClass('notDragging');
            lockScrolling(rowInfo.$container, 'horizontal');
            $table.siblings(".tableScrollBar").hide();
        }
    }

    function onRowResize(event) {
        var mouseDistance = event.pageY - rowInfo.mouseStart;
        var newHeight = rowInfo.startHeight + mouseDistance;
        var padding = 4; // top + bottom padding in td
        if (newHeight < gRescol.minCellHeight) {
            rowInfo.targetTd.outerHeight(gRescol.minCellHeight);
            rowInfo.$divs.css('max-height', gRescol.minCellHeight - padding);
            rowInfo.$divs.eq(0).css('max-height', gRescol.minCellHeight);
        } else {
            rowInfo.targetTd.outerHeight(newHeight);
            rowInfo.$divs.css('max-height', newHeight - padding);
            rowInfo.$divs.eq(0).css('max-height', newHeight);
        }
    }

    function endRowResize() {
        $(document).off('mouseup.endRowResize');

        if (gMouseStatus === "checkingRowMove") {
            $(document).off('mousemove.checkRowResize');
            gMouseStatus = null;
            return;
        }

        $(document).off('mousemove.onRowResize');
        gMouseStatus = null;

        var newRowHeight = rowInfo.targetTd.outerHeight();
        var rowNum = xcHelper.parseRowNum(rowInfo.targetTd.parent()) + 1;
        var rowObj = gTables[rowInfo.tableId].rowHeights;
        // structure of rowObj is rowObj {pageNumber:{rowNumber: height}}
        var pageNum = Math.floor((rowNum - 1) / TableMeta.NumEntriesPerPage);
        xcHelper.reenableTextSelection();
        $('body').removeClass('tooltipOff');
        $('#rowResizeCursor').remove();
        rowInfo.$table.siblings(".tableScrollBar").show();
        unlockScrolling(rowInfo.$container, 'horizontal');
        var $table = $('#xcTable-' + rowInfo.tableId);
        $table.find('tr').removeClass('notDragging dragging');

        if (gTables[gActiveTableId] && gTables[gActiveTableId].resultSetCount !== 0) {
            TableComponent.update();
        }

        if (newRowHeight !== gRescol.minCellHeight) {
            if (rowObj[pageNum] == null) {
                rowObj[pageNum] = {};
            }
            rowObj[pageNum][rowNum] = newRowHeight;
        } else {
            // remove this rowNumber from gTables and
            //if no other rows exist in the page, remove the pageNumber as well
            if (rowObj[pageNum] != null) {
                delete rowObj[pageNum][rowNum];
                if ($.isEmptyObject(rowObj[pageNum])) {
                    delete rowObj[pageNum];
                }
            }
            rowInfo.targetTd.parent().removeClass('changedHeight');
            rowInfo.targetTd.parent().find('.jsonElement >  div')
                                     .css('max-height', 16);
        }

        var rowManger = new RowManager(gTables[rowInfo.tableId], $("#xcTableWrap-" + rowInfo.tableId));
        rowManger.setSizerHeight();

        Log.add(SQLTStr.ResizeRow, {
            "operation": SQLOps.DragResizeRow,
            "tableName": gTables[rowInfo.tableId].tableName,
            "tableId": rowInfo.tableId,
            "rowNum": rowNum - 1,
            "fromHeight": rowInfo.startHeight,
            "toHeight": newRowHeight,
            "htmlExclude": ["rowNum", "fromHeight", "toHeight"]
        });
    }

    TblAnim.resizeRow = function(rowNum, tableId, fromHeight, toHeight) {
        var padding = 4; // top + bottom padding in td
        var $table = $('#xcTable-' + tableId);
        var $targetRow = $table.find('.row' + rowNum);
        var $targetTd = $targetRow.find('.col0');

        var $divs = $targetRow.find('td > div');
        if (toHeight < gRescol.minCellHeight) {
            toHeight = gRescol.minCellHeight;
        }

        $targetTd.outerHeight(toHeight);
        $divs.css('max-height', toHeight - padding);
        $divs.eq(0).css('max-height', toHeight);

        var rowObj = gTables[tableId].rowHeights;
        var pageNum = Math.floor((rowNum) / TableMeta.NumEntriesPerPage);

        if (toHeight !== gRescol.minCellHeight) {
            if (rowObj[pageNum] == null) {
                rowObj[pageNum] = {};
            }
            rowObj[pageNum][rowNum + 1] = toHeight;
            $targetRow.addClass('changedHeight');
        } else {
            // remove this rowNumber from gTables and
            //if no other rows exist in the page, remove the pageNumber as well
            if (rowObj[pageNum] != null) {
                delete rowObj[pageNum][rowNum + 1];
                if ($.isEmptyObject(rowObj[pageNum])) {
                    delete rowObj[pageNum];
                }
            }
            $targetTd.parent().removeClass('changedHeight');
            $targetTd.parent().find('.jsonElement >  div')
                                     .css('max-height', 16);
        }

        Log.add(SQLTStr.ResizeRow, {
            "operation": SQLOps.DragResizeRow,
            "tableName": gTables[tableId].tableName,
            "tableId": tableId,
            "rowNum": rowNum,
            "fromHeight": fromHeight,
            "toHeight": toHeight,
            "htmlExclude": ["rowNum", "fromHeight", "toHeight"]
        });
    };

    /* END ROW RESIZING */

    /* START COLUMN DRAG DROP */

    TblAnim.startColDrag = function($el, event) {
        var $tableWrap = $el.closest('.xcTableWrap');
        if ($tableWrap.hasClass('undraggable')) {
            return;
        }

        gMouseStatus = "checkingMovingCol";
        dragInfo.mouseX = event.pageX;
        dragInfo.$el = $el;
        dragInfo.$tableWrap = $tableWrap;
        dragInfo.$container = $tableWrap.parent();

        $el.closest("th").addClass("colDragging");
        var cursorStyle = '<div id="moveCursor"></div>';
        $('body').addClass('tooltipOff').append(cursorStyle);
        $tableWrap.addClass("checkingColDrag");

        TblManager.unHighlightCells();

        $(document).on('mousemove.checkColDrag', checkColDrag);
        $(document).on('mouseup.endColDrag', endColDrag);
    };

    // checks if mouse has moved and will initiate the column dragging
    function checkColDrag(event) {
        dragInfo.pageX = event.pageX;
        // mouse must move at least 2 pixels horizontally to trigger draggin
        if (Math.abs(dragInfo.mouseX - dragInfo.pageX) < 2) {
            return;
        }
        dragInfo.$tableWrap.removeClass("checkingColDrag");

        $(document).off('mousemove.checkColDrag');
        $(document).on('mousemove.onColDrag', onColDrag);
        gMouseStatus = "dragging";
        var el = dragInfo.$el;
        var pageX = event.pageX;
        dragInfo.colNum = xcHelper.parseColNum(el);
        var $tableWrap = dragInfo.$tableWrap;

        var $table = el.closest('.xcTable');
        var $tbodyWrap = $table.parent();
        var $editableHead = el.find('.editableHead');
        dragInfo.$table = $tableWrap;
        dragInfo.tableId = xcHelper.parseTableId($table);
        dragInfo.element = el;
        dragInfo.colIndex = parseInt(el.index());
        dragInfo.offsetTop = el.offset().top;
        dragInfo.grabOffset = pageX - el.offset().left;
        // dragInfo.grabOffset = distance from the left side of dragged column
        // to the point that was grabbed
        dragInfo.docHeight = $(document).height();
        dragInfo.val = $editableHead.val();
        var shadowDivHeight = $tbodyWrap.height();
        var shadowTop = $tableWrap.find('.header').position().top - 5;

        dragInfo.inFocus = $editableHead.is(':focus');
        dragInfo.selected = el.hasClass('selectedCell');
        dragInfo.isMinimized = el.hasClass('userHidden');
        dragInfo.colWidth = el.width();
        dragInfo.windowWidth = $(window).width();
        dragInfo.mainFrameLeft = dragInfo.$container[0].getBoundingClientRect().left;
        dragInfo.offsetLeft = dragInfo.$container.offset().left - dragInfo.$container.position().left;
        var timer;
        if (gTables[dragInfo.tableId].tableCols.length > 50) {
            timer = 100;
        } else {
            timer = 40;
        }
        dragdropMoveMainFrame(dragInfo, timer);

        // the following code deals with hiding non visible tables and locking the
        // scrolling when we reach the left or right side of the table

        var mfWidth = dragInfo.$container.width();

        var mfScrollLeft = dragInfo.$container.scrollLeft();
        var tableLeft = dragInfo.$table.offset().left - MainMenu.getOffset();
        dragInfo.$container.addClass('scrollLocked');

        var leftLimit = mfScrollLeft + tableLeft;
        leftLimit = Math.min(leftLimit, mfScrollLeft);
        var rightLimit = mfScrollLeft + tableLeft + $tableWrap.width() - mfWidth +
                         dragInfo.grabOffset;
        rightLimit = Math.max(rightLimit, mfScrollLeft);

        var hideOptions = {
            marginLeft: mfScrollLeft - leftLimit,
            marginRight: rightLimit - mfScrollLeft
        };

        var scrollLeft;
        dragInfo.$container.on('scroll.draglocked', function() {
            scrollLeft = dragInfo.$container.scrollLeft();

            if (scrollLeft <= leftLimit) {
                dragInfo.$container.scrollLeft(leftLimit);
            } else if (scrollLeft >= rightLimit) {
                dragInfo.$container.scrollLeft(rightLimit);
            }

            TblFunc.moveFirstColumn(null, true);
        });

        // create a fake transparent column by cloning

        createTransparentDragDropCol(pageX);

        // create a replica shadow with same column width, height,
        // and starting position
        xcHelper.disableTextSelection();
        $tableWrap.append('<div id="shadowDiv" style="width:' +
                        dragInfo.colWidth +
                        'px;height:' + (shadowDivHeight) + 'px;left:' +
                        (dragInfo.element.position().left) +
                        'px;top:' + shadowTop + 'px;"></div>');
        createDropTargets();
    }

    function onColDrag(event) {
        var pageX = event.pageX;
        dragInfo.pageX = pageX;
        dragInfo.fauxCol.css('left', pageX - dragInfo.offsetLeft);
    }

    function endColDrag() {
        $(document).off('mouseup.endColDrag');
        $('#moveCursor').remove();
        setTimeout(function () {
            dragInfo.$el.closest("th").removeClass("colDragging");
        });

        setTimeout(function() {
            dragInfo.$tableWrap.removeClass("checkingColDrag");
            $('body').removeClass('tooltipOff');
            // without timeout, tooltip will flicker on and off
        }, 0);
        if (gMouseStatus === "checkingMovingCol") {
            // endColDrag is called on mouseup but if there was no mouse movement
            // then just clean up and exit
            gMouseStatus = null;
            $(document).off('mousemove.checkColDrag');
            return;
        }
        $(document).off('mousemove.onColDrag');

        gMouseStatus = null;
        var $tableWrap = dragInfo.$table;
        var $th = dragInfo.element;
        dragInfo.$container.off('scroll.draglocked');
        dragInfo.$container.removeClass('scrollLocked');
        if (gMinModeOn) {
            $('#shadowDiv, #fauxCol').remove();
        } else {
            // slide column into place
            $tableWrap.addClass('undraggable');
            var slideLeft = $th.offset().left -
                            parseInt(dragInfo.fauxCol.css('margin-left')) -
                            dragInfo.offsetLeft;
            var currentLeft = parseInt(dragInfo.fauxCol.css('left'));
            var slideDistance = Math.max(2, Math.abs(slideLeft - currentLeft));
            var slideDuration = Math.log(slideDistance * 4) * 90 - 200;

            // unhiding non visible tables is slow and interrupts column sliding
            // animation so we delay the animation with the timout
            setTimeout(function() {
                dragInfo.fauxCol.animate({left: slideLeft}, slideDuration, "linear",
                    function() {
                        $('#shadowDiv, #fauxCol').remove();
                        $tableWrap.removeClass('undraggable');
                    }
                );
            }, 0);
        }

        $('#dropTargets').remove();
        dragInfo.$container.off('scroll', mainFrameScrollDropTargets)
                       .scrollTop(0);
        xcHelper.reenableTextSelection();
        if (dragInfo.inFocus) {
            dragInfo.element.find('.editableHead').focus();
        }

        // only pull col if column is dropped in new location
        if ((dragInfo.colIndex) !== dragInfo.colNum) {
            var tableId  = dragInfo.tableId;
            var oldColNum = dragInfo.colNum;
            var newColNum = dragInfo.colIndex;

            ColManager.reorderCol(tableId, oldColNum, newColNum);
        }
    }

    function cloneCellHelper(obj) {
        var trClass = "";
        if ($(obj).hasClass("changedHeight")) {
            trClass = "changedHeight";
        }
        var td = $(obj).children().eq(dragInfo.colIndex);

        var clone = td.clone();
        var cloneHeight = td.outerHeight();
        var cloneColor = td.css('background-color');
        clone.css('height', cloneHeight + 'px');
        clone.outerWidth(dragInfo.colWidth);
        clone.css('background-color', cloneColor);
        var cloneHTML = clone[0].outerHTML;
        cloneHTML = '<tr class="' + trClass + '">' + cloneHTML + '</tr>';
        return cloneHTML;
    }

    function createTransparentDragDropCol(pageX) {
        var $tableWrap = dragInfo.$table;
        var $table = $tableWrap.find('table');
        dragInfo.$container.append('<div id="fauxCol" style="left:' +
                        (pageX - dragInfo.offsetLeft) + 'px;' +
                        'width:' + (dragInfo.colWidth) + 'px;' +
                        'margin-left:' + (-dragInfo.grabOffset) + 'px;">' +
                            '<table id="fauxTable" ' +
                            'class="dataTable xcTable" ' +
                            'style="width:' + (dragInfo.colWidth) + 'px">' +
                            '</table>' +
                        '</div>');
        dragInfo.fauxCol = $('#fauxCol');
        var $fauxTable = $('#fauxTable');

        var rowHeight = gRescol.minCellHeight;
        // turn this into binary search later
        var topPx = $table.find('.header').offset().top - rowHeight;
        var topRowIndex = -1;
        var topRowEl;
        $table.find('tbody tr').each(function() {
            if ($(this).offset().top > topPx) {
                topRowIndex = $(this).index();
                topRowEl = $(this).find('td');
                return (false);
            }
        });

        var cloneHTML = "";
        // check to see if topRowEl was found;
        if (topRowIndex === -1) {
            console.error("BUG! Cannot find first visible row??");
            // Clone entire shit and be.then.
            $table.find('tr').each(function(i, ele) {
                cloneHTML += cloneCellHelper(ele);
            });
            $fauxTable.append(cloneHTML);
            return;
        }

        // Clone head

        $table.find('tr:first').each(function(i, ele) {
            cloneHTML += cloneCellHelper(ele);
        });

        if (dragInfo.selected) {
            $fauxTable.addClass('selectedCol');
        }
        if (dragInfo.isMinimized) {
            $fauxTable.addClass('userHidden');
        }

        var totalRowHeight = $tableWrap.height() -
                             $table.find('th:first').outerHeight();
        var numRows = Math.ceil(totalRowHeight / rowHeight);

        $table.find('tr:gt(' + (topRowIndex) + ')').each(function(i, ele) {
            cloneHTML += cloneCellHelper(ele);
            if (i >= numRows + topRowIndex) {
                return (false);
            }
        });
        $fauxTable.append(cloneHTML);

        // Ensure rows are offset correctly
        var fauxTableHeight = $fauxTable.height() +
                              $fauxTable.find('tr:first').outerHeight();
        var tableTitleHeight = $tableWrap.find('.tableTitle').height();

        var xcTableWrapHeight = $tableWrap.height();
        var theadHeight = dragInfo.$tableWrap.find(".xcTheadWrap").length ? 36 : 0;
        var fauxColHeight = Math.min(fauxTableHeight, xcTableWrapHeight - theadHeight);
        dragInfo.fauxCol.height(fauxColHeight);
        var firstRowOffset = $(topRowEl).offset().top - topPx - rowHeight;
        $fauxTable.css('margin-top', firstRowOffset);
        $fauxTable.find('tr:first-child').css({'margin-top':
                                    -(firstRowOffset + tableTitleHeight)});
    }

    function createDropTargets(dropTargetIndex, swappedColIndex) {
        var dragMargin = 30;
        if (dragInfo.isMinimized) {
            dragMargin = 10;
        }
        var colLeft;
        // targets extend this many pixels to left of each column

        if (!dropTargetIndex) {
            // create targets that will trigger swapping of columns on hover
            var dropTargets = "";
            dragInfo.$table.find('tr').eq(0).find('th').each(function(i) {
                if (i === 0 || i === dragInfo.colIndex) {
                    return true;
                }
                colLeft = $(this).position().left;
                var targetWidth;

                if ((dragInfo.colWidth - dragMargin) <
                    Math.round(0.5 * $(this).width()))
                {
                    targetWidth = dragInfo.colWidth;
                } else {
                    targetWidth = Math.round(0.5 * $(this).outerWidth()) +
                                    dragMargin;
                }
                dropTargets += '<div id="dropTarget' + i + '" class="dropTarget"' +
                                'style="left:' +
                                (colLeft - dragMargin + dragInfo.grabOffset) + 'px;' +
                                'width:' + targetWidth + 'px;height:' +
                                dragInfo.docHeight + 'px;">' +
                                    i +
                                '</div>';
            });
            var scrollLeft = dragInfo.$container.scrollLeft();
            // may have issues with table left if dragInfo.$table isn't correct
            var tableLeft = dragInfo.$table[0].getBoundingClientRect().left +
                scrollLeft;
            $('body').append('<div id="dropTargets" style="' +
                    'margin-left:' + tableLeft + 'px;' +
                    'left:' + (-scrollLeft) + 'px;">' + dropTargets + '</div>');
            $('#dropTargets').on('mouseenter', '.dropTarget', function() {
                dragdropSwapColumns($(this));
            });
            dragInfo.$container.scroll(mainFrameScrollDropTargets);

        } else {
            // targets have already been created, so just adjust the one
            // corresponding to the column that was swapped
            var swappedCol = dragInfo.$table.find('th:eq(' + swappedColIndex + ')');
            colLeft = swappedCol.position().left;
            $('#dropTarget' + dropTargetIndex).attr('id',
                                                    'dropTarget' + swappedColIndex);
            var dropTarget = $('#dropTarget' + swappedColIndex);
            dropTarget.css({'left': (colLeft - dragMargin + dragInfo.grabOffset) +
                            'px'});
            if (isBrowserSafari) {
                // safari has a display issue, use this to resolve T_T
                var $header = swappedCol.find(".header");
                $header.height($header.height() + 1);
                setTimeout(function() {
                    $header.height($header.height() - 1);
                }, 1);
            }
        }
    }

    function mainFrameScrollDropTargets(event) {
        var left = -$(event.target).scrollLeft();
        $('#dropTargets').css('left', left);
    }

    function dragdropSwapColumns($el) {
        var dropTargetId = parseInt(($el.attr('id')).substring(10));
        var nextCol = dropTargetId - Math.abs(dropTargetId - dragInfo.colIndex);
        var prevCol = dropTargetId + Math.abs(dropTargetId - dragInfo.colIndex);
        var movedCol;
        if (dropTargetId > dragInfo.colIndex) {
            dragInfo.$table.find('tr').each(function() {
                $(this).children(':eq(' + dropTargetId + ')').after(
                    $(this).children(':eq(' + nextCol + ')')
                );
            });
            movedCol = nextCol;
        } else {
            dragInfo.$table.find('tr').each(function() {
                $(this).children(':eq(' + dropTargetId + ')').before(
                    $(this).children(':eq(' + prevCol + ')')
                );
            });
            movedCol = prevCol;
        }

        // // HACK: weird hack hide show or else .header won't reposition itself
        // dragInfo.$table.find('.header').css('height', '35px');
        // setTimeout(function() {
        //     dragInfo.$table.find('.header').css('height', '36px');
        // }, 0);

        var left = dragInfo.element.position().left;
        $('#shadowDiv').css('left', left);
        dragInfo.colIndex = dropTargetId;
        createDropTargets(dropTargetId, movedCol);
    }

    /* END COLUMN DRAG DROP */

    /* Start Helper Functions */

    // scrolls #mainFrame while draggin column or table
    function dragdropMoveMainFrame(dragInfo, timer) {
        // essentially moving the horizontal mainframe scrollbar if the mouse is
        // near the edge of the viewport
        var $mainFrame = dragInfo.$container;
        var left;

        if (gMouseStatus === 'dragging') {
            if (dragInfo.pageX > dragInfo.windowWidth - 30) { // scroll right
                left = $mainFrame.scrollLeft() + 40;
                $mainFrame.scrollLeft(left);
            } else if (dragInfo.pageX < dragInfo.mainFrameLeft + 30) { // scroll left;
                left = $mainFrame.scrollLeft() - 40;
                $mainFrame.scrollLeft(left);
            }

            setTimeout(function() {
                dragdropMoveMainFrame(dragInfo, timer);
            }, timer);
        }
    }

    // prevents screen from scrolling during drag or resize
    function lockScrolling($target, direction) {
        if (direction === "horizontal") {
            var scrollLeft = $target.scrollLeft();
            $target.addClass('scrollLocked');
            $target.on('scroll.locked', function() {
                $target.scrollLeft(scrollLeft);
            });
        }
    }

    function unlockScrolling($target, direction) {
        $target.off('scroll.locked');
        if (direction === "horizontal") {
            $target.removeClass('scrollLocked');
        }
    }

    /* Unit Test Only */
    if (window.unitTestMode) {
        TblAnim.__testOnly__ = {};
        TblAnim.__testOnly__.checkColResize = checkColResize;
        TblAnim.__testOnly__.onColResize = onColResize;
        TblAnim.__testOnly__.endColResize = endColResize;
        TblAnim.__testOnly__.rowInfo = rowInfo;
        TblAnim.__testOnly__.dragInfo = dragInfo;
        TblAnim.__testOnly__.checkRowResize = checkRowResize;
        TblAnim.__testOnly__.onRowResize = onRowResize;
        TblAnim.__testOnly__.endRowResize = endRowResize;
        TblAnim.__testOnly__.checkColDrag = checkColDrag;
        TblAnim.__testOnly__.onColDrag = onColDrag;
        TblAnim.__testOnly__.endColDrag = endColDrag;
        TblAnim.__testOnly__.dragdropSwapColumns = dragdropSwapColumns;
        TblAnim.__testOnly__.dblClickResize = dblClickResize;

    }
    /* End Of Unit Test Only */

    return (TblAnim);

}(jQuery, {}));
