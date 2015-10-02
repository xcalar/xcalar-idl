// this module support column related functions
window.ColManager = (function($, ColManager) {
    // new ProgCol obj
    ColManager.newCol = function(options) {
        var progCol = new ProgCol();

        for (var key in options) {
            progCol[key] = options[key];
        }

        return (progCol);

        // constructor
        function ProgCol() {
            this.index = -1;
            this.name = "New heading";
            this.type = "undefined";
            this.func = {};
            this.width = 0;
            this.sizeToHeader = true;
            this.userStr = "";
            this.isNewCol = true;
            this.textAlign = "Center";

            return (this);
        }
    };

    // special case, specifically for DATA col
    ColManager.newDATACol = function(index) {
        var progCol = ColManager.newCol({
            "index"  : index,
            "name"   : "DATA",
            "type"   : "object",
            "width"  : 500,    // copy from CSS
            "userStr": "DATA = raw()",
            "func"   : {
                "func": "raw",
                "args": []
            },
            "isNewCol": false
        });

        return (progCol);
    };

    ColManager.setupProgCols = function(tableId) {
        var keyName = xcHelper.getTableFromId(tableId).keyName;
        // We cannot rely on addCol to create a new progCol object because
        // add col relies on gTableCol entry to determine whether or not to add
        // the menus specific to the main key
        var newProgCol = ColManager.newCol({
            "index"  : 1,
            "name"   : keyName,
            "width"  : gNewCellWidth,
            "userStr": '"' + keyName + '" = pull(' + keyName + ')',
            "func"   : {
                "func": "pull",
                "args": [keyName]
            },
            "isNewCol": false
        });

        insertColHelper(0, tableId, newProgCol);
        // is this where we add the indexed column??
        insertColHelper(1, tableId, ColManager.newDATACol(2));
    };

    ColManager.addCol = function(colNum, tableId, name, options) {
        var $tableWrap = $("#xcTableWrap-" + tableId);
        var $table     = $tableWrap.find(".xcTable");
        var table      = xcHelper.getTableFromId(tableId);
        var numCols    = table.tableCols.length;
        var newColid   = colNum;

        // options
        options = options || {};
        var width       = options.width || gNewCellWidth;
        // var resize      = options.resize || false;
        var isNewCol    = options.isNewCol || false;
        var select      = options.select || false;
        var inFocus     = options.inFocus || false;
        var newProgCol  = options.progCol;
        var noAnimate   = options.noAnimate;
        var isHidden    = options.isHidden;
        var columnClass;
        var color;

        if (options.direction !== "L") {
            newColid += 1;
        }

        if (name == null) {
            name = "";
            select = true;
            columnClass = " newColumn";
        } else if (name === table.keyName) {
            columnClass = " indexedColumn";
        } else {
            columnClass = "";
        }


        if (select) {
            color = " selectedCell";
            $('.selectedCell').removeClass('selectedCell');
        } else if (isNewCol) {
            color = " unusedCell";
        } else {
            color = "";
        }

        if (!newProgCol) {
            name = name || "newCol";

            newProgCol = ColManager.newCol({
                "index"   : newColid,
                "name"    : name,
                "width"   : width,
                "userStr" : '"' + name + '" = ',
                "isNewCol": isNewCol,
                "isHidden": options.isHidden
            });

            insertColHelper(newColid - 1, tableId, newProgCol);
        }
        // change table class before insert a new column
        for (var i = numCols; i >= newColid; i--) {
            $tableWrap.find('.col' + i)
                      .removeClass('col' + i)
                      .addClass('col' + (i + 1));
        }
        // insert new th column
        options = {
            "name"    : name,
            "width"   : width,
            "isHidden": isHidden
        };
        var columnHeadHTML = generateColumnHeadHTML(columnClass, color,
                                                    newColid, options);
        $tableWrap.find('.th.col' + (newColid - 1)).after(columnHeadHTML);

        if (gMinModeOn || noAnimate) {
            updateTableHeader(tableId);
            RightSideBar.updateTableInfo(tableId);
            $table.find('.rowGrab').width($table.width());
        } else {
            var $th = $tableWrap.find('.th.col' + newColid);
            $th.width(10);
            if (!isHidden) {
                $th.animate({width: width}, 300, function() {
                        updateTableHeader(tableId);
                        RightSideBar.updateTableInfo(tableId);
                        matchHeaderSizes($table);
                    });
                moveTableTitlesAnimated(tableId, $tableWrap.width(),
                                    10 - width, 300);
            } else {
                updateTableHeader(tableId);
                RightSideBar.updateTableInfo(tableId);
                matchHeaderSizes($table);
            }
        }

        // get the first row in UI and start to add td to each row
        // var numRow = $table.find("tbody tr").length;
        var idOfFirstRow  = $table.find("tbody tr:first").attr("class");
        var idOfLastRow  = $table.find("tbody tr:last").attr("class");
        var startingIndex = idOfFirstRow ?
                                parseInt(idOfFirstRow.substring(3)) : 1;
        var endingIndex = parseInt(idOfLastRow.substring(3));

        if (columnClass !== " indexedColumn") {
            columnClass = ""; // we don't need to add class to td otherwise
        }

        var newCellHTML = '<td ' + 'class="' + color + ' ' + columnClass +
                          ' col' + newColid + '">' +
                            '&nbsp;' +
                          '</td>';

        var i = startingIndex;
        while (i <= endingIndex) {
            $table.find(".row" + i + " .col" + (newColid - 1))
                  .after(newCellHTML);
            i++;
        }

        if (inFocus) {
            $table.find('tr:first .editableHead.col' + newColid).focus();
        }
    };

    ColManager.delCol = function(colNums, tableId) {
        // deletes an array of columns
        var table     = gTables[tableId];
        var tableName = table.tableName;
        var $table    = $('#xcTable-' + tableId);
        var numCols   = colNums.length;
        var colNum;
        var colIndex;
        var colNames = [];
        var promises = [];
        var colWidths = 0;
        var tableWidth = $table.closest('.xcTableWrap').width();

        for (var i = 0; i < numCols; i++) {
            colNum = colNums[i];
            colIndex = colNum - i;
            var col = table.tableCols[colIndex - 1];
            colNames.push(col.name);
            if (col.isHidden) {
                colWidths += 15;
            } else {
                colWidths += table.tableCols[colIndex - 1].width;
            }
            promises.push(delColHelper(colNum, colNum, tableId, true, colIndex));
        }

        moveTableTitlesAnimated(tableId, tableWidth, colWidths, 200);

        jQuery.when.apply($, promises).done(function() {
            var numAllCols = table.tableCols.length;
            updateTableHeader(tableId);
            RightSideBar.updateTableInfo(tableId);
            for (var i = colNums[0]; i <= numAllCols; i++) {
                var oldColNum = xcHelper.parseColNum($table.find('th').eq(i));
                $table.find(".col" + oldColNum)
                      .removeClass('col' + oldColNum)
                      .addClass('col' + i);
            }
                
            matchHeaderSizes($table);
            xcHelper.removeSelectionRange();

             // add SQL
            SQL.add("Delete Column", {
                "operation": SQLOps.DeleteCol,
                "tableName": tableName,
                "tableId"  : tableId,
                "colNames" : colNames,
                "colNums"  : colNums
            });
        });
    };

    // specifically used for json modal
    ColManager.pullCol = function(colNum, tableId, nameInfo, pullColOptions) {
        var deferred = jQuery.Deferred();

        pullColOptions = pullColOptions || {};

        var isDataTd = pullColOptions.isDataTd || false;
        var isArray  = pullColOptions.isArray || false;
        var noAnimate = pullColOptions.noAnimate || false;

        var $table   = $("#xcTable-" + tableId);
        var table    = gTables[tableId];
        var tableCols = table.tableCols;
        var col      = tableCols[colNum - 1];
        var fullName = nameInfo.name;
        var escapedName = nameInfo.escapedName;

        if (!isDataTd) {
            var symbol = "";
            if (!isArray) {
                symbol = ".";
            }
            escapedName = col.func.args[0] + symbol + escapedName;
            fullName = col.func.args[0] + symbol + fullName;
        }
        var usrStr = '"' + fullName + '" = pull(' + escapedName + ')';
        
        var tableName   = table.tableName;
        var siblColName = table.tableCols[colNum - 1].name;
        var newColName  = xcHelper.getUniqColName(fullName, tableCols);   
        var direction;
        if (isDataTd) {
            direction = "L";
        } else {
            direction = "R";
        }
        ColManager.addCol(colNum, tableId, newColName, {
            "direction": direction,
            "select"   : true,
            "noAnimate": noAnimate
        });

        if (direction === "R") {
            colNum++;
        }

        // now the column is different as we add a new column
        var newCol = table.tableCols[colNum - 1];
        newCol.func.func = "pull";
        newCol.func.args = [escapedName];
        newCol.userStr = usrStr;

        ColManager.execCol(newCol, tableId)
        .then(function() {
            updateTableHeader(tableId);
            RightSideBar.updateTableInfo(tableId);

            autosizeCol($table.find("th.col" + colNum), {
                "includeHeader" : true,
                "resizeFirstRow": true
            });

            $table.find("tr:first th.col" + (colNum + 1) +
                        " .editableHead").focus();

            // add sql
            SQL.add("Pull Column", {
                "operation"     : SQLOps.PullCol,
                "tableName"     : tableName,
                "tableId"       : tableId,
                "siblColName"   : siblColName,
                "newColName"    : newColName,
                "colNum"        : colNum,
                "direction"     : direction,
                "nameInfo"      : nameInfo,
                "pullColOptions": pullColOptions
            });

            deferred.resolve();
        })
        .fail(deferred.reject);

        return (deferred.promise());
    };

    ColManager.renameCol = function(colNum, tableId, newName) {
        var table   = gTables[tableId];
        var $table  = $("#xcTable-" + tableId);
        var curCol  = table.tableCols[colNum - 1];
        var oldName = curCol.name;

        curCol.name = newName;
        $table.find('.editableHead.col' + colNum).val(newName)
                                                .attr("value", newName);

        SQL.add("Rename Column", {
            "operation": SQLOps.RenameCol,
            "tableName": table.tableName,
            "tableId"  : tableId,
            "colName"  : oldName,
            "colNum"   : colNum,
            "newName"  : newName
        });
    };

    ColManager.reorderCol = function(tableId, oldColNum, newColNum) {
        var oldIndex = oldColNum - 1;
        var newIndex = newColNum - 1;
        var $table   = $("#xcTable-" + tableId);
        var table    = gTables[tableId];
        var colName  = table.tableCols[oldIndex].name;

        var progCol = removeColHelper(oldIndex, tableId);

        insertColHelper(newIndex, tableId, progCol);
        progCol.index = newIndex + 1;

        $table.find('.col' + oldColNum)
                 .removeClass('col' + oldColNum)
                 .addClass('colNumToChange');

        if (oldColNum > newColNum) {
            for (var i = oldColNum; i >= newColNum; i--) {
                $table.find('.col' + i)
                       .removeClass('col' + i)
                       .addClass('col' + (i + 1));
            }
        } else {
            for (var i = oldColNum; i <= newColNum; i++) {
                $table.find('.col' + i)
                       .removeClass('col' + i)
                       .addClass('col' + (i - 1));
            }
        }

        $table.find('.colNumToChange')
            .addClass('col' + newColNum)
            .removeClass('colNumToChange');

        // add sql
        SQL.add("Change Column Order", {
            "operation": SQLOps.ReorderCol,
            "tableName": table.tableName,
            "tableId"  : tableId,
            "colName"  : colName,
            "oldColNum": oldColNum,
            "newColNum": newColNum
        });
    };

    ColManager.execCol = function(progCol, tableId, args) {
        var deferred = jQuery.Deferred();
        var userStr;
        var regex;
        var matches;
        var fieldName;

        switch (progCol.func.func) {
            case ("pull"):
                if (!parsePullColArgs(progCol)) {
                    console.error("Arg parsing failed");
                    deferred.reject("Arg parsing failed");
                    break;
                }

                var startIndex;
                var numberOfRows;

                if (args) {
                    if (args.index) {
                        progCol.index = args.index;
                    }
                    if (args.startIndex) {
                        startIndex = args.startIndex;
                    }
                    if (args.numberOfRows) {
                        numberOfRows = args.numberOfRows;
                    }
                }
                if (progCol.isNewCol) {
                    progCol.isNewCol = false;
                }

                pullColHelper(progCol.func.args[0], progCol.index,
                              tableId, startIndex, numberOfRows);

                deferred.resolve();
                break;
            case ("raw"):
                console.log("Raw data");
                deferred.resolve();
                break;
            case ("map"):
                userStr = progCol.userStr;
                regex = new RegExp(' *" *(.*) *" *= *map *[(] *(.*) *[)]',
                                       "g");
                matches = regex.exec(userStr);
                var mapString = matches[2];
                fieldName = matches[1];

                progCol.func.func = "pull";
                progCol.func.args[0] = fieldName;
                progCol.func.args.splice(1, progCol.func.args.length - 1);
                progCol.isNewCol = false;
                // progCol.userStr = '"' + progCol.name + '"' + " = pull(" +
                //                   fieldName + ")";
                var options = {replaceColumn: true};
                xcFunction.map(progCol.index, tableId, fieldName,
                                mapString, options)
                .then(deferred.resolve)
                .fail(function(error) {
                    console.error("execCol fails!", error);
                    deferred.reject(error);
                });
                break;
            case ("filter"):
                userStr = progCol.userStr;
                regex = new RegExp(' *" *(.*) *" *= *filter *[(] *(.*) *[)]'
                                       , "g");
                matches = regex.exec(userStr);
                var fltString = matches[2];
                fieldName = matches[1];

                progCol.func.func = "pull";
                progCol.func.args[0] = fieldName;
                progCol.func.args.splice(1, progCol.func.args.length - 1);
                progCol.isNewCol = false;
                // progCol.userStr = '"' + progCol.name + '"' + " = pull(" +
                //                   fieldName + ")";
                xcFunction.filter(progCol.index, tableId, {
                    "filterString": fltString
                })
                .then(deferred.resolve)
                .fail(function(error) {
                    console.error("execCol fails!", error);
                    deferred.reject(error);
                });
                break;

            case (undefined):
                console.warn("Blank col?");
                deferred.resolve();
                break;
            default:
                console.warn("No such function yet!", progCol);
                deferred.resolve();
                break;
        }

        return (deferred.promise());
    };

    ColManager.checkColDup = function ($input, $inputs, tableId, parseCol) {
        // $inputs checks the names of $inputs, tableId is used to check
        // back column names. You do not need both
        var name        = $input.val().trim();
        var isDuplicate = false;
        var title       = "Name already exists, please use another name.";
        
        if (parseCol) {
            name = name.replace(/^\$/, '');
        }

        $(".tooltip").hide();
        // temporarily use, will be removed when backend allow name with space
        if (/ +/.test(name) === true) {
            title = "Invalid name, cannot contain spaces between characters.";
            isDuplicate = true;
        } else if (name === 'DATA') {
            title = "The name \'DATA\' is reserved.";
            isDuplicate = true;
        }

        if (!isDuplicate && $inputs) {
            $inputs.each(function() {
                var $checkedInput = $(this);
                if (name === $checkedInput.val() &&
                    $checkedInput[0] !== $input[0])
                {
                    isDuplicate = true;
                    return (false);
                }
            });
        }

        if (!isDuplicate && tableId != null) {
            var tableCols = xcHelper.getTableFromId(tableId).tableCols;
            var numCols = tableCols.length;
            for (var i = 0; i < numCols; i++) {
                if (tableCols[i].func.args) {
                    var backName = tableCols[i].func.args[0];
                    if (name === backName) {
                        title = "A column is already using this name, " +
                                "please use another name.";
                        isDuplicate = true;
                        break;
                    }
                }   
            }
        }
        
        if (isDuplicate) {
            var container      = $input.closest('.mainPanel').attr('id');
            var $toolTipTarget = $input.parent();

            $toolTipTarget.tooltip({
                "title"    : title,
                "placement": "top",
                "trigger"  : "manual",
                "container": "#" + container,
                "template" : '<div class="tooltip error" role="tooltip">' +
                                '<div class="tooltip-arrow"></div>' +
                                '<div class="tooltip-inner"></div>' +
                             '</div>'
            });

            $toolTipTarget.tooltip('show');
            $input.click(hideTooltip);

            var timeout = setTimeout(function() {
                hideTooltip();
            }, 5000);
        }

        function hideTooltip() {
            $toolTipTarget.tooltip('destroy');
            $input.off('click', hideTooltip);
            clearTimeout(timeout);
        }

        return (isDuplicate);
    };

    ColManager.dupCol = function(colNum, tableId) {
        var deferred = jQuery.Deferred();

        var $table = $("#xcTable-" + tableId);
        var table  = gTables[tableId];
        var tableCols = table.tableCols;

        var width    = tableCols[colNum - 1].width;
        var isNewCol = $table.find('th.col' + colNum).hasClass('unusedCell');

        var name;
        if (tableCols[colNum - 1].func.args) {
            name = tableCols[colNum - 1].func.args[0];
        } else {
            name = tableCols[colNum - 1].name;
        }

        name = xcHelper.getUniqColName(name, tableCols);

        ColManager.addCol(colNum, tableId, name, {
            "width"   : width,
            "isNewCol": isNewCol,
            "isHidden": tableCols[colNum - 1].isHidden
        });
        // add sql
        SQL.add("Duplicate Column", {
            "operation" : SQLOps.DupCol,
            "tableName" : table.tableName,
            "tableId"   : tableId,
            "colName"   : tableCols[colNum - 1].name,
            "newColName": name,
            "colNum"    : colNum
        });

        tableCols[colNum].func.func = tableCols[colNum - 1].func.func;
        tableCols[colNum].func.args = tableCols[colNum - 1].func.args;
        tableCols[colNum].userStr = tableCols[colNum - 1].userStr;

        ColManager.execCol(tableCols[colNum], tableId)
        .then(function() {
            updateTableHeader(tableId);
            RightSideBar.updateTableInfo(tableId);
            deferred.resolve();
        })
        .fail(deferred.reject);

        return (deferred.promise());
    };

    ColManager.delDupCols = function(colNum, tableId) {
        // col Name will change after delete the col
        var table = gTables[tableId];
        var $tableWrap = $('#xcTableWrap-' + tableId);
        var tableWidth = $tableWrap.width();
        var colName = table.tableCols[colNum - 1].name;
        var colWidths = delDupColHelper(colNum, tableId);
        
        if (gMinModeOn) {
            matchHeaderSizes($tableWrap.find('.xcTable'));
        } else {
            moveTableTitlesAnimated(tableId, tableWidth, colWidths, 200);
            setTimeout(function() {
                matchHeaderSizes($tableWrap.find('.xcTable'));
            }, 200);
        }

        updateTableHeader(tableId);
        RightSideBar.updateTableInfo(tableId);

        SQL.add("Delete Duplicate Columns", {
            "operation": SQLOps.DelDupCol,
            "tableName": table.tableName,
            "tableId"  : tableId,
            "colNum"   : colNum,
            "colName"  : colName
        });
    };

    ColManager.delAllDupCols = function(tableId) {
        var table   = gTables[tableId];
        var columns = table.tableCols;
        var forwardCheck = true;
        var $table = $('#xcTable-' + tableId);
        for (var i = 0; i < columns.length; i++) {
            if (columns[i].func.func && columns[i].func.func === "raw") {
                continue;
            } else {
                delDupColHelper(i + 1, tableId, forwardCheck);
            }    
        }

        matchHeaderSizes($table);
        updateTableHeader(tableId);
        RightSideBar.updateTableInfo(tableId);

        SQL.add("Delete All Duplicate Columns", {
            "operation": SQLOps.DelAllDupCols,
            "tableName": table.tableName,
            "tableId"  : tableId
        });
    };

    ColManager.hideCols = function(colNums, tableId) {
        // for multiple columns
        var $table   = $('#xcTable-' + tableId);
        var numCols  = colNums.length;
        var table    = gTables[tableId];
        var tableCols = table.tableCols;
        var colNames = [];
        var widthDiff = 0;
        var tableWidth = $table.width();
        var tdSelectors = "";
        var $ths = $();
        
        for (var i = 0; i < numCols; i++) {
            var colNum = colNums[i];
            tdSelectors += "td.col" + colNum + ",";
            var col = tableCols[colNum - 1];
            var $th = $table.find('th.col' + colNum);
            $ths = $ths.add($th);
            var $thWidth = $th.width() + 5;
            var originalColWidth = $thWidth;

            widthDiff += (originalColWidth - 15);
            col.isHidden = true;
            colNames.push(col.name);
        }

        tdSelectors = tdSelectors.slice(0, tdSelectors.length - 1);
        var $tds = $table.find(tdSelectors);

        if (!gMinModeOn) {
            $ths.animate({width: 15}, 250, "linear", function() {
                $ths.addClass("userHidden");
                $tds.addClass("userHidden");
            });
            
            moveTableTitlesAnimated(tableId, tableWidth, widthDiff, 250);
        } else {
            $ths.width(10);
            $ths.addClass("userHidden");
            $tds.addClass("userHidden");
            matchHeaderSizes($table);
            moveTableTitles();
        }

        xcHelper.removeSelectionRange();

        SQL.add("Hide Columns", {
            "operation": SQLOps.HideCols,
            "tableName": table.tableName,
            "tableId"  : tableId,
            "colNames" : colNames,
            "colNums"  : colNums
        });
    };

    ColManager.unhideCols = function(colNums, tableId, hideOptions) {
        var $table     = $('#xcTable-' + tableId);
        var tableWidth = $table.width();
        var table      = gTables[tableId];
        var tableCols = table.tableCols;
        var numCols    = colNums.length;
        var colNames   = [];
        var autoResize = hideOptions && hideOptions.autoResize;
        var widthDiff = 0;
        var thSelectors = "";
        var tdSelectors = "";
        var promises = [];
        for (var i = 0; i < numCols; i++) { 
            var colNum = colNums[i];
            var $th = $table.find(".th.col" + colNum);

            var col = tableCols[colNum - 1];
            var originalColWidth = col.width;
            widthDiff += (originalColWidth - 15);
            col.isHidden = false;
            colNames.push(col.name);

            if (autoResize) {
                if (!gMinModeOn) {
                    promises.push(jQuery.Deferred());
                    var count = 0;
                    $th.animate({width: col.width}, 250, "linear", function() {
                        promises[count].resolve();
                        count++;
                    });
                } else {
                    $th.css("width", col.width);
                }  
            }
            $table.find("th.col" + colNum + ",td.col" + colNum)
                  .removeClass("userHidden");
        }

        if (autoResize) {
            if (!gMinModeOn) {
                jQuery.when.apply($, promises).done(function() {
                    matchHeaderSizes($table);
                });
                moveTableTitlesAnimated(tableId, tableWidth, -widthDiff);
            } else {
                matchHeaderSizes($table);
            } 
        }

        SQL.add("Unhide Columns", {
            "operation"  : SQLOps.UnHideCols,
            "tableName"  : table.tableName,
            "tableId"    : tableId,
            "colNames"   : colNames,
            "colNums"    : colNums,
            "hideOptions": hideOptions
        });
    };

    ColManager.textAlign = function(colNum, tableId, alignment) {
        if (alignment.indexOf("leftAlign") > -1) {
            alignment = "Left";
        } else if (alignment.indexOf("rightAlign") > -1) {
            alignment = "Right";
        } else {
            alignment = "Center";
        }
        var table  = gTables[tableId];
        var $table = $('#xcTable-' + tableId);
        var colNums = [];
        var colNames = [];
        if (typeof colNum !== "object") {
            colNums.push(colNum);
        } else {
            colNums = colNum;
        }
        var numCols = colNums.length;
        
        for (var i = 0; i < numCols; i++) {
            var curCol = table.tableCols[colNums[i] - 1];
            $table.find('td.col' + colNums[i])
                .removeClass('textAlignLeft')
                .removeClass('textAlignRight')
                .removeClass('textAlignCenter')
                .addClass('textAlign' + alignment);
            curCol.textAlign = alignment;
            colNames.push(curCol.name);
        }

        if (numCols === 1) {
            SQL.add("Text Align", {
                "operation": "textAlign",
                "tableName": table.tableName,
                "tableId"  : tableId,
                "colName"  : colNames[0],
                "colNum"   : colNums[0],
                "alignment": alignment
            });
        } else { 
            SQL.add("Text Align", {
                "operation": "textAlign",
                "tableName": table.tableName,
                "tableId"  : tableId,
                "colNames" : colNames,
                "colNums"  : colNums,
                "alignment": alignment
            });
        }
    };

    ColManager.pullAllCols = function(startIndex, jsonObj, dataIndex,
                                      tableId, direction, rowToPrependTo)
    {
        var table     = gTables[tableId];
        var tableCols = table.tableCols;
        var numCols   = tableCols.length;
        // jsonData based on if it's indexed on array or not
        var secondPull = table.isSortedArray || false;
        var jsonData   = secondPull ? jsonObj.withKey : jsonObj.normal;

        var indexedColNums = [];
        var nestedVals     = [];
        var columnTypes    = []; // track column type
        var childArrayVals = new Array(numCols);

        var $table    = $('#xcTable-' + tableId);
        var tBodyHTML = "";

        startIndex = startIndex || 0;

        for (var i = 0; i < numCols; i++) {
            if ((i !== dataIndex) &&
                tableCols[i].func.args &&
                tableCols[i].func.args !== "")
            {
                var nested = parseColFuncArgs(tableCols[i].func.args[0]);
                if (tableCols[i].func.args[0] !== "" &&
                    tableCols[i].func.args[0] != null)
                {
                    if (/\\.([0-9])/.test(tableCols[i].func.args[0])) {
                        // slash followed by dot followed by number is ok
                        // fall through
                    } else if (/\.([0-9])/.test(tableCols[i].func.args[0])) {
                        // dot followed by number is invalid
                        nested = [""];
                    }
                }

                nestedVals.push(nested);
                // get the column number of the column the table was indexed on
                if (tableCols[i].func.args &&
                    (tableCols[i].func.args[0] === table.keyName)) {
                    indexedColNums.push(i);
                }
            } else { // this is the data Column
                nestedVals.push([""]);
            }

            columnTypes.push(tableCols[i].type); // initial type
        }

        // loop through table tr and start building html
        for (var row = 0, numRows = jsonData.length; row < numRows; row++) {
            var dataValue = parseRowJSON(jsonData[row]);
            var rowNum    = row + startIndex;

            tBodyHTML += '<tr class="row' + rowNum + '">';

            // add bookmark
            if (table.bookmarks.indexOf(rowNum) > -1) {
                tBodyHTML += '<td align="center" class="col0 rowBookmarked">';
            } else {
                tBodyHTML += '<td align="center" class="col0">';
            }

            // Line Marker Column
            tBodyHTML += '<div class="idWrap">' +
                            '<span class="idSpan" ' +
                                'data-toggle="tooltip" ' +
                                'data-placement="bottom" ' +
                                'data-container="body" ' +
                                'title="click to add bookmark">' +
                                    (rowNum + 1) +
                            '</span>' +
                            '<div class="rowGrab"></div>' +
                          '</div></td>';

            // loop through table tr's tds
            for (var col = 0; col < numCols; col++) {
                var nested       = nestedVals[col];
                var tdValue      = dataValue;
                var childOfArray = childArrayVals[col];
                var parsedVal;

                if (col !== dataIndex) {
                    if (nested == null) {
                        console.error('Error this value should not be empty');
                    }

                    var nestedLength = nested.length;
                    for (var i = 0; i < nestedLength; i++) {
                        if (jQuery.isEmptyObject(tdValue) ||
                            tdValue[nested[i]] == null)
                        {
                            tdValue = "";
                            break;
                        }

                        tdValue = tdValue[nested[i]];

                        if (!childOfArray && i < nestedLength - 1 &&
                            xcHelper.isArray(tdValue))
                        {
                            childArrayVals[col] = true;
                        }
                    }
                    
                    // if it's the index array field, pull indexed one instead
                    if (secondPull && tableCols[col].isSortedArray) {
                        var $input  = $table.find('th.col' + (col + 1) +
                                          '> .header input');
                        var key = table.keyName + "_indexed";
                        $input.val(key);
                        tdValue = dataValue[key];
                    }

                    // XXX giving classes to table cells may
                    // actually be done later
                    var tdClass = "col" + (col + 1);
                    // class for indexed col
                    if (indexedColNums.indexOf(col) > -1) {
                        tdClass += " indexedColumn";
                    }
                    // class for textAlign
                    if (tableCols[col].textAlign === "Left") {
                        tdClass += " textAlignLeft";
                    } else if (tableCols[col].textAlign === "Right") {
                        tdClass += " textAlignRight";
                    }

                    parsedVal = xcHelper.parseJsonValue(tdValue);
                    tBodyHTML += '<td class="' + tdClass + ' clickable">' +
                                    getTableCellHtml(parsedVal) +
                                '</td>';
                } else {
                    // make data td;
                    tdValue = jsonData[row];
                    parsedVal = xcHelper.parseJsonValue(tdValue);
                    tBodyHTML +=
                        '<td class="col' + (col + 1) + ' jsonElement">' +
                            '<div data-toggle="tooltip" ' +
                                'data-placement="bottom" ' +
                                'data-container="body" ' +
                                'title="double-click to view" ' +
                                'class="elementTextWrap">' +
                                '<div class="elementText">' +
                                    parsedVal +
                                '</div>' +
                            '</div>' +
                        '</td>';
                }

                //define type of the column
                columnTypes[col] = xcHelper.parseColType(tdValue,
                                                         columnTypes[col]);
                // XXX This part try to detect edge case of decimal, doese not
                // need it right now
                // if (columnTypes[col] === "integer" || 
                //     columnTypes[col] === "decimal") 
                // {
                //     var str = '"' + tableCols[col].name + '":' + tdValue;
                //     var index = jsonData[row].indexOf(str) + str.length;
                //     var next = jsonData[row].charAt(index);
                //     // if it's like 123.000, find it and output the right format
                //     if (next === ".") {
                //         var end = jsonData[row].indexOf(",", index);
                //         tdValue += jsonData[row].substring(index, end);
                //         columnTypes[col] = "decimal";
                //     }
                // }
            }
            // end of loop through table tr's tds
            tBodyHTML += '</tr>';
        }
        // end of loop through table tr and start building html

        // assign column type class to header menus

        // This only run once,  check if it's a indexed array, mark on gTables
        // and redo the pull column thing
        if (!secondPull && columnTypes[indexedColNums[0]] === "array") {
            table.isSortedArray = true;

            for (var i = 0; i < indexedColNums.length; i++) {
                tableCols[indexedColNums[i]].isSortedArray = true;
            }
            return ColManager.pullAllCols(startIndex, jsonObj,
                                          dataIndex, tableId, direction);
        }

        var $tBody = $(tBodyHTML);
        if (direction === 1) {
            if (rowToPrependTo > -1) {
                $table.find('.row' + rowToPrependTo).before($tBody);
            } else {
                $table.find('tbody').prepend($tBody);
            }
        } else {
            $table.find('tbody').append($tBody);
        }

        for (var i = 0; i < numCols; i++) {
            var $currentTh = $table.find('th.col' + (i + 1));
            var $header    = $currentTh.find('> .header');
            var columnType = columnTypes[i] || "undefined";

            // XXX Fix me if DATA column should not be type object
            if (tableCols[i].name === "DATA") {
                columnType = "object";
            }
            tableCols[i].type = columnType;

            $header.removeClass("type-mixed")
                    .removeClass("type-string")
                    .removeClass("type-integer")
                    .removeClass("type-decimal")
                    .removeClass("type-object")
                    .removeClass("type-array")
                    .removeClass("type-undefined")
                    .removeClass("type-boolean")
                    .removeClass("recordNum")
                    .removeClass("childOfArray");

            $header.addClass('type-' + columnType);
            $header.find('.iconHelper').attr('title', columnType);

            if (tableCols[i].name === "recordNum") {
                $header.addClass('recordNum');
            }
            
            if (tableCols[i].isHidden) {
                $table.find('td.col' + (i + 1)).addClass('userHidden');
            }
            if (childArrayVals[i]) {
                $header.addClass('childOfArray');
            }
            if ($currentTh.hasClass('selectedCell')) {
                highlightColumn($currentTh);
            }
        }

        return ($tBody);
    };

    function pullColHelper(key, newColid, tableId, startIndex, numberOfRows) {
        if (key !== "" & key != null) {
            if (/\\.([0-9])/.test(key)) {
                // slash followed by dot followed by number is ok
            } else if (/\.([0-9])/.test(key)) {
                // dot followed by number is invalid
                return;
            }
        }
        var tableCols = gTables[tableId].tableCols;
        var $table    = $("#xcTable-" + tableId);
        var $dataCol  = $table.find("tr:first th").filter(function() {
            return $(this).find("input").val() === "DATA";
        });

        var colid = xcHelper.parseColNum($dataCol);

        var numRow        = -1;
        var startingIndex = -1;
        var endingIndex   = -1;

        if (!startIndex) {
            startingIndex = parseInt($table.find("tbody tr:first")
                                           .attr('class').substring(3));
            numRow = $table.find("tbody tr").length;
            endingIndex = parseInt($table.find("tbody tr:last")
                                           .attr('class').substring(3)) + 1;
        } else {
            startingIndex = startIndex;
            numRow = numberOfRows || gNumEntriesPerPage;
            endingIndex = startIndex + numRow;
        }

        var nested       = parseColFuncArgs(key);
        var childOfArray = false;
        var columnType;  // track column type, initial is undefined

        for (var i = startingIndex; i < endingIndex; i++) {
            var jsonStr = $table.find('.row' + i + ' .col' +
                                     colid + ' .elementText').text();
            var value = parseRowJSON(jsonStr);

            for (var j = 0; j < nested.length; j++) {
                if (jQuery.isEmptyObject(value) ||
                    value[nested[j]] == null)
                {
                    value = "";
                    break;
                }
                value = value[nested[j]];

                if (!childOfArray && j < nested.length - 1 &&
                    xcHelper.isArray(value)) {
                    childOfArray = true;
                }
            }

            //define type of the column
            columnType = xcHelper.parseColType(value, columnType);

            value = xcHelper.parseJsonValue(value);
            $table.find('.row' + i + ' .col' + newColid)
                  .html(getTableCellHtml(value))
                  .addClass('clickable');
        }

        if (columnType == null) {
            columnType = "undefined";
        }

        var table = xcHelper.getTableFromId(tableId);
        table.tableCols[newColid - 1].type = columnType;

        // add class to th
        var $header = $table.find('th.col' + newColid + ' div.header');

        $header.removeClass("type-mixed")
               .removeClass("type-string")
               .removeClass("type-integer")
               .removeClass("type-decimal")
               .removeClass("type-object")
               .removeClass("type-array")
               .removeClass("type-boolean")
               .removeClass("type-undefined")
               .removeClass("recordNum")
               .removeClass("childOfArray");

        $header.addClass('type-' + columnType);
        $header.find('.iconHelper').attr('title', columnType);

        if (key === "recordNum") {
            $header.addClass('recordNum');
        }
        if (childOfArray) {
            $header.addClass('childOfArray');
        }

        $table.find('th.col' + newColid).removeClass('newColumn');
        if (tableCols[newColid - 1].isHidden) {
            $table.find('td.col' + newColid).addClass('userHidden');
        }
    }

    function delDupColHelper(colNum, tableId, forwardCheck) {
        var index   = colNum - 1;
        var columns = gTables[tableId].tableCols;
        var numCols = columns.length;
        var args    = columns[index].func.args;
        var start   = forwardCheck ? index : 0;
        var operation;
        // var thNum = start + (thsDeleted || 0);
        var thNum = start;
        var numColsDeleted = 0;
        var colWidths = 0;

        if (args) {
            operation = args[0];
        }

        for (var i = start; i < numCols; i++) {
            if (i === index) {
                thNum++;
                continue;
            }
            if (columns[i].func.args) {
                if (columns[i].func.args[0] === operation &&
                    columns[i].func.func !== "raw")
                {
                    delColAndAdjustLoop();
                }
            } else if (operation == null) {
                delColAndAdjustLoop();
            }
            thNum++;
        }

        function delColAndAdjustLoop() {
            var currThNum;
            if (gMinModeOn || forwardCheck) {
                currThNum = i + 1;
            } else {
                currThNum = thNum + 1;
            }
            if (columns[i].isHidden) {
                colWidths += 15;
            } else {
                colWidths += columns[i].width;
            }
           
            delColHelper(currThNum, i + 1, tableId, null, null, forwardCheck);
            if (i < index) {
                index--;
            }
            numCols--;
            i--;
            numColsDeleted++;
        }
        return (colWidths);
    }

    // Help Functon for pullAllCols and pullCOlHelper
    // parse tableCol.func.args
    function parseColFuncArgs(key) {
        var nested = key.replace(/\]/g, "")
                        .replace(/\[/g, ".")
                        .match(/([^\\.]|\\.)+/g);

        for (var i = 0; i < nested.length; i++) {
            nested[i] = nested[i].replace(/\\./g, "\.");
        }

        return (nested);
    }
    // parse json string of a table row
    function parseRowJSON(jsonStr) {
        var value;

        if (jsonStr === "") {
            // console.error("Error in pullCol, jsonStr is empty");
            value = "";
        } else {
            try {
                value = jQuery.parseJSON(jsonStr);
            } catch (err) {
                // XXX may need extra handlers to handle the error
                console.error(err, jsonStr);
                value = "";
            }
        }

        return (value);
    }
    // End Of Help Functon for pullAllCols and pullCOlHelper

    function insertColHelper(index, tableId, progCol) {
         // tableCols is an array of ProgCol obj
        var tableCols = xcHelper.getTableFromId(tableId).tableCols;

        for (var i = tableCols.length - 1; i >= index; i--) {
            tableCols[i].index += 1;
            tableCols[i + 1] = tableCols[i];
        }

        tableCols[index] = progCol;
    }

    function removeColHelper(index, tableId) {
        var tableCols = xcHelper.getTableFromId(tableId).tableCols;
        var removed   = tableCols[index];

        for (var i = index + 1; i < tableCols.length; i++) {
            tableCols[i].index -= 1;
        }

        tableCols.splice(index, 1);

        return (removed);
    }

    function delColHelper(cellNum, colNum, tableId, multipleCols, colId, noAnim) {
        // cellNum is the th's colnumber, colNum refers to gTables colNum
        var deferred = jQuery.Deferred();
        var table      = xcHelper.getTableFromId(tableId);
        var numCols    = table.tableCols.length;
        var $tableWrap = $("#xcTableWrap-" + tableId);

        // temporarily no animation when deleting multiple duplicate cols
        if (gMinModeOn || noAnim) {
            $tableWrap.find(".col" + cellNum).remove();
            if (!multipleCols) {
                removeColHelper(colNum - 1, tableId);
                

                for (var i = colNum + 1; i <= numCols; i++) {
                    $tableWrap.find(".col" + i)
                              .removeClass("col" + i)
                              .addClass("col" + (i - 1));
                }

                var $table = $('#xcTable-' + tableId);
                matchHeaderSizes($table);
            } else {
                removeColHelper(colId - 1, tableId);
            }

            deferred.resolve();
            return (deferred.promise());
        }

        $tableWrap.find("th.col" + cellNum).animate({width: 0}, 200, function() {
            var currColNum = xcHelper.parseColNum($(this));
            $tableWrap.find(".col" + currColNum).remove();
            if (!multipleCols) {
                for (var i = currColNum + 1; i <= numCols; i++) {
                    $tableWrap.find(".col" + i)
                              .removeClass("col" + i)
                              .addClass("col" + (i - 1));
                }
                deferred.resolve();
            } else {
                deferred.resolve();
            }
        });

        if (!multipleCols) {
            removeColHelper(colNum - 1, tableId);
        } else {
            removeColHelper(colId - 1, tableId);
        }

        return (deferred.promise());
    }

    function parsePullColArgs(progCol) {
        if (progCol.func.func !== "pull") {
            console.warn("Wrong function!");
            return (false);
        }

        if (progCol.func.args.length !== 1) {
            console.warn("Wrong number of arguments!");
            return (false);
        }
        return (true);
    }

    function getTableCellHtml(value) {
        var html =
            '<div class="addedBarTextWrap clickable">' +
                value +   
            '</div>';
        return (html);
    }

    return (ColManager);
}(jQuery, {}));
