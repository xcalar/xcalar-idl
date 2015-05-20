function refreshTable(newTableName, tableNum, 
                      keepOriginal, additionalTableNum) {
    var deferred = jQuery.Deferred();

    if (!$('#workspaceTab').hasClass('active')) {
        $("#workspaceTab").trigger('click');
        if ($('#dagPanel').hasClass('full') &&
            !$('#dagPanel').hasClass('hidden')) {
            $('#compSwitch').trigger('click');
            $('#mainFrame').removeClass('midway');
        }
    }

    // $("#workspaceTab").trigger('click');
    var newTableNum;
    if (keepOriginal === KeepOriginalTables.Keep) {
        // append newly created table to the back
        newTableNum = gTables.length;
        addTable(newTableName, newTableNum, AfterStartup.After)
        .then(function() {
            focusTable(newTableNum);
            var leftPos = $('#xcTableWrap'+newTableNum).position().left +
                            $('#mainFrame').scrollLeft();
            $('#mainFrame').animate({scrollLeft: leftPos})
                           .promise()
                           .then(function() {
                                focusTable(newTableNum);
                            });
            deferred.resolve();
        })
        .fail(function(error) {
            console.log("refreshTable fails!");
            deferred.reject(error);
        });
    } else {
        // default
        newTableNum = tableNum;
        var savedScrollLeft;
        var tablesToRemove    = [];
        var delayTableRemoval = true;

        if (additionalTableNum > -1) {
            var largerTableNum  = Math.max(additionalTableNum, tableNum);
            var smallerTableNum = Math.min(additionalTableNum, tableNum);

            tablesToRemove.push(largerTableNum);
            archiveTable(largerTableNum, DeleteTable.Keep, delayTableRemoval);
            if (largerTableNum != smallerTableNum) {
                // excludes self join
                tablesToRemove.push(smallerTableNum);
                archiveTable(smallerTableNum, DeleteTable.Keep, 
                             delayTableRemoval);
            }
            if (newTableNum > gTables.length) {
                // edge case
                newTableNum = gTables.length;
            }
        } else {
            savedScrollLeft = $('#mainFrame').scrollLeft();
            tablesToRemove.push(tableNum);
            archiveTable(tableNum, DeleteTable.Keep, delayTableRemoval);
        }

        addTable(newTableName, newTableNum, AfterStartup.After, tablesToRemove)
        .then(function() {
            if (savedScrollLeft) {
                $('#mainFrame').scrollLeft(savedScrollLeft);
            }
            focusTable(newTableNum);
            deferred.resolve();
        })
        .fail(function(error) {
            console.log("refreshTable fails!");
            deferred.reject(error);
        });
    }
    return (deferred.promise());
}
// Adds a table to the display
// Shifts all the ids and everything
function addTable(table, tableNum, AfterStartup, tableNumsToRemove, frontName) {
    var deferred = jQuery.Deferred();

    if (frontName == undefined) {
        frontName = table;
    }

    reorderTables(tableNum);
    tableStartupFunctions(table, tableNum, tableNumsToRemove, frontName)
    .then(function() {
        if ($('#mainFrame').hasClass('empty')) {
            $('#mainFrame').removeClass('empty');
            documentReadyxcTableFunction(); 
        }
        if (!getIndex(frontName)) {
            console.log("This table has never been stored before. " + 
                        "Storing it now");
            setIndex(frontName, gTables[tableNum].tableCols, null, null, table);
        }
        if (AfterStartup) {
            RightSideBar.addTables([gTables[tableNum]], IsActive.Active);
        }
        if ($('.xcTable').length == 1) {
            focusTable(tableNum);
        }
        deferred.resolve();
    })
    .fail(function(error) {
        console.log("Add Table Fails!");
        deferred.reject(error);
    });

    return (deferred.promise());
}

// Removes a table from the display
// Shifts all the ids
// Does not delete the table from backend!
function archiveTable(tableNum, del, delayTableRemoval) {
    if (delayTableRemoval) {
        // if we're delaying the deletion of this table, we need to remove
        // these element's IDs so they don't interfere with other elements
        // as non-deleted tables' IDs get reordered
        $("#xcTableWrap"+tableNum).attr('id', 'tablesToRemove'+tableNum);
        $("#xcTableWrap"+tableNum).attr("id", "");
        $("#xcTheadWrap"+tableNum).attr("id", "");
        $("#xcTbodyWrap"+tableNum).attr("id", "");
        $("#xcTable"+tableNum).attr("id", "");
        $("#tableMenu"+tableNum).attr("id", "");
        $("#rowScroller"+tableNum).attr("id", "rowScrollerToRemove"+tableNum);
        $("#rowMarker"+tableNum).attr("id", "");
        $("#colMenu"+tableNum).attr("id", "");
        $("#dagWrap"+tableNum).attr("id", "dagWrapToRemove"+tableNum);
    } else {
        $("#xcTableWrap"+tableNum).remove();
        $("#rowScroller"+tableNum).remove();
        $('#dagWrap'+tableNum).remove();
    }
    
    var tableName = gTables[tableNum].frontTableName;
    var deletedTable = gTables.splice(tableNum, 1);
    if (!del) {
        gHiddenTables.push(deletedTable[0]);
        gTableIndicesLookup[tableName].active = false;
        gTableIndicesLookup[tableName].timeStamp = xcHelper.getTimeInMS();
        RightSideBar.moveTable(deletedTable[0]);
    } else {
        delete (gTableIndicesLookup[tableName]);
        var $li = $("#activeTablesList").find('.tableName').filter(
                    function() {
                        return ($(this).text() == tableName);
                    }).closest("li");
        var $timeLine = $li.parent().parent();
        $li.remove();
        if ($timeLine.find('.tableInfo').length == 0) {
            $timeLine.remove();
        }
    }
    for (var i = tableNum+1; i<=gTables.length; i++) {
        $("#xcTableWrap"+i).attr("id", "xcTableWrap"+(i-1));
        $("#xcTheadWrap"+i).attr("id", "xcTheadWrap"+(i-1));
        $("#xcTbodyWrap"+i).attr("id", "xcTbodyWrap"+(i-1));
        $("#xcTable"+i).attr("id", "xcTable"+(i-1));
        $("#tableMenu"+i).attr("id", "tableMenu"+(i-1));
        $("#rowScroller"+i).attr("id", "rowScroller"+(i-1));
        $("#rowMarker"+i).attr("id", "rowMarker"+(i-1));
        $("#colMenu"+i).attr("id", "colMenu"+(i-1));
        $("#dagWrap"+i).attr("id", "dagWrap"+(i-1));
    }
    // $('#rowInput').val("").data('val',"");
    // XXX: Think about gActiveTableNum
    gActiveTableNum--;
    if ($('#xcTable'+gActiveTableNum).length == 0) {
        gActiveTableNum = 0; 
        $('#rowScroller0').show();
    } else {
        $('#rowScroller'+gActiveTableNum).show();
    }
    if (!delayTableRemoval && $('.xcTableWrap.active').length != 0) {
        focusTable(gActiveTableNum);
    }
    if ($('.xcTableWrap.active').length == 0) {
       emptyScroller();
    }
    moveTableDropdownBoxes();
}

function deleteActiveTable(tableNum) {
    var tableName = gTables[tableNum].frontTableName;
    var deferred = jQuery.Deferred();

    deleteTable(tableNum)
    .then(function() {
        // add sql
        SQL.add("Delete Table", {
            "operation": "deleteTable",
            "tableName": tableName
        });

        setTimeout(function() {
            if (gTables[gActiveTableNum] && 
                gTables[gActiveTableNum].resultSetCount != 0) {  
                generateFirstVisibleRowNum();
            }
        }, 300);

        deferred.resolve();
    })
    .fail(deferred.reject);

    return (deferred.promise());
}

function deleteTable(tableNum, deleteArchived) {
    var deferred = jQuery.Deferred();
    var table = deleteArchived ? gHiddenTables[tableNum] : gTables[tableNum];
    var backTableName = table.backTableName;
    var frontTableName = table.frontTableName;
    var resultSetId = table.resultSetId;
    
    // Free the result set pointer that is still pointing to it
    XcalarSetFree(resultSetId)
    .then(function() {
        if (table.isTable === false) {
            return (promiseWrapper(null));
        } else {
            // check if it is the only table
            for (var i = 0; i < gTables.length; i++) {
                if (gTables[i].backTableName === backTableName &&
                    (deleteArchived || i !== tableNum)) {
                    console.log("delete copy table");
                    return (promiseWrapper(null));
                }
            }

            for (var i = 0; i < gHiddenTables.length; i++) {
                if (gHiddenTables[i].backTableName === backTableName &&
                    (!deleteArchived || i !== tableNum)) {
                    console.log("delete copy table");
                    return (promiseWrapper(null));
                }
            }

            return (XcalarDeleteTable(backTableName));
        }
    })
    .then(function() {
        // XXX if we'd like to hide the cannot delete bug,
        // copy it to the fail function

        // Basically the same as archive table, but instead of moving to
        // gHiddenTables, we just delete it from gTablesIndicesLookup
        if (deleteArchived) {
            gHiddenTables.splice((tableNum), 1);
            delete (gTableIndicesLookup[frontTableName]);
        } else {
            archiveTable(tableNum, DeleteTable.Delete);
        }

        WSManager.removeTable(frontTableName);

        deferred.resolve();
    })
    .fail(function(error){
        deferred.reject(error);
    });

    return (deferred.promise());
}

function buildInitialTable(index, tableNum, jsonData, keyName) {
    var table = gTables[tableNum];
    table.tableCols = index;
    table.keyName = keyName;
    var dataIndex = generateTableShell(table.tableCols, tableNum);
    var numRows = jsonData.length;
    var startIndex = 0;
    var $table = $('#xcTable'+tableNum);
    addRowScroller(tableNum);

    if (numRows == 0) {
        console.log('no rows found, ERROR???');
        $('#rowScroller'+tableNum).addClass('hidden');
        jsonData = [""];
    }

    pullRowsBulk(tableNum, jsonData, startIndex, dataIndex);
    addTableListeners(tableNum);
    createTableHeader(tableNum);
    generateColDropDown(tableNum);
    addColListeners($table, tableNum);

    if (numRows == 0) {
        $table.find('.idSpan').text("");
    }
}

function pullRowsBulk(tableNum, jsonData, startIndex, dataIndex, direction) {
    // this function does some preparation for ColManager.pullAllCols()
    var startIndex = startIndex || 0;
    var $table = $('#xcTable'+tableNum);

    // get the column number of the datacolumn
    if (dataIndex == null) {
        dataIndex = xcHelper.parseColNum($('#xcTable'+tableNum)
                                            .find('tr:first .dataCol')) - 1;
    }
    var newCells = ColManager.pullAllCols(startIndex, jsonData, dataIndex, 
                                          tableNum, direction);
    addRowListeners(newCells);
    adjustRowHeights(newCells, startIndex, tableNum);

    var idColWidth = getTextWidth($table.find('tr:last td:first'));
    var newWidth = Math.max(idColWidth, 22);
    var padding = 12;
    if ($table.find('.fauxTHead').length != 0) {
        padding += 5;
    }
    $table.find('th:first-child').width(newWidth+padding);
    var colNum = 0;
    matchHeaderSizes(colNum, $table);
    $table.find('.rowGrab').width($table.width());
}

function generateTableShell(columns, tableNum) {
    var table = gTables[tableNum];
    var tableName = table.frontTableName;
    var wrapper = 
        '<div id="xcTableWrap' + tableNum + '"' + 
            ' class="xcTableWrap tableWrap">' + 
            '<div id="xcTbodyWrap' + tableNum + '" class="xcTbodyWrap"></div>' +
        '</div>';
    // creates a new table, completed thead, and empty tbody
    if (tableNum == 0) {
        $('#mainFrame').prepend(wrapper);
    } else {
        $('#xcTableWrap' + (tableNum - 1)).after(wrapper);
    }

    var newTable = 
        '<table id="xcTable'+tableNum+'" class="xcTable dataTable" '+
        'style="width:0px;">'+
          '<thead>'+
          '<tr>'+
            '<th style="width: 50px;" class="col0 th">'+
              '<div class="header">'+
                '<input value="" readonly="" tabindex="-1">'+
              '</div>'+
            '</th>';
    var numCols = columns.length;
    var dataIndex = null;

    for (var i = 0; i < numCols; i++) {
        var color = "";
        var columnClass = "";
        var backName = "";

        if (columns[i].func.args && columns[i].func.args[0]) {
            backName = columns[i].func.args[0]; 
        } else {
            backName = columns[i].name;
        }

        if (backName == table.keyName) {
            columnClass = " indexedColumn";
        } else if (columns[i].name == "" || columns[i].func.func == "") {
            columnClass = " newColumn";
        }
        if (backName == "DATA") {
            dataIndex = i;
            var newColid = i + 1;
            newTable +=
                '<th class="col' + newColid + ' th dataCol" ' +
                    'style="width:' + columns[i].width + 'px;">' +
                    '<div class="header type-data">' +
                        '<div class="dragArea"></div>'+
                        '<div class="colGrab"></div>'+
                        '<div class="flexContainer flexRow">' + 
                        '<div class="flexWrap flex-left"></div>' + 
                        '<div class="flexWrap flex-mid">' + 
                            '<input value="DATA" readonly="" tabindex="-1"' + 
                                ' class="dataCol col' + newColid + 
                                ' data-toggle="tooltip" data-placement="bottom" ' +
                                '" title="raw data">' +
                        '</div>'+
                        '<div class="flexWrap flex-right">' + 
                            '<div class="dropdownBox">' + 
                                '<div class="innerBox"></div>' + 
                            '</div>' + 
                        '</div>' + 
                    '</div>' + 
                '</th>';
        } else {
            newTable += generateColumnHeadHTML(columnClass, color,
                       (i+1), columns[i]);
        }  
    }

    newTable += '</tr></thead><tbody></tbody></table>';
    $('#xcTbodyWrap'+tableNum).append(newTable);
    return (dataIndex);
}

function reorderTables(tableNum) {
    for (var i = gTables.length-1; i>=tableNum; i--) {
        $("#xcTableWrap"+i).attr("id", "xcTableWrap"+(i+1));
        $("#xcTheadWrap"+i).attr("id", "xcTheadWrap"+(i+1));
        $("#xcTbodyWrap"+i).attr("id", "xcTbodyWrap"+(i+1));
        $("#xcTable"+i).attr("id", "xcTable"+(i+1));
        $("#tableMenu"+i).attr("id", "tableMenu"+(i+1));
        $("#rowScroller"+i).attr("id", "rowScroller"+(i+1));
        $("#rowMarker"+i).attr("id", "rowMarker"+(i+1));
        $("#colMenu"+i).attr("id", "colMenu"+(i+1));
        $("#dagWrap"+i).attr("id", "dagWrap"+(i+1));
        gTables[i+1] = gTables[i];
    }
}

function generateColumnHeadHTML(columnClass, color, newColid, option) {
    var option = option || {};
    var columnName = option.name || "newCol";
    var width      = option.width || 0;

    var columnHeadTd = 
        '<th class="th' + color + columnClass +
        ' col' + newColid + '" style="width:' + width + 'px;">' + 
            '<div class="header">' + 
                '<div class="dragArea"></div>' + 
                '<div class="colGrab" ' + 
                     'title="Double click to auto resize" ' + 
                     'data-toggle="tooltip" ' + 
                     'data-placement="top" ' + 
                     'data-container="body">' + 
                '</div>' + 
                '<div class="flexContainer flexRow">' + 
                    '<div class="flexWrap flex-left">' +
                    // XXX keep a space for hiding the icon in hide
                        '<div class="iconHidden"></div> ' + 
                        '<span class="type icon"></span>' + 
                    '</div>' + 
                    '<div class="flexWrap flex-mid">' + 
                        '<input autocomplete="on" spellcheck="false" ' + 
                            'type="text" class="editableHead col' + newColid + 
                            '" data-toggle="tooltip" data-placement="bottom" ' +
                            'title="click to edit" value="' + columnName + 
                            '" size="15" placeholder=""/>' + 
                    '</div>' + 
                    '<div class="flexWrap flex-right">' + 
                        '<div class="dropdownBox" ' + 
                            'data-toggle="tooltip" ' + 
                            'data-placement="bottom" ' + 
                            'data-container="body" '+ 
                            'title="view column options">' + 
                            '<div class="innerBox"></div>' + 
                        '</div>'
                    '</div>' + 
                '</div>' + 
            '</div>' + 
        '</th>';

    return (columnHeadTd);
}

function generateColDropDown(tableNum) {
    var dropDownHTML = 
        '<ul id="colMenu'+tableNum+'" class="colMenu">'+
            '<li>'+
                'Add a column'+
                '<ul class="subColMenu">'+
                    '<li class="addColumns addColLeft">'+
                    'On the left</li>'+
                    '<li class="addColumns">On the right</li>'+
                    '<div class="subColMenuArea"></div>'+
                '</ul>'+ 
                '<div class="dropdownBox"></div>'+
            '</li>'+
            '<li class="deleteColumn">Delete column</li>'+ 
            '<li class="duplicate">Duplicate column</li>'+
            '<li class="deleteDuplicates">Delete duplicate columns</li>'+ 
            '<li class="renameCol">Rename column</li>'+
            '<li class="hide">Hide column</li>'+ 
            '<li class="unhide">Unhide column</li>'+
            '<li>Text align'+
                '<ul class="subColMenu">'+
                    '<li class="textAlign leftAlign">Left Align</li>'+
                    '<li class="textAlign centerAlign">Center Align</li>'+
                    '<li class="textAlign rightAlign">Right Align</li>'+
                '</ul>'+
                '<div class="dropdownBox"></div>'+
            '</li>'+
            '<li class="sort">Sort'+
                '<ul class="subColMenu">'+
                    '<li class="sort">'+ 
                    '<span class="sortUp"></span>A-Z</li>'+
                    '<li class="revSort unavailable">'+ 
                    '<span class="sortDown"></span>Z-A</li>'+
                    '<div class="subColMenuArea"></div>'+
                '</ul>'+ 
                '<div class="dropdownBox"></div>'+
            '</li>'+
            '<li class="functions aggregate">Aggregate...</li>'+
            '<li class="functions filter">Filter...</li>';
    if (gTables[tableNum].isTable) {
        dropDownHTML += '<li class="functions groupby">Group By...</li>';
    } else {
        dropDownHTML += '<li class="functions groupby unavailable">'+
                        'Group By...</li>';
    }
    dropDownHTML +=       
            '<li class="functions map">Map...</li>'+
            '<li class="joinList">'+'Join</li>';


    // XXX: HACK: I removed the check for the main col. Also, I should check for
    // whether the type is a string or a int
    // if (true) { // This check is here so that you don't have to indent in the
    //             // in the future. O:D
    //     dropDownHTML += 
    //         '<li class="joinList">'+'Join</li>'+
    //         '<li class="operations">'+'Functions</li>'; 
    //                         // '<ul class="subColMenu" id="joinTables">';
    // }
    // dropDownHTML += '</ul><div class="dropdownBox"></div>'+
    //                 '<div class="subColMenuArea"></div></li>';
    dropDownHTML += '</ul>';
    $('#xcTableWrap'+tableNum).append(dropDownHTML);

    return (dropDownHTML);
}