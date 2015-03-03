function generateFirstLastVisibleRowNum(rowScrollerMove) {
    //XXX table will need to be passed in
    if ($('#xcTableWrap'+gActiveTableNum).length == 0) {
        return;
    }
    var table = $('#xcTable'+gActiveTableNum);
    var tablePos = $('#xcTableWrap'+gActiveTableNum)[0]
                .getBoundingClientRect();
    var tdXCoor = 30; //top cell's distance from left side of tablewrap
    var tdYCoor = 80; //top cell's distance from top of tablewrap
    var tdBotYCoor = 18; //bottom cell's distance from bottom of tablewrap
    var firstRowNum;
    var lastRowNum;
    var firstEl = document.elementFromPoint(tdXCoor+tablePos.left,
                                            tdYCoor+tablePos.top);
    var firstId = $(firstEl).closest('tr').attr('class');

    if (firstId && firstId.length > 0) {
        var firstRowNum = parseInt(firstId.substring(3))+1;
    }

    var tdBottom = tablePos.bottom - tdBotYCoor; 
    
    if ($('#mainFrame').height() > table.height()) {
        var lastRowNum = table.find('tr:last td:first').text();
    } else {
        var lastEl = document.elementFromPoint(tdXCoor+tablePos.left, tdBottom);
        var lastId = $(lastEl).closest('tr').attr('class');
        if (lastId && lastId.length > 0) {
            var lastRowNum = parseInt(lastId.substring(3))+1;
        }
    }
    
    if (parseInt(firstRowNum) != NaN) {
        $('#pageBar .rowNum:first-of-type').html(firstRowNum);
        if (rowScrollerMove) {
            moverowScroller(firstRowNum, 
                gTables[gActiveTableNum].resultSetCount);
        }
    }
    if (parseInt(lastRowNum) != NaN) {
        $('#pageBar .rowNum:last-of-type').html(lastRowNum);
    } 
}

function resizableColumns(tableNum) {
    var $table = $('#xcTable'+tableNum);
    $table.find('.header').each(
        function() {
            if (!$(this).children().hasClass('colGrab') 
                &&!$(this).parent().is(':first-child')) {
                    var colGrab = $('<div class="colGrab"></div>');
                    $(this).prepend(colGrab);
                    colGrab.mousedown(
                        function(event) {
                            if (event.which === 1) {
                                gRescolMouseDown($(this), event);
                                dblClickResize($(this));
                            }
                        }
                    );
            }
        }
    );
    adjustColGrabHeight(tableNum);
    if (gRescol.first) {
        $table.find('th').each(
            function() {
                    var initialWidth = $(this).width();
                    $(this).width(initialWidth);
                    $(this).removeAttr('width');
            } 
        );
        gRescol.first = false;
    } 
}


function disableTextSelection() {
    window.getSelection().removeAllRanges();
    var style = '<style id="disableSelection" type="text/css">*'+ 
        '{ -ms-user-select:none;-moz-user-select:-moz-none;'+
        '-khtml-user-select:none;'+
        '-webkit-user-select:none;user-select:none; }</style>';
    $(document.head).append(style);
    $('input').prop('disabled', true);
}

function reenableTextSelection() {
    $('#disableSelection').remove();
    $('input').prop('disabled', false);
}

function gRescolMouseDown(el, event) {
    var headerWrap = el.closest('.xcTableWrap').find('.xcTheadWrap');
    var tableNum = parseInt(headerWrap.attr('id').substring(11));
    var rescol = gRescol;

    // var table = el.closest('table');
    var table = $('#xcTable'+tableNum);
    var colNum = parseColNum(el.parent().parent());
    if (el.parent().width() === 10) {
        // This is a hidden column! we need to unhide it
        // return;
        unhideCol(colNum, tableNum, {autoResize: false});
    }
    gMouseStatus = "resizingCol";
    event.preventDefault();
    var tableWidth = table.outerWidth();
    rescol.mouseStart = event.pageX;
    rescol.grabbedCell = el.parent().parent();  // the th 
    rescol.index = rescol.grabbedCell.index();
    rescol.startWidth = rescol.grabbedCell.outerWidth();
    rescol.tableNum = tableNum;
    rescol.table = table;
    // since the headers come in pairs, this is the second header
    rescol.headerDiv = el.parent();
    rescol.lastCell = table.find('thead:last th:last');
    rescol.lastCellWidth = rescol.lastCell.outerWidth();
    
    rescol.tableExcessWidth = tableWidth - gMinTableWidth;
    rescol.xcTheadWrap = headerWrap;
    var minTableWidth = tableWidth - 
                            (rescol.startWidth-rescol.cellMinWidth);
    rescol.minLastCellWidth = Math.max(gMinTableWidth - 
        (tableWidth - rescol.startWidth), rescol.cellMinWidth-5);

    if (rescol.grabbedCell.is(':last-child')) {
        rescol.lastCellGrabbed = true;
    }

    rescol.tempCellMinWidth = rescol.cellMinWidth-5;
    rescol.leftDragMax =  rescol.tempCellMinWidth - rescol.startWidth;

    // what the last cell width will be if current column is resized to minimum
    if ((tableWidth - (rescol.startWidth - rescol.cellMinWidth)) > 
            gMinTableWidth) {
        rescol.setLastCellWidth = rescol.lastCellWidth;
    } else {
        rescol.setLastCellWidth = rescol.lastCellWidth + (gMinTableWidth-
            (tableWidth + gRescol.leftDragMax));
    }

    disableTextSelection();
    $(document.head).append('<style id="ew-resizeCursor" type="text/css">*'+ 
        '{cursor: ew-resize !important;}</style>');
}

function gRescolMouseMove(event) {
    var rescol = gRescol;
    var dragDist = (event.pageX - rescol.mouseStart);
    if (dragDist > rescol.leftDragMax) {
        rescol.grabbedCell.outerWidth(rescol.startWidth + dragDist);
        rescol.headerDiv.outerWidth(rescol.startWidth + dragDist);
        if (dragDist <= -rescol.tableExcessWidth) {
            rescol.lastCell.outerWidth(rescol.lastCellWidth - 
                (dragDist + rescol.tableExcessWidth));
        }     
    } else if (dragDist < rescol.leftDragMax ) {
        rescol.grabbedCell.outerWidth(rescol.tempCellMinWidth);
        rescol.headerDiv.outerWidth(rescol.tempCellMinWidth);
        rescol.lastCell.outerWidth(rescol.setLastCellWidth);
    }
    var tableWidth = rescol.table.width();
    rescol.xcTheadWrap.outerWidth(tableWidth);
}

function gRescolMouseMoveLast(event) {
    var rescol = gRescol;
    var dragDist = (event.pageX - rescol.mouseStart);
    if (dragDist >= -rescol.tableExcessWidth) {
        if (dragDist > rescol.leftDragMax) {
            rescol.grabbedCell.outerWidth(rescol.startWidth + dragDist);
            rescol.headerDiv.outerWidth(rescol.startWidth + dragDist);
        } else {
            rescol.grabbedCell.outerWidth(rescol.tempCellMinWidth);
            rescol.headerDiv.outerWidth(rescol.tempCellMinWidth);
        } 
    } else {
        rescol.grabbedCell.outerWidth(rescol.minLastCellWidth);
        rescol.headerDiv.outerWidth(rescol.minLastCellWidth);
    } 
    var tableWidth = rescol.table.width();
    rescol.xcTheadWrap.outerWidth(tableWidth);
}

function gRescolMouseUp() {
    gMouseStatus = null;
    gRescol.lastCellGrabbed = false;
    $('#ew-resizeCursor').remove();
    reenableTextSelection();
    gRescol.table.find('.rowGrab').width(gRescol.table.width());
    var progCol = gTables[gRescol.tableNum].tableCols[gRescol.index-1];
    progCol.width = gRescol.grabbedCell.outerWidth();
}

function gResrowMouseDown(el, event) {
    gMouseStatus = "resizingRow";
    gResrow.mouseStart = event.pageY;
    gResrow.targetTd = el.closest('td');
    gResrow.tableNum = parseInt(el.closest('table').attr('id').substring(7));
    gResrow.startHeight = gResrow.targetTd.outerHeight();
    gResrow.rowIndex = gResrow.targetTd.closest('tr').index();
    disableTextSelection();
    var style = '<style id="ns-resizeCursor" type="text/css">*'+ 
        '{cursor: ns-resize !important;}</style>';
    $(document.head).append(style);
    $('body').addClass('hideScroll');
}

function gResrowMouseMove(event) {
    var mouseDistance = event.pageY - gResrow.mouseStart;
    var newHeight = gResrow.startHeight + mouseDistance;
    var row = gResrow.rowIndex;
    var padding = 4; // top + bottom padding in td
    if (newHeight < gRescol.minCellHeight) {
        gResrow.targetTd.outerHeight(gRescol.minCellHeight);
        $('#xcTable'+gResrow.tableNum+' tbody tr:eq('+row+') td > div').
            css('max-height', gRescol.minCellHeight-padding);
    } else {
        gResrow.targetTd.outerHeight(newHeight);
        $('#xcTable'+gResrow.tableNum+' tbody tr:eq('+row+') td > div').
            css('max-height', newHeight-padding);
    }
}

function gResrowMouseUp() {
    gMouseStatus = null;
    $('#ns-resizeCursor').remove();
    reenableTextSelection();
    $('body').removeClass('hideScroll'); 
    adjustColGrabHeight(gResrow.tableNum);
    generateFirstLastVisibleRowNum();
}

function dragdropMouseDown(el, event) {
    gMouseStatus = "movingCol";
    var dragObj = gDragObj;
    var cursorStyle = '<style id="moveCursor" type="text/css">*'+ 
        '{cursor:move !important; cursor: -webkit-grabbing !important;'+
        'cursor: -moz-grabbing !important;}</style>';
    $(document.head).append(cursorStyle);
    dragObj.mouseX = event.pageX;
    dragObj.colNum = parseColNum(el);
    var tableWrap = el.closest('.xcTableWrap');
    var $table = el.closest('.xcTable');
    var $tbodyWrap = $table.parent();
    dragObj.table = tableWrap;
    dragObj.tableNum = parseInt(tableWrap.attr('id').substring(11));
    dragObj.element = el;
    dragObj.colIndex = parseInt(el.index());
    dragObj.offsetTop = el.offset().top;
    dragObj.grabOffset = dragObj.mouseX - el.offset().left;
    // dragObj.grabOffset = distance from the left side of dragged column
    // to the point that was grabbed

    dragObj.docHeight = $(document).height();
    dragObj.val = el.find('.editableHead').val();
    var tableTitleHeight = tableWrap.find('.tableTitle').height();
    var shadowDivHeight = $tbodyWrap.height();
    var shadowTop = tableWrap.find('.header').position().top - 5;
    dragObj.inFocus =  el.find('.editableHead').is(':focus');
    dragObj.colWidth = el.width();
    dragObj.windowWidth = $(window).width();
    
    // create a replica shadow with same column width, height,
    // and starting position
    tableWrap.append('<div id="shadowDiv" style="width:'+
                            dragObj.colWidth+
                            'px;height:'+(shadowDivHeight)+'px;left:'+
                            (dragObj.element.position().left)+
                            'px;top:'+shadowTop+'px;"></div>');

    // create a fake transparent column by cloning 
    createTransparentDragDropCol();
    disableTextSelection();
    $tbodyWrap.addClass('hideScroll');
    createDropTargets();
    dragdropMoveMainFrame();
}

function dragdropMouseMove(event) {
    var pageX = event.pageX;
    var dragObj = gDragObj;
    dragObj.pageX = pageX;
    dragObj.fauxCol.css('left', pageX);
}

function dragdropMouseUp() {
    gMouseStatus = null;
    var dragObj = gDragObj;
    $('#shadowDiv, #fauxCol, #dropTargets, #moveCursor').remove(); 
    $('#mainFrame').off('scroll', mainFrameScrollDropTargets)
                   .scrollTop(0);
    reenableTextSelection();
    gDragObj.table.find('.xcTbodyWrap').removeClass('hideScroll');
    var progCol = gTables[dragObj.tableNum].tableCols[dragObj.colNum-1];
    var isDark = dragObj.element.hasClass('unusedCell');
    var selected = dragObj.element.hasClass('selectedCell');
    if (dragObj.inFocus) {
        dragObj.element.find('.editableHead').focus();
    }
    
    // only pull col if column is dropped in new location
    if ((dragObj.colIndex) != dragObj.colNum) { 
        setTimeout(function() {
            // add cli
            var cliOptions = {};
            cliOptions.tableName = gTables[dragObj.tableNum].frontTableName;
            cliOptions.colName = gTables[dragObj.tableNum]
                                 .tableCols[dragObj.colNum - 1].name;
            cliOptions.oldColIndex = dragObj.colNum;
            cliOptions.newColIndex = dragObj.colIndex;

            var storedScrollLeft =  $('#mainFrame').scrollLeft();
            delCol(dragObj.colNum, dragObj.tableNum, true);
            progCol.index = dragObj.colIndex;
            insertColAtIndex(dragObj.colIndex-1, dragObj.tableNum, progCol);
            addCol("col"+(dragObj.colIndex-1), "xcTable"+dragObj.tableNum, 
                    progCol.name, {width: progCol.width,
                    isDark: isDark, 
                    select: selected, 
                    inFocus: dragObj.inFocus,
                    progCol: progCol});

            execCol(progCol, dragObj.tableNum)
            .done(function() {
                updateMenuBarTable(gTables[dragObj.tableNum],
                                   dragObj.tableNum);
                //prevent scroll position from changing when 
                // you delete and add column
                $('#mainFrame').scrollLeft(storedScrollLeft);

                addCli('Change Column Order', cliOptions);
            });
        }, 0);
    }
}

function dragdropMoveMainFrame() {
    // essentially moving the horizontal mainframe scrollbar if the mouse is 
    // near the edge of the viewport
    var dragObj = gDragObj;
    if (gMouseStatus == 'movingCol' || gMouseStatus == 'movingTable') {
        if (dragObj.pageX > dragObj.windowWidth-2) {
            $('#mainFrame').scrollLeft(($('#mainFrame').scrollLeft()+50));
        } else if (dragObj.pageX > dragObj.windowWidth-20) {
            $('#mainFrame').scrollLeft(($('#mainFrame').scrollLeft()+20));
        } else if (dragObj.pageX < 2) {
            $('#mainFrame').scrollLeft(($('#mainFrame').scrollLeft()-50));
        } else if (dragObj.pageX < 20) {
            $('#mainFrame').scrollLeft(($('#mainFrame').scrollLeft()-20));
        }
        setTimeout(function() {
            dragdropMoveMainFrame();
        }, 40);
    }
}

function cloneCellHelper(obj) {
    var dragObj = gDragObj;
    var td = $(obj).children();
    var row = $("<tr></tr>");
    var rowColor = $(obj).css('background-color');
    var clone = td.eq(dragObj.colIndex).clone();
    var cloneHeight = td.eq(dragObj.colIndex).outerHeight();
    var cloneColor = td.eq(dragObj.colIndex).css('background-color');
    row.css('background-color', rowColor);
    clone.css('height', cloneHeight+'px');
    clone.outerWidth(dragObj.colWidth);
    clone.css('background-color', cloneColor);
    row.append(clone).appendTo($("#fauxTable"));
}

function createTransparentDragDropCol() {
    var dragObj = gDragObj;
    $('#mainFrame').append('<div id="fauxCol" style="left:'+
                    dragObj.mouseX+'px;'+
                    // 'top:'+(dragObj.offsetTop)+'px;'+
                    'width:'+(dragObj.colWidth)+'px;'+
                    'margin-left:'+(-dragObj.grabOffset)+'px;">'+
                        '<table id="fauxTable" '+
                        'class="dataTable xcTable" '+
                        'style="width:'+(dragObj.colWidth)+'px">'+
                        '</table>'+
                    '</div>');
    dragObj.fauxCol = $('#fauxCol');
    
    var rowHeight = 30;
    // turn this into binary search later
    var topPx = dragObj.table.find('.header').offset().top - rowHeight;
    var topRowIndex = -1;
    var topRowTd = null;
    dragObj.table.find('tbody tr').each(function() {
        if ($(this).offset().top > topPx) {
            topRowIndex = $(this).index();
            topRowEl = $(this).find('td');
            return (false);
        }
    });

    //XXX check to see if topRowEl was found;
    if (topRowIndex == -1) {
        console.log("BUG! Cannot find first visible row??");
        // Clone entire shit and be done.
        dragObj.table.find('tr').each(function(i, ele) {
            cloneCellHelper(ele);
        });
        return;
    }

    // Clone head
    dragObj.table.find('tr:first').each(function(i, ele) {
        cloneCellHelper(ele);
    });

    var totalRowHeight = dragObj.element
            .closest('#xcTableWrap'+dragObj.tableNum).height()-
            dragObj.table.find('th:first').outerHeight();
    var numRows = Math.ceil(totalRowHeight/rowHeight);
    var count = 0;
    dragObj.table.find('tr:gt('+(topRowIndex)+')')
        .each(function(i, ele) {
            cloneCellHelper(ele);
            count++;
            if (count >= numRows+topRowIndex) {
                return (false);
            }
    });

    // Ensure rows are offset correctly
    var fauxTableHeight = $('#fauxTable').height()+
                        $('#fauxTable tr:first').outerHeight();
    var xcTableWrap0Height = $('#xcTableWrap0').height();
    var fauxColHeight = Math.min(fauxTableHeight, xcTableWrap0Height - 36);
    dragObj.fauxCol.height(fauxColHeight);
    var firstRowOffset = $(topRowEl).offset().top - topPx-rowHeight;
    $('#fauxTable').css('margin-top', firstRowOffset);
    $('#fauxTable tr:first-child').css({'margin-top': 
            -($('#fauxTable tr:first').outerHeight()+firstRowOffset- 5)});
}

function createDropTargets(dropTargetIndex, swappedColIndex) {
    var dragObj = gDragObj;
    var dragMargin = 30; 
    // targets extend this many pixels to left of each column
   
    if (!dropTargetIndex) {
        // create targets that will trigger swapping of columns on hover
        var dropTargets = "";
        var i = 0;
        dragObj.table.find('tr:first th').each(function() {
            if (i == 0 || i == dragObj.colIndex) {
                i++;
                return true;  
            }
            var colLeft = $(this).position().left;
            if ((dragObj.colWidth-dragMargin) < 
                Math.round(0.5*$(this).width())) {
                var targetWidth = dragObj.colWidth;
            } else {
                var targetWidth = Math.round(0.5*$(this).outerWidth())+
                                  dragMargin;
            }
            dropTargets += '<div id="dropTarget'+i+'" class="dropTarget"'+
                            'style="left:'+
                            (colLeft-dragMargin+dragObj.grabOffset)+'px;'+
                            'width:'+targetWidth+'px;height:'
                            +(dragObj.docHeight)+'px;">'+i+
                            '</div>';
            i++;
        });
        var scrollLeft = $('#mainFrame').scrollLeft();
        // may have issues with table left if dragObj.table isn't correct
        var tableLeft = dragObj.table[0].getBoundingClientRect().left +
            scrollLeft;
        $('body').append('<div id="dropTargets" style="'+
                'margin-left:'+tableLeft+'px;'+
                'left:'+(-scrollLeft)+'px;"></div>');
        $('#dropTargets').append(dropTargets);
        $('.dropTarget').mouseenter(function() {
            dragdropSwapColumns($(this));
        });
        $('#mainFrame').scroll(mainFrameScrollDropTargets);
       
    } else {
        // targets have already been created, so just adjust the one 
        // corresponding to the column that was swapped
        var swappedCol = dragObj.table.find('th:eq('+swappedColIndex+')');
        var colLeft = swappedCol.position().left;
        $('#dropTarget'+dropTargetIndex)
            .attr('id', 'dropTarget'+swappedColIndex);
        var dropTarget = $('#dropTarget'+swappedColIndex);
        dropTarget.css({'left': (colLeft-dragMargin+dragObj.grabOffset)+'px'});
    }
}

function mainFrameScrollDropTargets(event) {
    var left = -$(event.target).scrollLeft();
    $('#dropTargets').css('left', left);
}

function dragdropSwapColumns(el) {
    var dragObj = gDragObj;
    var dropTargetId = parseInt((el.attr('id')).substring(10));
    var nextCol = dropTargetId - Math.abs(dropTargetId-dragObj.colIndex);
    var prevCol = dropTargetId + Math.abs(dropTargetId-dragObj.colIndex);
    var movedCol;
    if (dropTargetId>dragObj.colIndex) {
        dragObj.table.find('tr').each(function() { 
            $(this).children(':eq('+dropTargetId+')').after(
                $(this).children(':eq('+nextCol+')')
            );
        });
        movedCol = nextCol;
    } else {
        dragObj.table.find('tr').each(function() { 
            $(this).children(':eq('+dropTargetId+')').before(
                $(this).children(':eq('+prevCol+')')
            );
        });
        movedCol = prevCol;
    }

    // XXX weird hack hide show or else .header won't reposition itself
    dragObj.table.find('.header').css('height', '39px');
    setTimeout(function() {
         dragObj.table.find('.header').css('height', '40px');
    }, 0);
    
    var left = dragObj.element.position().left;
    $('#shadowDiv').css('left', left); 
    dragObj.colIndex = dropTargetId;
    createDropTargets(dropTargetId, movedCol);
}

function gRescolDelWidth(colNum, tableNum, resize) {
    var table = $('#xcTable'+tableNum);
    var oldTableWidth = table.width();
    if (!resize && (oldTableWidth < gMinTableWidth)) {
        var lastTd = table.find('tr:first th').length-1;
        var lastTdWidth = table.find('.table_title_bg.col'+lastTd).width();
        table.find('thead:last .table_title_bg.col'+lastTd).
            width(lastTdWidth + (gMinTableWidth - oldTableWidth)); 
    }
    matchHeaderSizes(colNum, $('#xcTable'+tableNum)) ;
}

function getTextWidth(el) {
    var width;
    if (el.is('input')) {
        var text = el.val()+" ";
    } else {
        var text = el.text();
    }
    tempDiv = $('<div>'+text+'</div>');
    tempDiv.css({'font-family': el.css('font-family'), 
        'font-size': el.css('font-size'),
        'font-weight': el.css('font-weight'), 
        'position': 'absolute', 
        'display': 'inline-block', 
        'white-space': 'pre'})
        .appendTo($('body'));
    width = tempDiv.width();
    tempDiv.remove();
    return (width);
}

function autosizeCol(el, options) {
    var index = parseColNum(el);
    var tableNum = parseInt(el.closest('.tableWrap').attr('id').substring(11));
    var options = options || {};
    var includeHeader = options.includeHeader || false;
    var resizeFirstRow = options.resizeFirstRow || false;
    var minWidth = options.minWidth || gRescol.cellMinWidth-10;
    var $table = $('#xcTable'+tableNum);
    var oldTableWidth = $table.width();
    var maxWidth = 700;
    var oldWidth = el.width();  
    var widestTdWidth = getWidestTdWidth(el, {includeHeader: includeHeader});
    var originalWidth = gTables[tableNum].tableCols[index-1].width;
    var newWidth = Math.max(widestTdWidth, minWidth);
    var dbClick = options && options.dbClick;
    // dbClick is autoSized to a fixed width
    if (!dbClick) {
        newWidth = Math.max(newWidth, originalWidth);
    }
    newWidth = Math.min(newWidth, maxWidth);
    var widthDiff = newWidth - oldWidth;
    // reassigning el from the fixed table header cell to the header cell
    // located in the table
    el = $table.find('th.col'+index); 
    if (widthDiff > 0) {
        $table.find('thead').width('+='+(newWidth-oldWidth));
        el.width(newWidth);
    } else if (oldTableWidth + widthDiff < gMinTableWidth) {
        el.width(newWidth);
        $table.find('tr:first th:last').outerWidth('+='+
            (gMinTableWidth-(oldTableWidth+widthDiff)));
    } else {
        el.width(newWidth);
    }
    gTables[tableNum].tableCols[index-1].width = el.width();
    matchHeaderSizes(index, $table);
}

function getWidestTdWidth(el, options) {
    var options = options || {};
    var includeHeader = options.includeHeader || false;
    var id = parseColNum(el);
    var tableWrap = el.closest('.tableWrap');
    var tableNum = parseInt(tableWrap.attr('id').substring(11));
    var table = $('#xcTable'+tableNum);
    var largestWidth = 0;
    var longestText = 0;
    var textLength;
    var padding = 10;
    var largestTd = table.find('tbody tr:first td:eq('+(id)+')');
    var headerWidth = 0;

    table.find('tbody tr').each(function() {
        // we're going to take advantage of monospaced font
        //and assume text length has an exact correlation to text width
        var td = $(this).children(':eq('+(id)+')');
        textLength = td.text().length;
        if (textLength > longestText) {
            longestText = textLength; 
            largestTd = td;
        }
    });

    largestWidth = getTextWidth(largestTd);

    if (includeHeader) {
        var th = table.find('.col'+id+' .editableHead');
        headerWidth = getTextWidth(th);
        if (headerWidth > largestWidth) {
            largestWidth = headerWidth;
        }
    }
    largestWidth += padding;
    return (largestWidth);
}

// XXX: Td heights are not persisted
function getTdHeights() {
    var tdHeights = [];
    $(".xcTable tbody tr").each(function() {
        tdHeights.push($(this).children().eq(0).outerHeight());
    });
    return (tdHeights);  
}

function dblClickResize(el) {
    gRescol.clicks++;  //count clicks
    if (gRescol.clicks === 1) {
        gRescol.timer = setTimeout(function() {   
            gRescol.clicks = 0; //after action performed, reset counter
        }, gRescol.delay);
    } else {
        gMouseStatus = null;
        reenableTextSelection();
        if (el.closest('tHead').index() == 0) {
            var resize = true;
        } else {
            var resize = false;
        }
        autosizeCol(el.parent().parent(), {resizeFirstRow: resize,
                                            dbClick: true});
        $('#ew-resizeCursor').remove();
        clearTimeout(gRescol.timer);    //prevent single-click action
        gRescol.clicks = 0;      //after action performed, reset counter
    }
}

function createTableHeader(tableNum) {
    var xcTableWrapTop = $('#xcTableWrap'+tableNum).offset().top;
    var xcTheadWrap = $('<div id="xcTheadWrap'+tableNum+
                '" class="xcTheadWrap dataTable"'+
                'style="top:0px;"></div>');

    $('#xcTableWrap'+tableNum).prepend(xcTheadWrap);
    //XX build this table title somewhere else
    if (gTables[tableNum] != undefined) {
        var tableName = gTables[tableNum].frontTableName;
    } else {
        var tableName = "";
    }
    xcTheadWrap.prepend('<div class="tableTitle"><div class="tableGrab"></div>'+
        '<input type="text" value="'+tableName+'">'+
        '<div class="dropdownBox"></div>'+
        '<ul class="colMenu tableMenu" id="tableMenu'+tableNum+'">'+
        '<li class="archiveTable">Archive Table</li>'+
        '<li class="unavailable">Hide Table</li>'+
        '<li class="deleteTable">Delete Table</li>'+
        '</ul>'+
        '</div>');
    xcTheadWrap.find('.tableTitle input').keyup(function(event) {
        if (event.which == keyCode.Enter) {
            $(this).blur();
        }
    });

    xcTheadWrap.find('.tableTitle > .dropdownBox').click(function() {
        dropdownClick($(this));
    });

    xcTheadWrap.find('.tableGrab').mousedown(function(event) {
        if (event.which != 1) {
            return;
        }
        dragTableMouseDown($(this).parent(), event);
    });

    var tableMenu = $('#tableMenu'+tableNum);

    tableMenu.find('.archiveTable').click(function() {
        var tableNum = parseInt($(this).closest('.tableMenu').
                       attr('id').substring(9));
        $(this).closest('.tableMenu').hide();

        // add cli
        var cliOptions = {};
        cliOptions.operation = 'archiveTable';
        cliOptions.tableName =  gTables[tableNum].frontTableName;

        archiveTable(tableNum, DeleteTable.Keep);

        addCli('Archive Table', cliOptions);
    });

    tableMenu.find('.deleteTable').click(function() {
        var tableNum = parseInt($(this).closest('.tableMenu').
                       attr('id').substring(9));
        $(this).closest('.tableMenu').hide();


        // add cli
        var cliOptions = {};
        cliOptions.operation = 'deleteTable';
        cliOptions.tableName = gTables[tableNum].frontTableName;

        deleteTable(tableNum)
        .done(function() {
            addCli('Delete Table', cliOptions);
        });
    });

    var $table = $('#xcTable'+tableNum);
    $table.width(0); 
    var matchAllHeaders = true;
    matchHeaderSizes(null, $table, matchAllHeaders);
}

function matchHeaderSizes(colNum, $table, matchAllHeaders) {
    if (matchAllHeaders) {
        var numCols = $table.find('th').length;
        for (var i = 0; i < numCols; i++) {
            var $header = $table.find('th.col'+i);
            var headerWidth = $header.outerWidth();
            $header.children().outerWidth(headerWidth);
        }
    } else {
        var $header = $table.find('th.col'+colNum);
        var headerWidth = $header.outerWidth();
        $header.children().outerWidth(headerWidth);
    }
    
    var tableWidth = $table.width();
    var tableNum = parseInt($table.attr('id').substring(7));
    $('#xcTheadWrap'+tableNum).width(tableWidth);
}

function displayShortenedHeaderName(el, tableNum, colNum) {
    if (gTables[tableNum].tableCols[colNum-1].name.length > 0) {
        el.val(gTables[tableNum].tableCols[colNum-1].name);
    }
}

function addColListeners(colId, $table) {;
    var tableNum = parseInt($table.attr('id').substring(7));
    var headerWrap = $('#xcTheadWrap'+tableNum);
    resizableColumns(tableNum);
    $table.find('.editableHead.col'+colId).focus(function() {
        var dynTableNum = parseInt($(this).closest('.dataTable').attr('id')
                          .substring(7));
        $('.colMenu').hide();
        $(this).closest('.xcTheadWrap').css('z-index', '9');
        $(this).closest('.header').css('z-index', '9');
        var index = parseColNum($(this));
        if (gTables[dynTableNum].tableCols[index-1].userStr.length > 0) {
            $(this).val(gTables[dynTableNum].tableCols[index-1].userStr);
        }
        updateFunctionBar($(this).val());
        gFnBarOrigin = $(this);
        highlightColumn($(this));
        $(this).parent().siblings('.dropdownBox')
            .addClass('hidden');
        focusTable(dynTableNum);
        $('#fnBar').addClass('active');
    }).blur(function() {
        var dynTableNum = parseInt($(this).closest('.dataTable').attr('id')
                          .substring(7));
        var index = parseColNum($(this));
        var el = $(this);
        setTimeout(
            function() {
                if (!$('#fnBar').is(':focus') && gFnBarOrigin != el) {
                    displayShortenedHeaderName(el, dynTableNum, index);
                }
                
            },
        1);

        $(this).parent().siblings('.dropdownBox')
            .removeClass('hidden');
        $('#fnBar').removeClass('active');
    });

    $table.find('.editableHead.col'+colId).keyup(function(e) {
        gFnBarOrigin = $(this);
        if (e.which == keyCode.Enter) {
            var index = parseColNum($(this));
            var tableNum = parseInt($(this).closest('.dataTable').attr('id')
                          .substring(7));
            var progCol = parseCol($(this).val(), index, tableNum, true);

            var self = this;
            execCol(progCol, tableNum)
            .done(function() {
                updateMenuBarTable(gTables[tableNum], tableNum);

                // add cli
                var cliOptions = {};
                cliOptions.operation = 'execCol';
                cliOptions.tableName = gTables[tableNum].frontTableName;
                cliOptions.colIndex = index;
                cliOptions.progCol = progCol.name;
                cliOptions.func = progCol.func.func;

                addCli("Prog Column", cliOptions);

                if (progCol.name.length > 0) {
                    $(self).val(progCol.name);
                } else {
                    // keep value that user entered
                }
                $(self).blur();
                $(self).closest('th').removeClass('unusedCell');
                table.find('td:nth-child('+index+')').removeClass('unusedCell');
            });
        }
    });

    $table.find('.editableHead.col'+colId).on('input', function(e) {
        updateFunctionBar($(this).val());
        gFnBarOrigin = $(this);
    });

    $table.find('.table_title_bg.col'+colId+' .header > .dropdownBox').
        click( 
            function() {
                dropdownClick($(this));
            }
        );

    $table.find('.table_title_bg.col'+colId+' .dropdownBox')
        .mouseenter(function() {
            $(this).removeClass('hidden');
    }).mouseout(function() {
        var input = $(this).siblings('.editableHead');
        if (input.is(':focus')) {
            $(this).addClass('hidden');
        }
    });

    $table.find('.table_title_bg.col'+colId+' .colMenu li')
        .mouseenter(function() {
            $(this).children('ul').addClass('visible');
            $(this).addClass('selected');
            if (!$(this).hasClass('inputSelected')) {
                $('.inputSelected').removeClass('inputSelected');
            }
        }).mouseleave(function(event) {
            $(this).children('ul').removeClass('visible');
            $(this).removeClass('selected');
            // console.log(event.target);
    });

    $table.find('.table_title_bg.col'+colId+' .subColMenuArea')
        .mousedown(function() {
            $('.colMenu').hide();
    });

    $table.find('.table_title_bg.col'+colId+' .dragArea')
        .mousedown(function(event) {
        if (event.which != 1) {
            return;
        }
        var headCol = $(this).parent().parent();
        dragdropMouseDown(headCol, event);
    }); 

    $table.find('.editableHead.col'+colId).mousedown(function(event) {
        //XXX Test to see if we even need this anymore
        event.stopPropagation();
    });

    $table.find('.table_title_bg.col'+colId+' .inputMenu span')
        .mousedown(function(){
            if ($(this).hasClass('openMenuInput')) {
                $(this).removeClass('openMenuInput');
            } else {
                $(this).addClass('openMenuInput');
            }
    });

    $table.find('.filterWrap.col'+colId).mouseenter(function() {
        clearTimeout($(this).data('timeout'));
    }).mouseleave(function(){
        var timeout = setTimeout(function() {
                            $('.openMenuInput').siblings('input').val(0);
                            $('.openMenuInput').removeClass('openMenuInput');
                        }, 200);
        $(this).data('timeout', timeout); 
    });
    var count = 0;
    $table.find('.table_title_bg.col'+colId+' .colMenu input')
        .focus(function() {
            $(this).parents('li').addClass('inputSelected')
            .parents('.subColMenu').addClass('inputSelected');
        }).keyup(function() {
            $(this).parents('li').addClass('inputSelected')
            .parents('.subColMenu').addClass('inputSelected');
        }).blur(function() {
            $(this).parents('li').removeClass('inputSelected')
            .parents('.subColMenu').removeClass('inputSelected');
    });

   addColMenuActions(colId, $table);
}

function addColMenuActions(colId, $table) {
    $table.find('.table_title_bg.col'+colId+' .colMenu li').click(
    function(event) {
        if ($(this).children('.subColMenu, input').length === 0) {
            if ($(this).hasClass('clickable')) {
                return;
            }
            // hide li if doesnt have a submenu or an input field
            $(this).closest('.colMenu').hide();
            $(this).closest('.xcTheadWrap').css('z-index', '9');
            $(this).closest('.header').css('z-index', '9');
        }
    });

    $table.find('.table_title_bg.col'+colId+' .addColumns').click(function() {
        var colNum = parseColNum($(this));
        var index = 'col'+ colNum;
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                       substring(7));
        var tableId = "xcTable"+tableNum;

        // add cli
        var cliOptions = {};
        cliOptions.operation = "addCol";
        cliOptions.tableName = gTables[tableNum].frontTableName;
        cliOptions.newColName = "";
        cliOptions.siblColName = gTables[tableNum].tableCols[colNum - 1].name;
        cliOptions.siblColIndex = colNum;

        var direction;
        if ($(this).hasClass('addColLeft')) {
            direction = "L";
            cliOptions.direction = "L";
        } else {
            cliOptions.direction = "R";
        }
        $('.colMenu').hide();
        $(this).closest('.xcTheadWrap').css('z-index', '9');
        $(this).closest('.header').css('z-index', '9');
        addCol(index, tableId, null, 
            {direction: direction, isDark: true, inFocus: true});

        addCli("Add Column", cliOptions);
    });
    
    $table.find('.deleteColumn.col'+colId).click(function() {
        var index = parseColNum($(this));
        var tableNum = parseInt($(this).closest('.dataTable')
                        .attr('id').substring(7));
        
        // add cli
        var cliOptions = {};
        cliOptions.operation = "delCol";
        cliOptions.tableName = gTables[tableNum].frontTableName;
        cliOptions.colName = gTables[tableNum].tableCols[index - 1].name;
        cliOptions.colIndex = index;

        delCol(index, tableNum);

        addCli('Delete Column', cliOptions);
    });

    $table.find('.renameCol.col'+colId).click(function() {
        var tableNum = parseInt($(this).closest('.dataTable')
                        .attr('id').substring(7));
        var index = parseColNum($(this));
        $('#xcTable'+tableNum).find('.editableHead.col'+index)
            .focus().select();
    });

    $table.find('.duplicate.col'+colId).click(function() {
        var index = parseColNum($(this));
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                       substring(7));
        var table = $('#xcTable'+tableNum);
        var name = table.find('.editableHead.col'+index).val();
        var width = table.find('th.col'+index).outerWidth();
        var isDark = table.find('th.col'+index).hasClass('unusedCell');

        // add cli
        var cliOptions = {};
        cliOptions.operation = 'duplicateCol'
        cliOptions.tableName = gTables[tableNum].frontTableName;
        cliOptions.colName = name;
        cliOptions.colIndex = index;

        addCol('col'+index, table.attr('id'),name, 
            {width: width, isDark: isDark});

        addCli('Duplicate Column', cliOptions);

        gTables[tableNum].tableCols[index].func.func = 
            gTables[tableNum].tableCols[index-1].func.func;
        gTables[tableNum].tableCols[index].func.args = 
            gTables[tableNum].tableCols[index-1].func.args;
        gTables[tableNum].tableCols[index].userStr = 
            gTables[tableNum].tableCols[index-1].userStr;
        execCol(gTables[tableNum].tableCols[index], tableNum)
        .done(function() {
            updateMenuBarTable(gTables[tableNum], tableNum);
        }); 
    });

    $table.find('.hide.col'+colId).click(function() {
        var index = parseColNum($(this));
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                       substring(7));
        hideCol(index, tableNum);
    });

    $table.find('.unhide.col'+colId).click(function() {
        var index = parseColNum($(this));
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                       substring(7));
        unhideCol(index, tableNum, {autoResize: true});
    });

    $table.find('.sort.col'+colId).click(function() {
        var index = parseColNum($(this));
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                       substring(7));
        sortRows(index, tableNum, SortDirection.Forward);
    }); 
    
    $table.find('.revSort.col'+colId).click(function() {
        var index = parseColNum($(this));
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                       substring(7));
        sortRows(index, tableNum, SortDirection.Backward);
    }); 
    
    $table.find('.aggrOp.col'+colId).click(function() {
        var index = parseColNum($(this));
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                       substring(7));
        var pCol = gTables[tableNum].tableCols[index-1];
        if (pCol.func.func != "pull") {
            console.log(pCol);
            alert("Cannot aggregate on column that does not exist in DATA.");
            return;
        }
        var colName = pCol.func.args[0];
        var aggrOp = $(this).closest('.aggrOp').text();
        console.log(colName+" "+gTables[tableNum].backTableName+" "+aggrOp);
        XcalarAggregate(colName, gTables[tableNum].backTableName, aggrOp)
        .done(function(value){
            // show result in alert modal
            var title = 'Aggregate: ' + aggrOp;
            var instruction = 'This is the aggregate result for column "' + 
                              colName + '". \r\n The aggregate operation is "' +
                              aggrOp + '".';
            showAlertModal({'title':title, 'msg':value, 
                            'instruction': instruction, 'isAlert':true,
                            'isCheckBox': true});
        });
    });

    $table.find('.filterWrap.col'+colId+' input').keyup(function(e) {
        var value = $(this).val();
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                       substring(7));
        if (e.which === keyCode.Enter) {
            var index = parseColNum($(this).closest('.filterWrap'));
            var operator = $(this).closest('.filter').text(); 
            console.log(operator, 'operator');

            filterCol(operator, value, index, tableNum);
        }
    });

    $table.find('.groupBy.col'+colId+' input').keyup(function(e) {
        var value = $(this).val();
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                       substring(7));
        if (e.which === keyCode.Enter) {
            var index = parseColNum($(this).closest('.groupBy'));
            var operator = $(this).closest('.gb').text(); 
            operator = operator.substring(0, operator.indexOf(
                                          "New Column Name"));
            console.log('operator: '+operator+"value: "+value+"index: "+
                        index+"tableNum: "+tableNum);
            $('.colMenu').hide();
            groupByCol(operator, value, index, tableNum);
        }
    });

    $table.find('.filter.col'+colId+' input').click(function() {
        $(this).select();
    });

    $table.find('.joinList.col' + colId).click(function() {
        var tableNum = parseInt($(this).closest('.dataTable').attr('id').
                   substring(7));
        colId = parseColNum($(this));
        setupJoinModalTables(tableNum, colId);
        $('.colMenu').hide();
    });
}

function dropdownClick(el, outside) {
    $('.colMenu').hide();
    $('.leftColMenu').removeClass('leftColMenu');
    //position colMenu
    var topMargin = -4;
    var leftMargin = 5;
    var top = el[0].getBoundingClientRect().bottom + topMargin;
    var left = el[0].getBoundingClientRect().left + leftMargin;
    if (outside) {
        var tableNum = parseInt(el.closest('.datasetTableWrap').attr('id')
                       .substring(16));
        var menu = $('#outerColMenu'+tableNum);
    } else {
        var menu = el.siblings('.colMenu');
    }
    
    menu.css({'top':top, 'left':left});
    menu.show();
    $('.xcTheadWrap').css('z-index', '9');
    $('.header').css('z-index', '9');
    menu.closest('.xcTheadWrap').css('z-index', '10');
    menu.closest('.header').css('z-index', '10');

    //positioning if dropdown menu is on the right side of screen
    var leftBoundary = $('#rightSideBar')[0].getBoundingClientRect().left;
    if (menu[0].getBoundingClientRect().right > leftBoundary) {
        left = el[0].getBoundingClientRect().right - menu.width();
        menu.css('left', left).addClass('leftColMenu');
    }
    menu.find('.subColMenu').each(function() {
        if ($(this)[0].getBoundingClientRect().right > leftBoundary) {
            menu.find('.subColMenu').addClass('leftColMenu');
        }
    });
}

function highlightColumn(el, keepHighlighted) {
    var index = parseColNum(el);
    var tableNum = parseInt(el.closest('.dataTable').attr('id').
                       substring(7));
    var table = $('#xcTable'+tableNum);
    var tables = $('#xcTable'+tableNum+', #xcTheadWrap'+tableNum);
    $('.selectedCell').removeClass('selectedCell');
    tables.find('th.col'+index).addClass('selectedCell');
    table.find('td.col'+index).addClass('selectedCell');

}

function checkForScrollBar(tableNum) {
    // var tableWidth = $('#xcTable'+tableNum).width()+
    //     parseInt($('#xcTable'+tableNum).css('margin-left'));
    // if ($('.xcTable').length > 1) {
    //     gScrollbarHeight = 0;
    // }else if (tableWidth > $(window).width()) {
    //     console.log('yes', $('.xcTable').length > 1)
    //     gScrollBarHeight = 0;
    //     // gScrollbarHeight = getScrollBarHeight();
    // } else {
    //     gScrollbarHeight = 0;
    // }
    //XXX this entire function may not be needed
    gScrollbarHeight = 0;
}

function checkForMainFrameScrollBar() {
    if ($('#mainFrame')[0].scrollWidth > $('#mainFrame').width()) {
        var forMainFrame = true;
        gScrollbarHeight = getScrollBarHeight(forMainFrame);
    } else {
        gScrollbarHeight = 0;
    } 
    console.log('mainframescrollheight', gScrollbarHeight) 
}

function positionScrollbar(row, tableNum) {
    console.log('positioning scrollbar')
    var canScroll = true;
    var table = $('#xcTable'+tableNum);
    var theadHeight = table.find('thead').height();
    function positionScrollToRow() {
        var tdTop = table.find('.row'+(row-1))[0].offsetTop;
        var scrollPos = Math.max((tdTop-theadHeight), 1);
        if (canScroll && scrollPos > 
                (table.height() - $('#xcTableWrap'+tableNum).height())) {
            canScroll = false;
        }
        $('#xcTbodyWrap'+tableNum).scrollTop(scrollPos);
    }
    
    positionScrollToRow();
    if (!canScroll) {
        // this means we can't scroll to page without moving scrollbar all the
        // way to the bottom, which triggers another getpage and thus we must
        // try to position the scrollbar to the proper row again
        setTimeout(positionScrollToRow, 1);
    }
}

function getScrollBarHeight(outerDiv) {
    console.log('gettingScrollBarHeight')
    var inner = $('<div style="width:100%;height:200px;"></div>');
    if (outerDiv) {
        var outer = $('<div id="mainFrame" style="position:absolute;'+
                    'top:0;left:0;visibility:hidden;width:200px;'+
                    'height:150px;overflow:hidden;"></div>');
    } else {
        var outer = $('<div class="tableWrap" style="position:absolute;'+
                    'top:0;left:0;visibility:hidden;width:200px;'+
                    'height:150px;overflow:hidden;"></div>');
    }
    
    outer.append(inner);
    $('body').append(outer);
    var width1 = inner.outerWidth();
    outer.css('overflow', 'scroll');
    var width2 = inner.outerWidth();
    if (width1 == width2) {
        width2 = outer[0].clientWidth;
    }
    outer.remove();
    return (width1 - width2);
}

function addRowListeners(newCells) {
    newCells.find('.jsonElement').dblclick(function() {
            showJsonModal($(this));
        }
    );
    newCells.find('.rowGrab').mousedown(function(event) {
         if (event.which === 1) {
            gResrowMouseDown($(this), event);
        }     
    });

    newCells.find('.idSpan').click(function() {
        var tableNum = parseInt($(this).closest('table').attr('id')
                .substring(7));
        var rowNum = parseInt($(this).closest('tr').attr('class').substring(3));
        if (gTables[tableNum].bookmarks.indexOf(rowNum) < 0) {
            bookmarkRow(rowNum, tableNum);
        } else {
            unbookmarkRow(rowNum, tableNum);
        }
    });
}

function addTableListeners(tableNum) {
    $('#xcTableWrap'+tableNum).mousedown(function() { 
        var dynTableNum = parseInt($(this).closest('.tableWrap').attr('id')
                       .substring(11));
        $('.tableTitle').removeClass('tblTitleSelected');
        $('#xcTheadWrap'+dynTableNum+' .tableTitle')
            .addClass('tblTitleSelected');
        gActiveTableNum = dynTableNum;
        updatePageBar(dynTableNum);
        generateFirstLastVisibleRowNum();
    }).scroll(function() {
        $(this).scrollLeft(0); // prevent scrolling when colmenu is open
    });
}

function focusTable(tableNum) {
    $('#mainFrame').find('.tableTitle').removeClass('tblTitleSelected');
    $('#xcTheadWrap'+tableNum).find('.tableTitle')
        .addClass('tblTitleSelected');
    gActiveTableNum = tableNum;
    updatePageBar(tableNum);
}

function moverowScroller(pageNum, resultSetCount) {
    var pct = 100* (pageNum/resultSetCount);
    $('#rowMarker'+gActiveTableNum)
        .css('transform', 'translate3d('+pct+'%, 0px, 0px)');

}

function setupBookmarkArea() {
    $('#rowScrollerArea').mousedown(function(event) {
    // $('#rowScroller'+tableNum).mousedown(function(event) {
        if (event.which != 1) {
            return;
        }
        if ($(event.target).hasClass('subRowMarker')) {
            rowScrollerStartDrag(event, $(event.target).parent());
            return;
        }
        // console.log(event.target)
        var tableNum = gActiveTableNum;
        var rowScroller = $('#rowScroller'+tableNum)
        var mouseX = event.pageX - rowScroller.offset().left;
        var rowPercent = mouseX/$(this).width();

        var translate = Math.min(99.9, Math.max(0,rowPercent * 100));
        $('#rowMarker'+tableNum).css('transform', 
                                'translate3d('+translate+'%, 0px, 0px)'); 
        
        var rowNum = Math.ceil(rowPercent*gTables[tableNum].resultSetCount);
        if (rowScroller.find('.bookmark').length > 0) {
            // check 8 pixels around for bookmark?
            var yCoor = rowScroller.offset().top+rowScroller.height()-5;
            for (var x = (event.pageX-4); x < (event.pageX+4); x++) {
                var element = $(document.elementFromPoint(x, yCoor));
                if (element.hasClass('bookmark')) {
                    rowNum = parseBookmarkNum(element);
                    break;
                }
            }
        }
        
        // var rowInputNum = $("#rowInput").val();
        var e = $.Event("keypress");
        e.which = keyCode.Enter;
        e['rowScrollerMousedown'] = true;
        var el = $(this)
        setTimeout( function() {
            $("#rowInput").val(rowNum).trigger(e);
        }, 145);
    });
}

function addRowScroller(tableNum) {
    var rowScrollerHTML = '<div id="rowScroller'+tableNum+
        '" class="rowScroller" data-toggle="tooltip"'+
            'data-placement="bottom" title="scroll to a row">'+
            '<div id="rowMarker'+tableNum+'" class="rowMarker">'+
            '<div class="subRowMarker top"></div>'+
            '<div class="subRowMarker middle"></div>'+
            '<div class="subRowMarker bottom"></div>'+
            '</div>'+
        '</div>';

    if (tableNum == 0) {
        $('#rowScrollerArea').prepend(rowScrollerHTML);
    } else {
        $('#rowScroller'+(tableNum-1)).after(rowScrollerHTML);
    }
    if ($('.xcTable').length > 1) {
        $('#rowScroller'+tableNum).hide();
    }  
}

function showRowScroller(tableNum) {
    $('.rowScroller').hide();
    $('#rowScroller'+tableNum).show();
}

function bookmarkRow(rowNum, tableNum) {
    //XXX allow user to select color in future? 
    var td = $('#xcTable'+tableNum+' .row'+rowNum+ ' .col0');
    td.addClass('rowBookmarked');
    td.find('.idSpan').attr('title', 'bookmarked');
    var leftPos = 100*(rowNum/gTables[tableNum].resultSetCount);
    var bookmark = $('<div class="bookmark bkmkRow'+rowNum+'"'+
        ' style="left:'+leftPos+'%;" data-toggle="tooltip" '+
        ' data-placement="bottom" title="row '+
        (rowNum+1)+'"></div>');
    $('#rowScroller'+tableNum).append(bookmark);
    if (gTables[tableNum].bookmarks.indexOf(rowNum) < 0) {
        gTables[tableNum].bookmarks.push(rowNum);
    }
}

function unbookmarkRow(rowNum, tableNum) {
    console.log('unbookmark')
    var td = $('#xcTable'+tableNum+' .row'+rowNum+ ' .col0');
    td.removeClass('rowBookmarked');
    td.find('.idSpan').attr('title', '');
    console.log('#bkmkRow'+rowNum);
    $('#rowScroller'+tableNum).find('.bkmkRow'+rowNum).remove();
    var index = gTables[tableNum].bookmarks.indexOf(rowNum);
    gTables[tableNum].bookmarks.splice(index,1);
}

function parseBookmarkNum(el) {
    var classNames = el.attr('class');
    var index = classNames.indexOf('bkmkRow')+'bkmkRow'.length;
    return parseInt(classNames.substring(index))+1;
}

function updatePageBar(tableNum) {
    showRowScroller(tableNum);
    if ($.isEmptyObject(gTables[gActiveTableNum])) {
        $('#numPages').text("");
    } else {
        var num = Number(gTables[gActiveTableNum].resultSetCount).
                    toLocaleString('en');
        $('#numPages').text('of '+num);
    }
}

function rowScrollerStartDrag(event, el) {
    gMouseStatus = "rowScroller";
    el.addClass('scrolling');
    gResrow.el = el;
    gResrow.mouseStart = event.pageX;
    gResrow.scrollAreaOffset = el.parent().offset().left;
    gResrow.rowScrollerWidth = el.parent().width(); 
    var scrollerPositionStart = el.position().left;
    var mouseOffset = gResrow.mouseStart - el.offset().left;
    var cssLeft = parseInt(el.css('left'));
    gResrow.totalOffset = mouseOffset + cssLeft;
    gResrow.boundary = {
        lower: gResrow.scrollAreaOffset, 
        upper: gResrow.scrollAreaOffset + gResrow.rowScrollerWidth 
    }

    var cursorStyle = '<style id="moveCursor" type="text/css">*'+ 
    '{cursor:pointer !important}</style>';
    $(document.head).append(cursorStyle);
    disableTextSelection();
}

function rowScrollerMouseMove(event) {
    var mouseX = event.pageX;
    var translate;
    if (mouseX - gResrow.totalOffset < gResrow.boundary.lower) {
        translate = 0;
    } else if (mouseX - gResrow.totalOffset > gResrow.boundary.upper ) {
        translate = 100;
    } else {
        translate = 100 * (mouseX - gResrow.scrollAreaOffset 
                    - gResrow.totalOffset) / (gResrow.rowScrollerWidth - 1);
    }
    gResrow.el.css('transform', 'translate3d('+translate+'%, 0px, 0px)'); 
}

function rowScrollerMouseUp() {
    gMouseStatus = null;
    gResrow.el.removeClass('scrolling');
    $('#moveCursor').remove();
    reenableTextSelection();
    var e = $.Event("mousedown");
    e.which = 1;
    e.pageX = (gResrow.el.offset().left - parseInt(gResrow.el.css('left')) + 0.5);
    if (e.pageX + 3 >= gResrow.rowScrollerWidth + gResrow.scrollAreaOffset) {
        e.pageX += 3;
    } else if (e.pageX - 2 <= gResrow.scrollAreaOffset) {
        e.pageX -= 2;
    }
    $("#rowScrollerArea").trigger(e);
}

function resizeRowInput() {
    var resultTextLength = (""+gTables[gActiveTableNum].resultSetCount).length;
    if (resultTextLength > $('#rowInput').attr('size')) {
        $('#rowInput').attr({'maxLength': resultTextLength,
                          'size': resultTextLength});
    }  
}
    
function dragTableMouseDown(el, e) {
    gMouseStatus = "movingTable"
    gDragObj.mouseX = e.pageX;
    gDragObj.table = el.closest('.xcTableWrap');
    gDragObj.tableIndex = parseInt(gDragObj.table.attr('id').substring(11));
    gDragObj.originalIndex = gDragObj.tableIndex;
    gDragObj.mainFrame = $('#mainFrame');
    var rect = gDragObj.table[0].getBoundingClientRect();

    // gDragObj.rectLeft = rect.left - gDragObj.mouseX;
    // gDragObj.maxScroll = $('#mainFrame')[0].scrollWidth -
    //                      $('#mainFrame').width();


    gDragObj.offsetLeft = gDragObj.table.offset().left;
    gDragObj.prevTable = gDragObj.table.prev();
    gDragObj.mouseOffset = gDragObj.mouseX - rect.left;
    gDragObj.docHeight = $(document).height();
    gDragObj.tableScrollTop = gDragObj.table.scrollTop();

    var cursorStyle = '<style id="moveCursor" type="text/css">*'+ 
    '{cursor:move !important; cursor: -webkit-grabbing !important;'+
    'cursor: -moz-grabbing !important;}</style>';
    $(document.head).append(cursorStyle);
    createShadowTable();
    sizeTableForDragging();
    gDragObj.table.addClass('tableDragging');
    gDragObj.table.css('left', gDragObj.offsetLeft+'px');
    gDragObj.windowWidth = $(window).width();
    gDragObj.pageX = e.pageX;
    checkForMainFrameScrollBar();
    gDragObj.table.scrollTop(gDragObj.tableScrollTop);
    createTableDropTargets();
    dragdropMoveMainFrame();
    disableTextSelection();
}
    
function dragTableMouseMove(e) {
    // var left = gDragObj.offsetLeft + (e.pageX - gDragObj.mouseX);
    var left =  e.pageX - gDragObj.mouseOffset;
    gDragObj.table.css('left',left+'px');
    gDragObj.pageX = e.pageX;
}

function dragTableMouseUp() {
    gMouseStatus = null;
    gDragObj.table.removeClass('tableDragging')
                    .css({'left':'0px', 'height':'100%'});
    $('#shadowTable, #moveCursor, #dropTargets').remove();
    $('#mainFrame').off('scroll', mainFrameScrollTableTargets);
    gDragObj.table.scrollTop(gDragObj.tableScrollTop);
    gActiveTableNum = gDragObj.tableIndex;
    checkForScrollBar();
    reenableTextSelection(); 

    if (gDragObj.tableIndex != gDragObj.originalIndex) {
        // reorder only if order changed
        reorderAfterTableDrop();
    }
}

function createShadowTable() {
    var rect = gDragObj.table[0].getBoundingClientRect();
    var width = gDragObj.table.children().width();
    // var height = Math.min($('#mainFrame').height()-gScrollbarHeight, 
    //     gDragObj.table.children().height());
    var tableHeight = gDragObj.table.find('.xcTheadWrap').height() + 
                      gDragObj.table.find('.xcTbodyWrap').height();
    var shadowTable = '<div id="shadowTable" '+
                'style="width:'+width+'px;height:'+tableHeight+'px;">'+
            '</div>';

    if (gDragObj.prevTable.length > 0) {
        gDragObj.prevTable.after(shadowTable );
    } else {
        $('#mainFrame').prepend(shadowTable);
    }
}

function createTableDropTargets(dropTargetIndex, oldIndex, swappedTable) {
    var offset = gDragObj.mouseX - gDragObj.offsetLeft;
    var dragMargin = 100;
    
    if (!swappedTable) {
        var dropTargets = "";
        var i = 0;
        var tableWidth = gDragObj.table.width();
        $('#mainFrame').find('.xcTableWrap').each(function() {
            if (i == gDragObj.tableIndex) {
                i++;
                return true;  
            }

            if ((tableWidth-dragMargin) < 
                    Math.round(0.5*$(this).outerWidth())) {
                var targetWidth = tableWidth;
            } else {
                var targetWidth = Math.round(0.5*$(this).outerWidth())+
                                  dragMargin;
            }
            var tableLeft = $(this).position().left + 
                            $('#mainFrame').scrollLeft();
            dropTargets += '<div id="dropTarget'+i+'" class="dropTarget"'+
                            'style="left:'+(tableLeft-dragMargin+offset)+'px;'+
                            'width:'+targetWidth+'px;height:'
                            +(gDragObj.docHeight)+'px;">'+i+
                            '</div>';
            i++;
        });

        var tableLeft = -$('#mainFrame').scrollLeft();
        $('body').append('<div id="dropTargets" style="left:'+
                tableLeft+'px;"></div>');
        $('#dropTargets').append(dropTargets);
        $('.dropTarget').mouseenter(function() {
            dragdropSwapTables($(this));
        });
        $('#mainFrame').scroll(mainFrameScrollTableTargets);
    } else {
        var tableLeft = swappedTable.position().left + 
                        $('#mainFrame').scrollLeft();
        $('#dropTarget'+dropTargetIndex).attr('id', 'dropTarget'+oldIndex);
        $('#dropTarget'+oldIndex)
            .css({'left': (tableLeft-dragMargin+offset)+'px'});
    }

}

function mainFrameScrollTableTargets() {
    var left = $('#mainFrame').scrollLeft();
    $("#dropTargets").css('left', '-'+left+'px');
}

function dragdropSwapTables(el) {
    var dropTargetIndex = parseInt((el.attr('id')).substring(10));
    var table = $('#xcTableWrap'+dropTargetIndex);
    var tableScrollTop = table.scrollTop();
    if (dropTargetIndex >gDragObj.tableIndex) {
        table.after($('#shadowTable'));
        table.after(gDragObj.table);
    } else {
        table.before($('#shadowTable'));
        table.before(gDragObj.table);
    }

    gDragObj.table.scrollTop(gDragObj.tableScrollTop);

    gDragObj.table.attr('id', 'xcTableWrap'+dropTargetIndex);
    gDragObj.table.find('.xcTheadWrap').attr('id',
                                             'xcTheadWrap'+dropTargetIndex);
     
    table.attr('id', 'xcTableWrap'+gDragObj.tableIndex);
    table.find('.xcTheadWrap').attr('id', 'xcTheadWrap'+gDragObj.tableIndex);
    
    var oldIndex = gDragObj.tableIndex;
    gDragObj.tableIndex = dropTargetIndex;
    createTableDropTargets(dropTargetIndex, oldIndex, table);
}

function sizeTableForDragging() {
    var tableHeight = $('#shadowTable').height();
    gDragObj.table.height(tableHeight);
}

function reorderAfterTableDrop() {

    var tempTable = gTables.splice(gDragObj.originalIndex, 1)[0];
    gTables.splice(gDragObj.tableIndex, 0, tempTable);
    
    // reorder rowScrollers
    var rowScroller = $('#rowScroller'+gDragObj.originalIndex);
    if (gDragObj.tableIndex == 0) {
        $('#rowScrollerArea').prepend(rowScroller);
    } else if (gDragObj.originalIndex < gDragObj.tableIndex) {
        $('#rowScroller'+gDragObj.tableIndex).after(rowScroller);
    } else if (gDragObj.originalIndex > gDragObj.tableIndex) {
        $('#rowScroller'+gDragObj.tableIndex).before(rowScroller);
    }

    // correct table and rowscroller id numbers
    var rowScrollers = $('.rowScroller');
    var start = Math.min(gDragObj.originalIndex, gDragObj.tableIndex);
    var end = Math.max(gDragObj.originalIndex, gDragObj.tableIndex);
    for (var i = start; i <= end; i++) {
        // tablewrap and xcTheadWrap IDs were already changed during table
        // swapping
        var tableWrap = $('#xcTableWrap'+i);
        var table = tableWrap.find('.xcTable');
        var oldIndex = parseInt(table.attr('id').substring(7));
        table.attr('id', 'xcTable'+i);
        tableWrap.find('.xcTbodyWrap').attr('id', 'xcTbodyWrap'+i);
        tableWrap.find('.tableMenu').attr('id', 'tableMenu'+i);
        $(rowScrollers[i]).attr('id', 'rowScroller'+i);
        $(rowScrollers[i]).find('.rowMarker').attr('id','rowMarker'+i);
    }
}

function adjustColGrabHeight(tableNum) {
    // console.log('adjusting height');
    var colGrabHeight = $('#xcTbodyWrap'+tableNum).height();
    $('#xcTable'+tableNum).find('.colGrab').height(colGrabHeight);
}
