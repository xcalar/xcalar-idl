function freeAllResultSets() {
    for (var i = 0; i<gTables.length; i++) {
        XcalarSetFree(gTables[i].resultSetId);
    }
}

function goToPage(pageNumber, direction, tableNum) {
    if (pageNumber > gTables[tableNum].numPages) {
        console.log("Already at last page!");
        return;
    }
    if (pageNumber < 1) {
        console.log("Cannot go below one!");
        return;
    }
    gTables[tableNum].currentPageNumber = pageNumber;
    var shift = numPagesToShift(direction);
    XcalarSetAbsolute(gTables[tableNum].resultSetId,
                      (pageNumber-shift)*gNumEntriesPerPage);
    return (getPage(gTables[tableNum].resultSetId, null, direction, tableNum));
}

function numPagesToShift(direction) {
    var shift;
    if (direction == 1) {
        shift = 4;// shift 4 if we show 3 'pages' at once
    } else {
        shift = 1;
    }
    return (shift);
}

function resetAutoIndex() {
    gTableRowIndex = 1;
}

function getNextPage(resultSetId, firstTime, tableNum) {
    if (resultSetId == 0) {
        return promiseWrapper(null);
    }
    gTables[tableNum].currentPageNumber++;
    return (getPage(resultSetId, firstTime, null, tableNum));
}

function getPage(resultSetId, firstTime, direction, tableNum) {
    var deferred = jQuery.Deferred();
    // console.log('made it to getpage');
    if (resultSetId == 0) {
        return (promiseWrapper(null));
        // Reached the end
    }
    var tdHeights = getTdHeights();
    var tableOfEntries = XcalarGetNextPage(resultSetId,
                                           gNumEntriesPerPage);
    if (tableOfEntries.kvPairs.numRecords < gNumEntriesPerPage) {
        // This is the last iteration
        // Time to free the handle
        // XXX: Function call to free handle?
        resultSetId = 0;
    }
    var shift = numPagesToShift(direction);
    var indexNumber = (gTables[tableNum].currentPageNumber-shift) *
                      gNumEntriesPerPage;
    var numRows = Math.min(gNumEntriesPerPage,
                           tableOfEntries.kvPairs.numRecords);
    var rowTemplate = createRowTemplate(tableNum);
    for (var i = 0; i<numRows; i++) {
        if (direction == 1) {
            var index = numRows-1-i;
        } else {
            var index = i;
        }
        if (tableOfEntries.kvPairs.recordType ==
            GenericTypesRecordTypeT.GenericTypesVariableSize) { 
            var value = tableOfEntries.kvPairs
                        .records[index].kvPairVariable.value;
        } else {
            var value = tableOfEntries.kvPairs.records[index]
                        .kvPairFixed.value;
        }
        if (firstTime) {
            // console.log('first time, generating fresh table')
            generateFirstScreen(value, indexNumber+i, tableNum, tdHeights[i]);
        } else {
            generateRowWithCurrentTemplate(value, indexNumber+index, 
                                           rowTemplate, direction, tableNum);      
        }
    }

    if (firstTime) {
        if (numRows == 0) {
            console.log('no rows found, ERROR???');
            generateFirstScreen("", -1, tableNum);
        }
        addRowScroller(tableNum);
        if (numRows == 0) {
            $('#rowScroller'+tableNum).addClass('hidden');
        }
        addTableListeners(tableNum);
    }

    if (firstTime && (!getIndex(gTables[tableNum].frontTableName) || 
        getIndex(gTables[tableNum].frontTableName).length == 0)) {
        gTables[tableNum].keyName = tableOfEntries.keysAttrHeader.name;
        // We cannot rely on addCol to create a new progCol object because
        // add col relies on gTableCol entry to determine whether or not to add
        // the menus specific to the main key
        var newProgCol = new ProgCol();
        newProgCol.index = 1;
        newProgCol.isDark = false;
        newProgCol.width = gNewCellWidth;
        newProgCol.name = gTables[tableNum].keyName;
        newProgCol.func.func = "pull";
        newProgCol.func.args = [gTables[tableNum].keyName];
        newProgCol.userStr = '"' + gTables[tableNum].keyName +
                             '" = pull('+gTables[tableNum].keyName+')';
        insertColAtIndex(0, tableNum, newProgCol);
        //is this where we add the indexed column??
        addCol("col0", "xcTable"+tableNum, gTables[tableNum].keyName,
               {progCol: newProgCol}); 
        newProgCol = new ProgCol();
        newProgCol.index = 2;
        newProgCol.name = "DATA";
        newProgCol.width = 500; // XXX FIXME Grab from CSS
        newProgCol.func.func = "raw";
        newProgCol.func.args = [];
        newProgCol.userStr = '"DATA" = raw()';
        newProgCol.isDark = false;
        insertColAtIndex(1, tableNum, newProgCol);
    }

    var promises = [];
    for (var i = 0; i<gTables[tableNum].tableCols.length; i++) {
        if (gTables[tableNum].tableCols[i].name == "DATA") {
            // We don't need to do anything here because if it's the first time
            // they won't have anything stored. If it's not the first time, the
            // column would've been sized already. If it's indexed, we
            // would've sized it in CatFunction
        } else {
            if (firstTime && !getIndex(gTables[tableNum].frontTableName)) {
                promises.push(execCol(gTables[tableNum].tableCols[i], tableNum));
            } else { 

                if (direction) { 
                    var startingIndex;
                    if (direction == 1) {
                        startingIndex = parseInt($('#xcTable'+tableNum+
                                        ' tbody tr:first')
                                        .attr('class').substring(3));
                    } else {
                        var tr = $('#xcTable'+tableNum+
                                ' tr:nth-last-child('+gNumEntriesPerPage+')');
                        startingIndex = parseInt(tr.attr('class').substring(3));
                    }
                    var execColArgs = {};
                    execColArgs.startIndex = startingIndex;
                    execColArgs.numberofRows = numRows;
                    promises.push(execCol(gTables[tableNum].tableCols[i], tableNum, execColArgs));
                } else {
                    promises.push(execCol(gTables[tableNum].tableCols[i], tableNum));
                }
                if (gTables[tableNum].tableCols[i].name ==
                    gTables[tableNum].keyName) {
                    // autosizeCol($('#xcTable0
                    // th.col'+(gTables[tableNum.tableCols[i].index)));
                }
            }
        }
    }

    jQuery.when.apply(jQuery, promises)
    .done(function() {
        var idColWidth = getTextWidth($('#xcTable'+tableNum+' tr:last td:first'));
        var newWidth = Math.max(idColWidth, 22);
        var padding = 12;
        if ($('#xcTable'+tableNum+' .fauxTHead').length != 0) {
            padding += 5;
        }
        $('#xcTableWrap'+tableNum+' th:first-child').width(newWidth+padding);
        matchHeaderSizes(tableNum);

        deferred.resolve();
    });

    return (deferred.promise());
}
