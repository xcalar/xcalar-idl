function prettifyJson(obj, indent, options) {
    if (typeof obj != 'object') {
        return (JSON.stringify(obj));
    }
    var result = "";
    var indent = indent || "";
    var options = options || {};
    options['inarray'] = options['inarray'] || 0;
    for (var key in obj) {
        var value = obj[key];
        switch (typeof value) {
        case ('string'):
            value = '"<span class="jString">'+value+'</span>"';
            if (options.inarray) {
                value = '<span class="jArray jInfo" data-key="'+
                        key+'">'+value+'</span>, ';
            }
            break;
        case ('number'):
            value = '<span class="jNum">'+value+'</span>';
            if (options.inarray) {
                value = '<span class="jArray jInfo" data-key="'+
                        key+'">'+value+'</span>,';
            } 
            break;
        case ('boolean'):
            value = '<span class="jBool">'+value+'</span>';
            if (options.inarray) {
                value += ',';
            }
            break;
        case ('object'):
            if (value.constructor == Array) {
                options.inarray++;
                value = '[<span class="jArray jInfo" data-key="'+
                        key+'">'+prettifyJson(value, indent, options)+
                        '</span>],';
            } else {
                var object = prettifyJson(value,
                                          indent+'&nbsp;&nbsp;&nbsp;&nbsp;');
                value = '{\n'+object +indent+'}'
                if (options.inarray) {
                    value = '<span class="jArray jInfo" data-key="'+
                            key+'">'+value+'</span>,';
                } 
            }
            break;
        default:
            value = '<span class="jUndf">'+value+'</span>';
            if (options.inarray) {
                value += ',';
            }
            break;
        }

        if (options.inarray) {
            result += value;
        } else {
            value = value.replace(/,$/, "");
            result += '<div class="jsonBlock jInfo" data-key="'+key+'">'+indent
            +'"<span class="jKey">'+key+'</span>": '+value+',</div>';
        }
    }
   
    options.inarray--;
    return (result.replace(/\,<\/div>$/, "</div>").replace(/\, $/, "")
                                                  .replace(/\,$/, "")); 
    // .replace used to remove comma if last value in object
}

function createJsonSelectionExpression(el) {
    var obj = "";
    el.parents('.jInfo').each(function(){
        var key = "";
        if ($(this).parent().hasClass('jArray') &&
            !$(this).hasClass('jsonBlock')) {
            key = '['+$(this).data('key')+']'; 
        } else if (!$(this).hasClass('jArray')) {
            key = '.'+$(this).data('key'); 
        }
        obj = key+obj;
    });
    if (obj.charAt(0) == '.') {
        obj = obj.substr(1);
    }
    return (obj);
}

function showJsonModal(jsonTd) {
    positionJsonModal(jsonTd);
    var tableTitle = jsonTd.closest('table').parent().parent()
                        .find('.xcTheadWrap .tableTitle input').val();
    $('#jsonModal').find('.jsonDragArea').text(tableTitle);

    $('.jKey, .jArray>.jString, .jArray>.jNum').click(function() {
        var tableNum = parseInt(jsonTd.closest('table').attr('id')
                                .substring(7));
        var name = createJsonSelectionExpression($(this));
        var id = $("#xcTable"+tableNum+" tr:first th").filter(function() {
                        return $(this).find("input").val() == "DATA";
                    });
        var colNum = parseColNum(id);

        // add cli
        var cliOptions = {};
        cliOptions.operation = 'addCol';
        cliOptions.tableName = gTables[tableNum].frontTableName;
        cliOptions.newColName = name;
        cliOptions.siblColName = gTables[tableNum].tableCols[colNum - 1].name;
        cliOptions.siblColIndex = colNum;
        cliOptions.direction = "L";


        addCol('col'+(colNum), 'xcTable'+tableNum, name, {direction: 'L', 
                select: true});

        addCli('Add Column', cliOptions);

        gTables[tableNum].tableCols[colNum-1].func.func = "pull";        
        gTables[tableNum].tableCols[colNum-1].func.args = [name];
        gTables[tableNum].tableCols[colNum-1].userStr = '"'+name+
                                                        '" = pull('+name+')';
        execCol(gTables[tableNum].tableCols[colNum-1], tableNum)
        .done(function() {
            updateMenuBarTable(gTables[tableNum], tableNum);
            autosizeCol($('#xcTable'+tableNum+' th.col'+(colNum)), 
                        {includeHeader: true, resizeFirstRow: true});
            $('#xcTable'+tableNum+' tr:first th.col'+(colNum+1)+
                    ' .editableHead').focus();
            // XXX call autosizeCol after focus if you want to make column wide 
            // enough to show the entire function in the header
            // autosizeCol($('#xcTable'+tableNum+' th.col'+(colNum+1)), 
            //             {includeHeader: true, resizeFirstRow: true});
            $('#jsonModal, #modalBackground').hide();
            $('body').removeClass('hideScroll');
        });
    });
    window.getSelection().removeAllRanges();
    $('body').addClass('hideScroll');
}

function positionJsonModal(jsonTd) {
    var winHeight = $(window).height();
    var winWidth = $(window).width();
    var jsonTdHeight = jsonTd.outerHeight(); 
    var jsonTdWidth = jsonTd.outerWidth(); 
    var jsonTdPos = jsonTd[0].getBoundingClientRect();
    var jsonString = $.parseJSON(jsonTd.find('.elementText').text());
    var newString = prettifyJson(jsonString);
    $('.jObject').html(newString);
    $('#jsonModal').show();
    $('#modalBackground').fadeIn(100);
    $('#jsonWrap').height(400).width(400);
    var modalHeight = $('#jsonModal').outerHeight();
    var modalWidth = $('#jsonModal').outerWidth();
    var closeHeight = 28;
    var closeWidth = 25;
    var closeTop = -8;
    var closeLeft = -closeWidth;

    if (jsonTdPos.top < winHeight/2) {
        var modalTop = jsonTdPos.top; 
    } else {
        var modalTop = jsonTdPos.top - modalHeight + jsonTdHeight;
        closeTop = modalHeight - closeHeight;
    }

    if (modalTop < 5) {
        modalTop = 5;
    } else if (modalTop+modalHeight > winHeight) {
        modalTop = Math.max(winHeight - modalHeight - 5, 5);
    }

    if (jsonTdPos.left+(jsonTdWidth/2) > (winWidth/2)) {
        var modalLeft = Math.min((jsonTdPos.left+(jsonTdWidth/2)) 
            - modalWidth, winWidth - modalWidth - 20);
        closeLeft = "auto";
    } else {
        var modalLeft = Math.max(jsonTdPos.left+(jsonTdWidth/2) , 20);
    }
    
    $('#jsonModal').css({'left': modalLeft, 'top': modalTop});
}

function jsonModalMouseDown(e) {
    gMouseStatus = "movingJson"
    gDragObj.mouseX = e.pageX;
    gDragObj.mouseY = e.pageY;
    gDragObj.left = parseInt($('#jsonModal').css('left'));
    gDragObj.top = parseInt($('#jsonModal').css('top'));

    var cursorStyle = '<style id="moveCursor" type="text/css">*'+ 
    '{cursor:move !important; cursor: -webkit-grabbing !important;'+
    'cursor: -moz-grabbing !important;}</style>';
    $(document.head).append(cursorStyle);
    disableTextSelection();
}
        
function jsonModalMouseMove(e) {
    var newX = e.pageX;
    var newY = e.pageY;
    var distX = newX - gDragObj.mouseX;
    var distY = newY - gDragObj.mouseY;
    $('#jsonModal').css('left',(gDragObj.left+distX)+'px');
    $('#jsonModal').css('top',(gDragObj.top+distY)+'px');
}

function jsonModalMouseUp() {
    gMouseStatus = null;
    reenableTextSelection();
    $('#moveCursor').remove();
}

