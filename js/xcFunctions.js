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
            var leftPos = $('#xcTableWrap'+newTableNum).position().left +
                            $('#mainFrame').scrollLeft();
            $('#mainFrame').animate({scrollLeft: leftPos})
                           .promise().then(generateFirstVisibleRowNum);
            focusTable(newTableNum);
            deferred.resolve();
        })
        .fail(function(error) {
            console.log("refreshTable fails!");
            deferred.reject(error);
        });
    } else {
        // default
        newTableNum = tableNum;
        var tablesToRemove = [];
        var savedScrollLeft;
        var delayTableRemoval = true;
        if (additionalTableNum > -1) {
            var largerTableNum = Math.max(additionalTableNum, tableNum);
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

function sortRows(index, tableNum, order) {
    console.log(arguments);
    var rand = Math.floor((Math.random() * 100000) + 1);
    var newTableName = "tempSortTable"+rand;
    var srcTableName = gTables[tableNum].frontTableName;
    var tablCols = gTables[tableNum].tableCols;
    var fieldName;

    switch(gTables[tableNum].tableCols[index-1].func.func) {
    case ("pull"):
        // Pulled directly, so just sort by this
        fieldName = gTables[tableNum].tableCols[index-1].func.args[0];
        break;
    default:
        console.log("Cannot sort a col derived from unsupported func");
        return;
    }

    // add cli
    var cliOptions = {};
    cliOptions.operation = 'sort';
    cliOptions.tableName = srcTableName;
    cliOptions.key = fieldName;
    cliOptions.newTableName = newTableName;
    if (order == SortDirection.Forward) {
        cliOptions.direction = 'ASC';
    } else {
        cliOptions.direction = "DESC";
    }

    var msg = StatusMessageTStr.Sort + " " + cliOptions.key;
    StatusMessage.show(msg);

    XcalarIndexFromTable(srcTableName, fieldName, newTableName)
    .then(function() {
        setDirection(newTableName, order);
        setIndex(newTableName, tablCols);
        return (refreshTable(newTableName, tableNum, KeepOriginalTables.DontKeep));
    })
    .then(function() {
        commitToStorage();
        Cli.add('Sort Table', cliOptions);
        StatusMessage.success(msg);
    })
    .fail(function(error) {
        Alert.error("Sort Rows Fails", error);
        StatusMessage.fail(StatusMessageTStr.SortFailed, msg);
    });
}

function mapColumn(fieldName, mapString, tableNum) {
    var deferred = jQuery.Deferred();

    var rand = Math.floor((Math.random() * 100000) + 1);
    var newTableName = "tempMapTable"+rand;
    var msg = StatusMessageTStr.Map + " " + fieldName;
    var tablCols = gTables[tableNum].tableCols;
    StatusMessage.show(msg);
    
    XcalarMap(fieldName, mapString, 
              gTables[tableNum].frontTableName, newTableName)
    .then(function() {
        setIndex(newTableName, tablCols);
        return (refreshTable(newTableName, tableNum));
    })
    .then(function() {
        commitToStorage();
        StatusMessage.success(msg);
        deferred.resolve();
    })
    .fail(function(error){
        Alert.error("mapColumn fails", error);
        StatusMessage.fail(StatusMessageTStr.MapFailed, msg);
        deferred.reject(error);
    });

    return (deferred.promise());
}

function groupByCol(operator, newColName, colid, tableNum) {
    var deferred = jQuery.Deferred();

    var rand = Math.floor((Math.random() * 100000) + 1);
    var newTableName = "tempGroupByTable"+rand;
    var srcTableName = gTables[tableNum].frontTableName
    var fieldName = gTables[tableNum].tableCols[colid - 1].name;

    // add cli
    var cliOptions = {};
    cliOptions.operation = 'groupBy';
    cliOptions.tableName = srcTableName;
    cliOptions.colName = fieldName;
    cliOptions.colIndex = colid;
    cliOptions.operator = operator;
    cliOptions.newTableName = newTableName;
    cliOptions.newColumnName = newColName;


    var msg = StatusMessageTStr.GroupBy+" "+cliOptions.operator;
    StatusMessage.show(msg);
    
    XcalarGroupBy(operator, newColName, fieldName, srcTableName, newTableName)
    .then(function() {
        // TODO Create new gTables entry
        // setIndex(newTableName, newTableCols);
        return (refreshTable(newTableName, tableNum, KeepOriginalTables.Keep));
    })
    .then(function() {
        commitToStorage();
        Cli.add('Group By', cliOptions);
        StatusMessage.success(msg);
        deferred.resolve();
    })
    .fail(function(error) {
        Alert.error("GroupBy fails", error);
        StatusMessage.fail(StatusMessageTStr.GroupByFailed, msg);
        deferred.reject(error);
    });

    return (deferred.promise());
}

function aggregateCol(operator, colName, tableNum) {
    showWaitCursor();
    var msg = StatusMessageTStr.Aggregate+' '+operator+' '+
                        StatusMessageTStr.OnColumn+': ' + colName
    StatusMessage.show(msg);
    XcalarAggregate(colName, gTables[tableNum].backTableName, operator)
    .then(function(value){
        // show result in alert modal
        var title = 'Aggregate: ' + operator;
        var instr = 'This is the aggregate result for column "' + 
                    colName + '". \r\n The aggregate operation is "' +
                    operator + '".';
        Alert.show({'title':title, 'msg':value, 
                    'instr': instr, 'isAlert':true,
                    'isCheckBox': true});
        StatusMessage.success(msg);
    })
    .fail(function(error) {
        Alert.error("Aggregate fails", error);
        StatusMessage.fail(StatusMessageTStr.AggregateFailed, msg);
    })
    .always(function() {
        removeWaitCursor();
    });
}

function filterCol(operator, value, colid, tableNum) {
    var deferred = jQuery.Deferred();

    var rand = Math.floor((Math.random() * 100000) + 1);
    var newTableName = "tempFilterTable"+rand;
    var srcTableName = gTables[tableNum].frontTableName;
    var tablCols = gTables[tableNum].tableCols;
    var colName = tablCols[colid - 1].name;
    // add cli
    var cliOptions = {};
    cliOptions.operation = 'filter';
    cliOptions.tableName = srcTableName;
    cliOptions.colName = colName;
    cliOptions.colIndex = colid;
    cliOptions.operator = operator;
    cliOptions.value = value;
    cliOptions.newTableName = newTableName;

    var msg = StatusMessageTStr.Filter+': '+cliOptions.colName
    StatusMessage.show(msg);
    console.log(colid); 

    XcalarFilter(operator, value, colName, srcTableName, newTableName)
    .then(function() {
        setIndex(newTableName, tablCols);
        return (refreshTable(newTableName, tableNum));
    })
    .then(function() {
        commitToStorage();
        Cli.add('Filter Table', cliOptions);
        StatusMessage.success(msg);
        deferred.resolve();
    })
    .fail(function(error) {
        Alert.error("filterCol fails", error);
        StatusMessage.fail(StatusMessageTStr.FilterFailed, msg);
        deferred.reject(error);
    });
    
    return (deferred.promise());
}

function createJoinIndex(rightTableNum, tableNum) {
    // Combine the columns from the 2 current tables
    // Note that we have to create deep copies!!
    var newTableCols = jQuery.extend(true, [],
                                     gTables[tableNum].tableCols);
    for (var i = 0; i<newTableCols.length; i++) {
        newTableCols[i] = jQuery.extend(true, {},
                                        gTables[tableNum].tableCols[i]);
    }
    var removed = false;
    var dataCol;

    for (var i = 0; i<newTableCols.length; i++) {
        if (!removed) {
            if (newTableCols[i].name == "DATA") {
                dataCol = newTableCols.splice(i, 1);
                removed = true;
            }
        } else {
            newTableCols[i].index--;
        }
    }
    removed = false;
    var newRightTableCols = jQuery.extend(true, [], 
                                          gTables[rightTableNum].tableCols);
    for (var i = 0; i<newRightTableCols.length; i++) {
        newRightTableCols[i] = jQuery.extend(true, {},
                                           gTables[rightTableNum].tableCols[i]);
    }
    for (var i = 0; i<newRightTableCols.length; i++) {
        newRightTableCols[i].index+=(newTableCols.length);
        if (!removed) {
            if (newRightTableCols[i].name == "DATA") {
                newRightTableCols.splice(i, 1);
                removed = true;
            }
        } else {
            newRightTableCols[i].index--;

        }
    }
    newTableCols = newTableCols.concat(newRightTableCols);
    dataCol[0].index = newTableCols.length+1;
    newTableCols = newTableCols.concat(dataCol);
    return (newTableCols);
}

function joinTables(newTableName, joinTypeStr, leftTableNum, leftColumnNum,
                    rightTableNum, rightColumnNum) {
    var deferred = jQuery.Deferred();
    var joinType = "";
    switch (joinTypeStr) {
    case ("Inner Join"):
        joinType = JoinOperatorT.InnerJoin;
        break;
    case ("Left Outer Join"):
        joinType = JoinOperatorT.LeftOuterJoin;
        break;
    case ("Right Outer Join"):
        joinType = JoinOperatorT.RightOuterJoin;
        break;
    case ("Full Outer Join"):
        joinType = JoinOperatorT.FullOuterJoin;
        break;
    default:
        console.log("Incorrect join type!");
        break;
    }

    showWaitCursor();
    var leftName = gTables[leftTableNum].backTableName;
    
    var leftColName =
                    gTables[leftTableNum].tableCols[leftColumnNum].func.args[0];
    
    XcalarGetNextPage(gTables[leftTableNum].resultSetId, 1)
    .then(function(result) {
        var leftIndexColName = result.keysAttrHeader.name;

        if (leftColName != leftIndexColName) {
            console.log("left not indexed correctly");
            // XXX In the future,we can check if there are other tables that are
            // indexed on this key. But for now, we reindex a new table
            var rand = Math.floor((Math.random() * 100000) + 1);
            var newTableName1 = leftName+rand;
            leftName = newTableName1;
            
            return (XcalarIndexFromTable(gTables[leftTableNum].backTableName,
                                 leftColName, newTableName1)
                    .then(function() {
                            return (joinTables2([newTableName, joinType,
                                               leftTableNum, leftName,
                                               rightTableNum, rightColumnNum]));
                          })
                    );
        } else {
            console.log("left indexed correctly");
            return (joinTables2([newTableName, joinType, leftTableNum, 
                                 leftName, rightTableNum, rightColumnNum]));
        }
    })
    .then(deferred.resolve)
    .fail(function(error) {
        console.log("joinTables fails!");
        deferred.reject(error);
    })
    .always(function() {
        removeWaitCursor();
    });

    return (deferred.promise());
}

function joinTables2(args) {
    var deferred = jQuery.Deferred();

    var newTableName = args[0];
    var joinType = args[1];
    var leftTableNum = args[2];
    var leftName = args[3];
    var rightTableNum = args[4];
    var rightColumnNum = args[5];
    
    var rightColName =
                  gTables[rightTableNum].tableCols[rightColumnNum].func.args[0];
    

    XcalarGetNextPage(gTables[rightTableNum].resultSetId, 1)
    .then(function(result) {
        var rightIndexColName = result.keysAttrHeader.name;

        var rightName = gTables[rightTableNum].backTableName;   
        if (rightColName != rightIndexColName) {
            console.log("right not indexed correctly");
            var rand = Math.floor((Math.random() * 100000) + 1);
            var newTableName2 = gTables[rightTableNum].backTableName+rand;
            rightName = newTableName2;
            return (XcalarIndexFromTable(gTables[rightTableNum].backTableName,
                                         rightColName, newTableName2)
                    .then(function() {
                              return (joinTables3([newTableName, joinType,
                                      leftTableNum, leftName, rightTableNum,
                                      rightName]));
                          })
                    );
        } else {
            console.log("right correctly indexed");
            return (joinTables3([newTableName, joinType, leftTableNum, 
                                 leftName, rightTableNum, rightName]));
        }
    })
    .then(deferred.resolve)
    .fail(function(error) {
        console.log("joinTables2 fails!");
        deferred.reject(error);
    });

    return (deferred.promise());
}

function joinTables3(args) {
    var deferred = jQuery.Deferred();

    var newTableName = args[0];
    var joinType = args[1];
    var leftTableNum = args[2];
    var leftName = args[3];
    var rightTableNum = args[4];
    var rightName = args[5];
    
    var newTableCols = createJoinIndex(rightTableNum, leftTableNum);
    XcalarJoin(leftName, rightName, newTableName, joinType)
    .then(function() {
        setIndex(newTableName, newTableCols);
        return (refreshTable(newTableName, leftTableNum, 
                             KeepOriginalTables.DontKeep, rightTableNum));
    })
    .then(function() {
        commitToStorage();
        deferred.resolve();
    })
    .fail(function(error) {
        console.log("joinTables3 fails!");
        deferred.reject(error);
    });

    return (deferred.promise());
}
