window.FnBar = (function(FnBar, $) {
    var $functionArea; // $("#functionArea");
    var $fnBar; // $('#functionArea .CodeMirror')

    var $lastColInput = null;
    var searchHelper;
    var editor;
    var validOperators = ['pull', 'map', 'filter'];

    FnBar.setup = function() {
        $functionArea = $("#functionArea");

        editor = CodeMirror.fromTextArea($('#fnBar')[0], {
            "mode"             : "spreadsheetCustom",
            "indentWithTabs"   : true,
            "indentUnit"       : 4,
            "matchBrackets"    : true,
            "placeholder"      : WSTStr.SearchTableAndColumn,
            "autoCloseBrackets": true
        });

        $(window).blur(function() {
            editor.getInputField().blur();
        });

        $functionArea.find('pre').addClass('fnbarPre');
        $fnBar = $('#functionArea .CodeMirror');

        setupSearchHelper();
        var initialTableId; //used to track table that was initially active
        // when user started searching

        editor.on("keydown", function(instance, event) {
            if (event.which !== keyCode.Enter) {
                return;
            }
            var val = editor.getValue();
            var mismatch = xcHelper.checkMatchingBrackets(val);

            if (mismatch.index === -1) {
                functionBarEnter();
            } else {
                var savedStr = editor.getValue();
                var savedColInput = $lastColInput;
                var funcStr = "\"" + val.slice(0, mismatch.index) +
                                "<span style='color:red;" +
                                "font-weight:bold;'>" +
                                mismatch.char + "</span>" +
                                val.slice(mismatch.index + 1) + "\"";

                Alert.show({
                    "title"      : AlertTStr.BracketsMis,
                    "msgTemplate": ErrTStr.BracketsMis + "<br/>" + funcStr,
                    "isAlert"    : true,
                    "onCancel"   : function() {
                        if (savedColInput) {
                            savedColInput.trigger({
                                type : "mousedown",
                                which: 1
                            });
                            $fnBar.removeAttr("disabled");
                            editor.setValue(savedStr);
                            $fnBar.focus();
                        } else {
                            $fnBar.removeAttr("disabled");
                        }
                    }
                });

                editor.setValue(savedStr);
                $fnBar.prop("disabled", "true");
            }

        });

        editor.on("mousedown", function() {
            $fnBar.addClass("inFocus");
            $fnBar.find('.CodeMirror-placeholder').show();
        });
        editor.on("focus", function() {
            initialTableId = gActiveTableId;
        });

        // editor.on("blur") is triggered during selection range mousedown
        // which it shouldn't (due to dragndrop) so it's not reliable to use


        // disallow adding newlines
        editor.on("beforeChange", function(instance, change) {
        // remove ALL \n
            var newtext = change.text.join("").replace(/\n/g, "");
            if (change.update) {
                change.update(change.from, change.to, [newtext]);
            }
            return true;
        });

        // change is triggered during user's input or when clearing/emptying
        // the input field
        editor.on("change", function(instance, change) {
            var val = editor.getValue();
            var trimmedVal = val.trim();
            if ($fnBar.hasClass('disabled')) {
                $functionArea.removeClass('searching');
                return;
            }
            // only search if string does not begin with =
            // if string is empty, then it should at least have a class searching
            // otherwise we do not search
            if (trimmedVal.indexOf('=') !== 0 &&
                (trimmedVal.length || $functionArea.hasClass('searching'))) {
                $functionArea.addClass('searching');
                var args = {
                    "value"         : trimmedVal,
                    "searchBar"     : searchHelper,
                    "initialTableId": initialTableId
                };
                ColManager.execCol("search", null, null, null, args);
                $lastColInput = null;
            } else {
                $functionArea.removeClass('searching');
            }
        });
    };

    FnBar.focusOnCol = function($colInput, tableId, colNum, forceFocus) {
        if (!forceFocus && $lastColInput != null &&
            $colInput.get(0) === $lastColInput.get(0) &&
            !$fnBar.parent().hasClass('searching'))
        {
            // the function bar origin hasn't changed so just return
            // and do not rehighlight or update any text
            return;
        }

        $lastColInput = $colInput;
        var progCol = gTables[tableId].tableCols[colNum - 1];
        if ($colInput.parent().hasClass("editable")) {
            if (!progCol.isNewCol) {
                throw "Error Case, only new column can be editable";
            }
            editor.setValue(FnBarTStr.NewCol);
            $fnBar.addClass("disabled").removeClass('active');
            // var keepVal = false;
            // if ($lastColInput) {
            //     keepVal = true;
            // }

            $functionArea.removeClass('searching');
        } else {
            editor.getInputField().blur(); // hack to reset blur
            var userStr = progCol.userStr;
            userStr = userStr.substring(userStr.indexOf('='));
            editor.setValue(userStr);
            $fnBar.addClass('active').removeClass('disabled');
            $fnBar.parent().removeClass('searching');
        }
    };

    FnBar.clear = function(noSave) {
        if (!noSave) {
            saveInput();
        }
        $lastColInput = null;
        editor.setValue("");
        $fnBar.removeClass("active inFocus disabled");
    };

    function saveInput() {
        if (!$lastColInput || !$lastColInput.length) {
            return;
        }
        var fnBarVal = editor.getValue().trim();
        if (fnBarVal.indexOf("=") === 0) {
            fnBarVal = fnBarVal.substring(1);
        } else {
            return;
        }
        fnBarVal = fnBarVal.trim();
        var $colInput = $lastColInput;
        var $table   = $colInput.closest('.dataTable');
        var tableId  = xcHelper.parseTableId($table);
        var colNum   = xcHelper.parseColNum($colInput);
        var table    = gTables[tableId];
        var tableCol = table.tableCols[colNum - 1];

        tableCol.userStr = "\"" + tableCol.name + "\"" + " = " +
                            fnBarVal;
    }

    function setupSearchHelper() {
        searchHelper = new SearchBar($functionArea, {
            "removeSelected": function() {
                $('.xcTable:visible').find('.selectedCell')
                                     .removeClass('selectedCell');
            },
            "highlightSelected": function($match) {
                if ($match.is('th')) {
                    highlightColumn($match);
                    $('#mainFrame').find('.tblTitleSelected')
                                   .removeClass('tblTitleSelected');
                    $('.dagWrap.selected').removeClass('selected')
                                          .addClass('notSelected');
                    RowScroller.empty();
                } else if ($match.is('.tableTitle')) {
                    var tableId = $match.closest('.xcTableWrap').data('id');
                    focusTable(tableId, true);
                }
            },
            "scrollMatchIntoView": function($match) {
                var $mainFrame = $('#mainFrame');
                var mainFrameWidth = $mainFrame.width();
                var matchOffsetLeft = $match.offset().left;
                var scrollLeft = $mainFrame.scrollLeft();
                var matchWidth = $match.width();
                if (matchOffsetLeft > mainFrameWidth - matchWidth) {
                    $mainFrame.scrollLeft(matchOffsetLeft + scrollLeft -
                                        ((mainFrameWidth - matchWidth) / 2));
                } else if (matchOffsetLeft < 25) {
                    $mainFrame.scrollLeft(matchOffsetLeft + scrollLeft -
                                        ((mainFrameWidth - matchWidth) / 2));
                }
            },
            "codeMirror"          : editor,
            "$input"              : $fnBar,
            "ignore"              : "=",
            "arrowsPreventDefault": true
        });

        searchHelper.setup();
    }

    function functionBarEnter() {
        var fnBarVal = editor.getValue();
        var fnBarValTrim = fnBarVal.trim();
        var $colInput = $lastColInput;

        if (!$colInput || !$colInput.length) {
            return;
        }

        if (fnBarValTrim.indexOf('=') === 0) {
            var $table   = $colInput.closest('.dataTable');
            var tableId  = xcHelper.parseTableId($table);
            var colNum   = xcHelper.parseColNum($colInput);
            var table    = gTables[tableId];
            var tableCol = table.tableCols[colNum - 1];
            var colName  = tableCol.name;

            if (tableCol.isNewCol && colName === "") {
                // when it's new column and do not give name yet
                StatusBox.show(ErrTStr.NoEmpty, $colInput);
                return;
            }

            $fnBar.removeClass("inFocus");

            var newFuncStr = '"' + colName + '" ' + fnBarValTrim;
            var oldUsrStr  = tableCol.userStr;

            $colInput.blur();
            // when usrStr not change
            if (newFuncStr === oldUsrStr) {
                return;
            }

            $colInput.closest('th').removeClass('unusedCell');
            $table.find('td:nth-child(' + colNum + ')')
                  .removeClass('unusedCell');

            var operation = getOperationFromFuncStr(newFuncStr);
            if (validOperators.indexOf(operation) < 0) {
                var text = "";
                var endText = false;

                if (operation.length) {
                    text = "Invalid Operator: <b>" + operation + "</b>.<br/>";
                } else {
                    if (fnBarValTrim.indexOf("(") === -1) {
                        text = FnBarTStr.InvalidOpParen;
                        endText = true;
                    } else {
                        text = "Invalid Operator.<br/>";
                    }
                }
                if (!endText) {
                    text += FnBarTStr.ValidOps;
                }

                setTimeout(function() {
                    StatusBox.show(text, $fnBar.prev().prev(), null, {
                        "offsetX": 50,
                        "side"   : "bottom",
                        "html"   : true
                    });
                }, 0); // gets closed immediately without timeout;

                return;
            }


            ColManager.execCol(operation, newFuncStr, tableId, colNum)
            .then(function(ret) {
                if (ret === "update") {
                    updateTableHeader(tableId);
                    TableList.updateTableInfo(tableId);
                    KVStore.commit();
                }
            });
        }
    }

    function getOperationFromFuncStr(funcStr) {
        var operation = funcStr.substring(funcStr.indexOf("=") + 1).trim();
        operation = operation.substr(0, operation.indexOf("("));
        return (operation);
    }

    return (FnBar);
}({}, jQuery));
