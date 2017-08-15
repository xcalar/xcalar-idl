window.Dag = (function($, Dag) {
    var $dagPanel;
    var scrollPosition = -1;
    var dagAdded = false;

    // constants
    var dataStoreWidth = 64;
    Dag.tableWidth = 214; // includes the blue table and gray operation icon
    Dag.groupOutlineOffset = 20;
    Dag.condenseOffset = 0.3; // condense icon offsets table x-coor by 30%
    Dag.canvasLimit = 32767;
    Dag.canvasAreaLimit = 268435456; // browsers can't support more

    /* options:
        wsId: string, worksheet for dag image to belong to (used for placement)
        position: integer, used to place dag image
        atStartup: boolean, if true, will append instead of positioning image
    */
    Dag.construct = function(tableId, tableToReplace, options) {
        var deferred = jQuery.Deferred();
        var table = gTables[tableId];
        var tableName = table.tableName;
        $dagPanel = $('#dagPanel');

        XcalarGetDag(tableName)
        .then(function(dagObj) {
            var oldTableId = xcHelper.getTableId(tableToReplace);
            var isWorkspacePanelVisible = $('#workspacePanel')
                                            .hasClass('active');
            var isDagPanelVisible = !$('#dagPanel').hasClass('xc-hidden');
            if (!isWorkspacePanelVisible) {
                $('#workspacePanel').addClass('active');
            }
            if (!isDagPanelVisible) {
                $('#dagPanel').removeClass('xc-hidden');
            }

            var addDFTooltip = TooltipTStr.AddDataflow;

            var isTableInActiveWS = false;
            var targetWS;
            if (options.wsId) {
                targetWS = options.wsId;
            } else if (oldTableId) {
                targetWS = WSManager.getWSFromTable(oldTableId);
            } else {
                targetWS = WSManager.getActiveWS();
            }

            if (WSManager.getActiveWS() === targetWS) {
                isTableInActiveWS = true;
            }
            var dagClasses = isTableInActiveWS ? "" : "inActive";
            dagClasses += " worksheet-" + targetWS;
            var outerDag =
                '<div class="dagWrap clearfix ' + dagClasses +
                   '" id="dagWrap-' + tableId + '" data-id="' + tableId + '">' +
                '<div class="header clearfix">' +
                    '<div class="btn infoIcon">' +
                        '<i class="icon xi-info-rectangle"></i>' +
                    '</div>' +
                    '<div class="tableTitleArea">' +
                        '<span>Table: </span>' +
                        '<span class="tableName">' +
                            tableName +
                        '</span>' +
                    '</div>' +
                    '<div class="retinaArea" data-tableid="' +
                        tableId + '">' +
                        '<div data-toggle="tooltip" data-container="body" ' +
                        'data-placement="top" data-original-title="' +
                            addDFTooltip + '" ' +
                        'class="btn btn-small addDataFlow">' +
                            '<i class="icon xi-add-dataflow"></i>' +
                        '</div>' +
                        '<div data-toggle="tooltip" data-container="body" ' +
                        'data-placement="top" title="' +
                            TooltipTStr.NewTabQG + '" ' +
                        'class="btn btn-small newTabImageBtn">' +
                            '<i class="icon xi-open-img-newtab"></i>' +
                        '</div>' +
                        '<div data-toggle="tooltip" data-container="body" ' +
                        'data-placement="top" title="' +
                            TooltipTStr.SaveQG + '" ' +
                        'class="btn btn-small saveImageBtn">' +
                            '<i class="icon xi-save_img"></i>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '</div>';

            if (options.atStartUp) {
                $(".dagArea").append(outerDag);
            } else if (oldTableId) {
                var $oldDag =  $("#dagWrap-" + oldTableId);
                $oldDag.after(outerDag);
            } else {
                var position = xcHelper.getTableIndex(targetWS, options.position,
                                             '.dagWrap');
                if (position === 0) {
                    $(".dagArea").find(".legendArea").after(outerDag);
                } else {
                    var $prevDag = $(".dagWrap:not(.building)")
                                                    .eq(position - 1);
                    if ($prevDag.length) {
                        $prevDag.after(outerDag);
                    } else {
                        $(".dagArea").append(xcTableWrap); // shouldn't happen
                    }
                }
            }

            var $dagWrap = $('#dagWrap-' + tableId);

            DagDraw.createDagImage(dagObj.node, $dagWrap, {savable: true,
                                                       tableId: tableId});

            Dag.focusDagForActiveTable(tableId);

            // add lock icon to tables that should be locked or not dropped
            applyLockIfNeeded($dagWrap);

            if ($('#xcTableWrap-' + tableId).find('.tblTitleSelected').length) {
                $('.dagWrap.selected').removeClass('selected')
                                      .addClass('notSelected');
                $dagWrap.removeClass('notSelected')
                                        .addClass('selected');
            }

            Dag.addEventListeners($dagWrap);
            if (!dagAdded) {
                preventUnintendedScrolling();
            }

            dagAdded = true;

            if (!isWorkspacePanelVisible) {
                $('#workspacePanel').removeClass('active');
            }
            if (!isDagPanelVisible) {
                $('#dagPanel').addClass('xc-hidden');
            }
            $dagWrap.addClass("building");

            deferred.resolve();
        })
        .fail(function(error) {
            console.error('dag failed', error);
            deferred.reject(error);
        });

        return (deferred.promise());
    };

    Dag.destruct = function(tableId) {
        $('#dagWrap-' + tableId).remove();
        DagFunction.destruct(tableId);
    };

    Dag.renameAllOccurrences = function(oldTableName, newTableName) {
        var $dagPanel = $('#dagPanel');

        $dagPanel.find('.tableName').filter(function() {
            return ($(this).text() === oldTableName);
        }).text(newTableName);

        var $dagTableTitles = $dagPanel.find('.tableTitle').filter(function() {
            return ($(this).text() === oldTableName);
        });
        $dagTableTitles.text(newTableName);
        xcTooltip.changeText($dagTableTitles, newTableName);
        $dagTableTitles.parent().data('tablename', newTableName);
        var $dagOpText = $dagPanel.find(".opInfoText").filter(function() {
            return ($(this).text().indexOf(oldTableName) > -1);
        });

        $dagOpText.text(newTableName);
        var $actionTypes = $dagOpText.closest('.actionType');
        $actionTypes.each(function() {
            var tooltipText = $(this).attr('data-original-title');
            var newText;
            if (tooltipText) {
                var re = new RegExp(oldTableName, "g");
                newText = tooltipText.replace(re, newTableName);
                xcTooltip.changeText($(this), newText);
            }
            var title = $(this).attr('title');
            if (title) {
                newText = title.replace(oldTableName, newTableName);
                $(this).attr('title', newText);
            }
        });
    };

    // nameProvided: boolean, if true, tableId arg is actually a tablename
    Dag.makeInactive = function(tableId, nameProvided) {
        var tableName;
        var $dags;
        $dagPanel = $('#dagPanel');
        if (nameProvided) {
            tableName = tableId;
            $dags = $dagPanel.find('.dagTable[data-tableName="' +
                                   tableName + '"]');
        } else {
            tableName = gTables[tableId].tableName;
            $dags = $dagPanel.find('.dagTable[data-id="' + tableId + '"]');
        }

        $dags.removeClass('Ready')
             .addClass('Dropped');
        var text = xcHelper.replaceMsg(TooltipTStr.DroppedTable,
                                        {"tablename": tableName});
        $dags.find(".dagTableIcon, .dataStoreIcon").each(function() {
            xcTooltip.changeText($(this), text);
        });
    };

    Dag.focusDagForActiveTable = function(tableId, tableFocused) {
        // tableId given only when initial dag is created
        var activeTableId;
        var $dagWrap;
        var $dag;
        $dagPanel = $('#dagPanel');
        if (tableId) {
            activeTableId = tableId;
            $dagWrap = $('#dagWrap-' + activeTableId);
            $dag = $dagWrap.find('.dagImageWrap');
            $dag.scrollLeft($dag.find('.dagImage').width());
            DagPanel.setScrollBarId($(window).height());
            DagPanel.adjustScrollBarPositionAndSize();
        } else {
            activeTableId = gActiveTableId;
            $dagWrap = $('#dagWrap-' + activeTableId);
            $dag = $dagWrap.find('.dagImageWrap');

            if (!$dag.length) {
                DagPanel.setScrollBarId($(window).height());
                DagPanel.adjustScrollBarPositionAndSize();
                return;
            }
            if (tableFocused) {
                if (checkIfDagWrapVisible($dagWrap)) {
                    DagPanel.setScrollBarId($(window).height());
                    DagPanel.adjustScrollBarPositionAndSize();
                    return;
                }
            }

            $dag.scrollLeft($dag.find('.dagImage').width());

            var scrollTop = $dagPanel.find('.dagArea').scrollTop();
            var dagTop = $dagWrap.position().top;

            if (dagTop - 95 + $dagPanel.scrollTop() === 0) {
                $dagPanel.scrollTop(0);
            } else {
                $dagPanel.find('.dagArea').scrollTop(scrollTop + dagTop - 16);
            }
            DagPanel.setScrollBarId($(window).height());
            DagPanel.adjustScrollBarPositionAndSize();
        }
    };

    Dag.expandAll = function($dagWrap) {
        var allDagInfo = $dagWrap.data('allDagInfo');
        var idMap = allDagInfo.nodeIdMap;
        var tree = allDagInfo.tree;
        var groups = allDagInfo.groups;
        var $dagImage = $dagWrap.find('.dagImage');
        var dagImageWidth = $dagImage.outerWidth();
        var prevScrollLeft = $dagImage.parent().scrollLeft();
        var depth;
        var size;
        var right;
        var node;
        var groupWidth;
        var $groupOutline;
        var $expandWrap;

        // move the tables
        expandShiftTables(tree, $dagImage);

        // move the group outlines and icons
        for (var i in groups) {
            groups[i].collapsed = false;
            var node = idMap[i];
            depth = node.value.display.depth + 1;
            right = groups[i].group[0].value.display.x + 190;
            $expandWrap = $dagImage.find('.expandWrap[data-index="' + i + '"]');
            $expandWrap.css('right', right).data('depth', depth)
                                           .addClass('expanded');
            xcTooltip.changeText($expandWrap, TooltipTStr.ClickCollapse);
            size = $expandWrap.data('size');
            $groupOutline = $expandWrap.next();
            groupWidth = size * Dag.tableWidth + 11;
            $groupOutline.css('right', (right + 15) - groupWidth)
                         .addClass('expanded');

        }

        depth = allDagInfo.depth;
        var newWidth = (depth - 1) * Dag.tableWidth + dataStoreWidth;
        $dagImage.outerWidth(newWidth);

        var collapse = false;
        var all = true;
        DagDraw.updateCanvasAfterWidthChange($dagWrap, tree, newWidth, collapse,
                                             all);

        $dagImage.parent().scrollLeft(prevScrollLeft + (newWidth -
                                      dagImageWidth));
    };

    Dag.checkCanExpandAll = function($dagWrap) {
        var currentCanvasHeight = $dagWrap.find('canvas').height();
        var allDagInfo = $dagWrap.data('allDagInfo');
        var depth = allDagInfo.depth;
        var expectedWidth = (depth - 1) * Dag.tableWidth + dataStoreWidth + 100;

        if (expectedWidth > Dag.canvasLimit ||
            (expectedWidth * currentCanvasHeight) > Dag.canvasAreaLimit) {
            return (false);
        } else {
            return (true);
        }
    };

    Dag.collapseAll = function($dagWrap) {
        var allDagInfo = $dagWrap.data('allDagInfo');
        var idMap = allDagInfo.nodeIdMap;
        var tree = allDagInfo.tree;
        var groups = allDagInfo.groups;
        var $dagImage = $dagWrap.find('.dagImage');
        var dagImageWidth = $dagImage.outerWidth();
        var prevScrollLeft = $dagImage.parent().scrollLeft();
        var depth;
        var size;
        var right;
        var node;
        var $groupOutline;
        var $expandWrap;
        var group;
        var $dagTableWrap;
        var tooltip;

        collapseShiftTables(tree, $dagImage);

        $dagImage.find('.dagTable.dataStore').parent().removeClass('hidden');

        for (var i in groups) {
            groups[i].collapsed = true;
            var node = idMap[i];
            depth = node.value.display.depth + 1;
            group = groups[i].group;
            right = group[0].value.display.x - dataStoreWidth;
            $expandWrap = $dagImage.find('.expandWrap[data-index="' + i + '"]');
            $expandWrap.css('right', right).data('depth', depth)
                                           .removeClass('expanded');

            size = $expandWrap.data('size');

            if (size === 1) {
                tooltip = TooltipTStr.CollapsedTable;
            } else {
                tooltip = xcHelper.replaceMsg(TooltipTStr.CollapsedTables, {
                    number: size + ""
                });
            }
            xcTooltip.changeText($expandWrap, tooltip);

            $groupOutline = $expandWrap.next();
            $groupOutline.css('right', (right - Dag.groupOutlineOffset))
                         .addClass('expanded');
            for (var j = 0; j < group.length; j++) {
                node = group[j];
                node.value.display.isHidden = true;
                $dagTableWrap = $dagImage.find('.dagTable[data-index="' +
                                                node.value.dagNodeId + '"]').parent();
                $dagTableWrap.addClass('hidden');
            }
        }

        $dagImage.outerWidth(allDagInfo.condensedWidth);

        var collapse = true;
        var all = true;
        DagDraw.updateCanvasAfterWidthChange($dagWrap, tree,
                                             allDagInfo.condensedWidth,
                                             collapse, all);
        $dagImage.parent().scrollLeft(prevScrollLeft +
                                    (allDagInfo.condensedWidth - dagImageWidth));
    };

    Dag.setupDagSchema = function() {
        var $dagSchema = $("#dagSchema");
        $dagSchema.on("mouseup", ".content li", function(event) {
            if (event.which !== 1) {
                return;
            }
            var $li = $(this);
            var $name = $li.find('.name');
            $dagSchema.find('li.selected').removeClass('selected');
            $li.addClass('selected');
            var tableId   = $dagSchema.data('tableid');
            var $dagTable = $dagSchema.data('$dagTable');
            var id        = parseInt($dagTable.data('index'));
            var $dagWrap  = $dagTable.closest('.dagWrap');
            var idMap     = $dagWrap.data('allDagInfo').nodeIdMap;
            var node = idMap[id];
            var name      = $name.text();
            var progCol = gTables[tableId].getColByFrontName(name);
            var backName  = $name.data('backname');
            if (!backName) {
                backName = name;
            }

            var sourceColNames = getSourceColNames(progCol.func);
            $('.columnOriginInfo').remove();
            $dagPanel.find('.highlighted').removeClass('highlighted');
            highlightColumnSource($dagWrap, node);
            var storedInfo = {
                foundTables: {},
                droppedTables: {}
            };

            findColumnSource(sourceColNames, $dagWrap, node, backName,
                            progCol.isEmptyCol(), true, node,
                            storedInfo);
            $(document).mousedown(closeDagHighlight);
        });

        $dagSchema.on("click", '.sort', function() {
            var tableId = $dagSchema.data("tableid");
            var table = gTables[tableId];
            var sortByNode = false;
            var reversed = false;
            var $btn = $(this);
            if ($btn.parent().hasClass("text")) {
                sortByNode = true;
            }
            $dagSchema.find(".subHeader").children().removeClass("active");
            $btn.parent().addClass("active");
            $btn.parent().toggleClass("reversed");
            if ($btn.parent().hasClass("reversed")) {
                reversed = true;
            }

            getSchemaNodeInfo($dagSchema, table, sortByNode, reversed);
        });

        $dagSchema.on("click", ".expand", function() {
            $dagSchema.toggleClass("expanded");
        });

        $dagSchema.find(".close").click(function() {
            hideSchema();
        });

        $dagSchema.draggable({
            handle: '#dagSchemaTitle',
            cursor: '-webkit-grabbing',
            containment: "window"
        });

        $dagSchema.resizable({
            handles: "n, e, s, w, se",
            minHeight: 200,
            minWidth: 200,
            containment: "document"
        });
    };

    Dag.showDataStoreInfo = function($dagTable) {
        var $schema = $('#dagSchema');
        $schema.addClass("loadInfo");
        var tableName = $dagTable.data("tablename");
        var schemaId = Math.floor(Math.random() * 100000);
        $schema.data("id", schemaId);

        $schema.find('.tableName').text(tableName);
        $schema.find('.numCols').text("");
        var datasets = $dagTable.closest(".dagWrap").data().allDagInfo.datasets;
        var loadInfo = datasets[tableName].loadInfo;
        if (loadInfo.format !== "csv") {
            delete loadInfo.loadArgs.csv;
        }
        if (loadInfo.loadArgs && loadInfo.loadArgs.csv) {
            loadInfo.loadArgs.csv.recordDelim =
                    loadInfo.loadArgs.csv.recordDelim
                    .replace(/\t/g, "\\t").replace(/\n/g, "\\n");
            loadInfo.loadArgs.csv.quoteDelim =
                    loadInfo.loadArgs.csv.quoteDelim
                    .replace(/\t/g, "\\t").replace(/\n/g, "\\n");
            loadInfo.loadArgs.csv.fieldDelim =
                    loadInfo.loadArgs.csv.fieldDelim
                    .replace(/\t/g, "\\t").replace(/\n/g, "\\n");
        }

        loadInfo.name = tableName;

        if (loadInfo.numEntries == null || loadInfo.size == null) {
            var dsObj = DS.getDSObj(tableName);
            loadInfo.numEntries = dsObj.getNumEntries();
            loadInfo.size = dsObj.getSize();
        }
        if (loadInfo.numEntries == null || loadInfo.size == null) {
            // XXX todo, this may be cached in DSOBj, and if not we can
            // cache it here
            XcalarGetDatasetMeta(tableName)
            .then(function(res) {
                // check if current schema
                if ($schema.data("id") !== schemaId) {
                    return;
                }
                if (res != null && res.metas != null) {
                    var metas = res.metas;
                    var size = 0;
                    var numRows = 0;
                    // sum up size from all nodes
                    for (var i = 0, len = metas.length; i < len; i++) {
                        size += metas[i].size;
                        numRows += metas[i].numRows;
                    }

                    loadInfo.numEntries = numRows;
                    loadInfo.size = xcHelper.sizeTranslator(size);
                    var html = prettify(loadInfo);
                    $schema.find(".content").html(html);
                }
            });
        }

        var html = prettify(loadInfo);

        $schema.find(".content").addClass("prettyJson").html(html);
        $schema.addClass("active");
        xcTooltip.hideAll();

        $(document).on('mousedown.hideDagSchema', function(event) {
            if ($(event.target).closest('#dagSchema').length === 0 &&
                $(event.target).closest('#dagScrollBarWrap').length === 0) {
                hideSchema();
            }
        });

        positionSchemaPopup($dagTable);
    };

    Dag.showSchema = function($dagTable) {
        var tableId = $dagTable.data('id');
        var table = gTables[tableId];
        var $schema = $('#dagSchema');
        $schema.removeClass("loadInfo");
        var tableName;
        var numCols;
        var numRows = CommonTxtTstr.Unknown;
        $schema.data('tableid', tableId);
        $schema.data('$dagTable', $dagTable);
        var schemaId = Math.floor(Math.random() * 100000);
        $schema.data("id", schemaId);
        $schema.find(".content").removeClass("prettyJson");
        if (!table) {
            tableName = $dagTable.find('.tableTitle').text();
            numCols = 1;
        } else {
            tableName = table.tableName;
            numCols = table.tableCols.length;
        }

        if (table) {
            var $sortedOn = $schema.find(".subHeader").children(".active");
            var sortByNode = false;
            var reversed = false;
            if ($sortedOn.hasClass("text")) {
                sortByNode = true;
            }
            if ($sortedOn.hasClass("reversed")) {
                reversed = true;
            }
            getSchemaNodeInfo($schema, table, sortByNode, reversed);
            if (table.resultSetCount > -1) {
                numRows = table.resultSetCount;
                numRows = xcHelper.numToStr(numRows);
            } else {
                numRows = "...";
                getSchemaNumRows($schema, schemaId, tableName, table);
            }
        } else {
            $schema.addClass("noNodeInfo");
            numRows = "...";
            getSchemaNumRows($schema, schemaId, tableName);
        }
        $schema.find('.tableName').text(tableName);
        $schema.find('.numCols').attr('title', CommonTxtTstr.NumCol)
                                   .text('[' + (numCols - 1) + ']');
        $schema.find('.rowCount .value').text(numRows);

        var html = "<ul>";

        for (var i = 0; i < numCols; i++) {
            if (numCols === 1) {
                continue;
            }
            var progCol = table.tableCols[i];
            if (progCol.isDATACol()) {
                continue;
            }
            var type = progCol.getType();
            var name = progCol.getFrontColName(true);
            var backName = progCol.getBackColName();
            html += '<li>' +
                        '<div>' +
                            '<span class="iconWrap">' +
                                '<i class="icon fa-13 xi-' + type + '"></i>' +
                            '</span>' +
                            '<span class="text">' + type + '</span>' +
                        '</div>' +
                        '<div title="' + name + '" class="name" ' +
                        'data-backname="' + backName + '">' +
                            name +
                        '</div>' +
                        // '<div>' +
                        // // XX SAMPLE DATA GOES HERE
                        // '</div>' +
                    '</li>';
        }
        if (numCols === 1) {
            html += '<span class="noFields">' + DFTStr.NoFields + '</span>';
        }
        html += "</ul>";

        $schema.find(".content").html(html);
        $schema.addClass("active");
        xcTooltip.hideAll();

        $(document).on('mousedown.hideDagSchema', function(event) {
            if ($(event.target).closest('#dagSchema').length === 0 &&
                $(event.target).closest('#dagScrollBarWrap').length === 0) {
                hideSchema();
            }
        });

        positionSchemaPopup($dagTable);
    };

    Dag.makeTableNoDelete = function(tableName) {
        var tableId = xcHelper.getTableId(tableName);
        var $dagTables = $("#dagPanel").find('.dagTable[data-id="' +
                                        tableId + '"]');
        $dagTables.addClass("noDelete");
        if (!$dagTables.hasClass("locked")) {
            var lockHTML = '<div class="lockIcon"></div>';
            $dagTables.append(lockHTML);
        }
    };

    Dag.removeNoDelete = function(tableId) {
        var $dagTables = $("#dagPanel").find('.dagTable[data-id="' +
                                        tableId + '"]');
        $dagTables.removeClass('noDelete');
        if (!$dagTables.hasClass("locked")) {
            $dagTables.find('.lockIcon').remove();
        }
    };

    Dag.addEventListeners = function($dagWrap) {
        $dagWrap.on('click', '.expandWrap', function() {
            var $expandIcon = $(this);
            var data = $expandIcon.data();
            var depth = data.depth;
            var index = data.index;
            var $dagWrap = $expandIcon.closest('.dagWrap');
            var groupInfo = $dagWrap.data('allDagInfo').groups[index];
            var group = groupInfo.group;
            var $groupOutline = $expandIcon.next();
            var expandIconRight;
            var newRight;

            if (!$expandIcon.hasClass('expanded')) {
                var canExpand = checkCanExpand(group, depth, index, $dagWrap);
                if (!canExpand) {
                    $dagWrap.addClass('unsavable');
                    xcTooltip.hideAll();
                    StatusBox.show(ErrTStr.DFNoExpand, $expandIcon, false, {
                        type: "info"
                    }) ;
                } else {
                    $expandIcon.addClass('expanded');
                    $groupOutline.addClass('expanded');

                    expandGroup(groupInfo, $dagWrap, $expandIcon);
                    xcTooltip.changeText($expandIcon, TooltipTStr.ClickCollapse);
                }
            } else {
                $expandIcon.removeClass('expanded');
                $groupOutline.removeClass('expanded');

                $groupOutline = $expandIcon.next();
                $groupOutline.removeClass('visible').hide();
                var size = $expandIcon.data('size');
                var tooltip;
                if (size === 1) {
                    tooltip = TooltipTStr.CollapsedTable;
                } else {
                    tooltip = xcHelper.replaceMsg(TooltipTStr.CollapsedTables, {
                        number: size + ""
                    });
                }
                xcTooltip.changeText($expandIcon, tooltip);
                collapseGroup(groupInfo, $dagWrap, $expandIcon);
            }
        });

        var groupOutlineTimeout;
        var $groupOutline = $();

        $dagWrap.on('mouseenter', '.expandWrap.expanded', function() {
            $groupOutline.hide();
            clearTimeout(groupOutlineTimeout);
            $groupOutline = $(this).next();
            $groupOutline.show();
            setTimeout(function() {
                $groupOutline.addClass('visible');
            });
        });
        $dagWrap.on('mouseleave', '.expandWrap.expanded', function() {
            $groupOutline = $(this).next();
            $groupOutline.removeClass('visible');
            groupOutlineTimeout = setTimeout(function() {
                $groupOutline.hide();
            }, 300);
        });

        dagScrollListeners($dagWrap.find('.dagImageWrap'));
    };

    function prettify(loadInfo) {
        var html = xcHelper.prettifyJson(loadInfo);
        html = "{\n" + html + "}";
        return html;
    }

    function getSchemaNodeInfo($schema, table, sortByNode, sortReverse) {
        $schema.removeClass('heavySkew slightSkew');
        if (!table.backTableMeta) {
            $schema.addClass("noNodeInfo");
            return;
        }
        $schema.removeClass("noNodeInfo");
        var meta = table.backTableMeta;
        var html = "<ul>";
        var totalRows = table.resultSetCount;
        var infos = [];
        for (var i = 0; i < meta.numMetas; i++) {
            infos.push({
                index: i,
                numRows: meta.metas[i].numRows
            });
        }

        if (sortByNode) {
            if (sortReverse) {
                infos = infos.sort(function(a, b) {
                    return b.index - a.index;
                });
            }
        } else {
            if (sortReverse) {
                infos = infos.sort(function(a, b) {
                    return b.numRows - a.numRows;
                });
            } else {
                infos = infos.sort(function(a, b) {
                    return a.numRows - b.numRows;
                });
            }
        }

        var largest = 0;
        var largestIndex;
        var numMetas = meta.numMetas;
        for (var i = 0; i < numMetas; i++) {
            var numRows = infos[i].numRows;
            var pct = (100 * (numRows / totalRows));
            if (pct > largest) {
                largest = pct;
                largestIndex = i;
            }
            pct = pct.toFixed(1);
            if (pct[pct.length - 1] === "0") {
                pct = pct.slice(0, -2);
            }
            pct += "%";
            if (totalRows === 0) {
                pct = CommonTxtTstr.NA;
            }
            numRows = xcHelper.numToStr(numRows);
            html += '<li>' +
                        '<div>' +
                            infos[i].index +
                        '</div>' +
                        '<div>' +
                            numRows + " (" + pct + ")" +
                        '</div>' +
                    '</li>';
        }

        html += "</ul>";
        $schema.find(".nodeInfoContent").html(html);

        if ((largest - (100 / numMetas)) > (0.25 * 100 / numMetas)) {
            var $li = $schema.find(".nodeInfoContent li").eq(largestIndex);
            if ((largest - (100 / numMetas)) > (0.5 * 100 / numMetas)) {
                $li.addClass("heavy");
                xcTooltip.add($li.find("div").eq(0), {title: DFTStr.HeavySkew});
                xcTooltip.add($li.find("div").eq(1), {title: DFTStr.HeavySkew});
                $li.find("div").attr("data-tipClasses", "zIndex10000");
                $schema.addClass("heavySkew");
            } else {
                $li.addClass("slight");
                xcTooltip.add($li.find("div").eq(0), {title: DFTStr.SlightSkew});
                xcTooltip.add($li.find("div").eq(1), {title: DFTStr.SlightSkew});
                $li.find("div").attr("data-tipClasses", "zIndex10000");
                $schema.addClass("slightSkew");
            }
        }
    }

    function getSchemaNumRows($schema, schemaId, tableName, table) {
        var deferred = jQuery.Deferred();
        XcalarGetTableMeta(tableName)
        .then(function(meta) {
            if ($schema.data("id") !== schemaId) {
                return;
            }

            if (meta != null && meta.metas != null) {
                var metas = meta.metas;
                var numRows = 0;
                // sum up size from all nodes
                for (var i = 0, len = metas.length; i < len; i++) {
                    numRows += metas[i].numRows;
                }
                if (table) {
                    table.resultSetCount = numRows;
                }
                numRows = xcHelper.numToStr(numRows);
                $schema.find('.rowCount .value').text(numRows);
            }

        })
        .fail(function() {
            $schema.find('.rowCount .value').text(CommonTxtTstr.Unknown);
        })
        .always(deferred.resolve);
        return deferred.promise();
    }

    function positionSchemaPopup($dagTable) {
        var $schema = $('#dagSchema');
        var topMargin = 3;
        var top = $dagTable[0].getBoundingClientRect().top + topMargin;
        var left = $dagTable[0].getBoundingClientRect().left - 30;
        var defaultWidth = 300;
        var defaultHeight = 266;
        if ($schema.hasClass("loadInfo")) {
            defaultWidth = 500;
            defaultHeight = 530;
        }

        $schema.css("width", "auto");
        var width = Math.min(defaultWidth, $schema.outerWidth());
        width = Math.max(230, width);
        $schema.width(width);

        $schema.css("height", "auto");
        var height = Math.min(defaultHeight, $schema.outerHeight());
        height = Math.max(200, height);
        $schema.height(height);

        left = Math.max(2, left);
        top = Math.max(2, top - height); // at least 2px from the top

        $schema.css({'top': top, 'left': left});

        var rightBoundary = $(window).width() - 5;

        if ($schema[0].getBoundingClientRect().right > rightBoundary) {
            left = rightBoundary - $schema.width();
            $schema.css('left', left);
        }

        // ensure dropdown menu is above the bottom of the dag panel
        var dagPanelBottom = $('#workspacePanel')[0].getBoundingClientRect()
                                                    .bottom;
        var menuBottom = $schema[0].getBoundingClientRect().bottom;
        if (menuBottom > dagPanelBottom) {
            $schema.css('top', '-=' + ($schema.height() + 35));
        }
    }

    function hideSchema() {
        $('#dagSchema').removeClass("active");
        $(document).off('.hideDagSchema');
    }

    function applyLockIfNeeded($dagWrap) {
        var $table;
        var tId;
        var table;
        var isLocked;
        var noDelete;
        var needsIcon;
        var lockHTML = '<div class="lockIcon"></div>';
        $dagWrap.find(".dagTable").each(function() {
            $table = $(this);
            tId = $table.data('id');
            table = gTables[tId];
            if (!table) {
                return;
            }

            isLocked = table.hasLock();
            noDelete = table.isNoDelete();
            needsIcon = isLocked || noDelete;
            if (needsIcon) {
                $table.append(lockHTML);
                if (isLocked) {
                    $table.addClass("locked");
                }
                if (noDelete) {
                    $table.addClass("noDelete");
                }
            }
        });
    }

    function expandGroup(groupInfo, $dagWrap, $expandIcon) {
        var allDagInfo = $dagWrap.data('allDagInfo');
        var tree = allDagInfo.tree;
        var group = groupInfo.group;
        var $dagImage = $dagWrap.find('.dagImage');
        var dagImageWidth = $dagImage.outerWidth();
        var prevScrollLeft = $dagImage.parent().scrollLeft();
        var numGroupNodes = group.length;
        var numHiddenTags = 0;
        for (var i = 0; i < numGroupNodes; i++) {
            if (group[i].value.display.isHiddenTag) {
                numHiddenTags++;
            }
        }
        var allAncestors = getAllAncestors(group[numGroupNodes - 1]);
        var storedInfo = {
            width: dagImageWidth,
            groupLen: numGroupNodes,
            numHiddenTags: numHiddenTags,
            groupParent: group[0].parents[0],
            seen: {},
            groupShift: numGroupNodes - numHiddenTags - Dag.condenseOffset,
            allAncestors: allAncestors
        };
        var horzShift = -(Dag.tableWidth * Dag.condenseOffset);
        var $collapsedTables = $();
        for (var i = 0; i < numGroupNodes; i++) {
            $collapsedTables = $collapsedTables.add(
                        $dagImage.find('.dagTable[data-index=' +
                                        group[i].value.dagNodeId + ']')
                        .parent());
        }

        groupInfo.collapsed = false;
        var groupCopy = [];
        for (var i = 0; i < group.length; i++) {
            groupCopy.push(group[i]);
        }

        expandGroupHelper(groupCopy, group[numGroupNodes - 1], $dagWrap,
                          horzShift, storedInfo);

        var newWidth = storedInfo.width;

        $dagImage.outerWidth(newWidth);
        $dagImage.parent().scrollLeft(prevScrollLeft);

        var collapse = false;
        var all = false;
        DagDraw.updateCanvasAfterWidthChange($dagWrap, tree, newWidth, collapse,
                                            all);

        var discoverTimeout;
        var glowTimeout = setTimeout(function() {
            $collapsedTables.removeClass('glowing');
            discoverTimeout = setTimeout(function() {
                $collapsedTables.removeClass('discovered');
            }, 4000);
            $expandIcon.data('discoverTimeout', discoverTimeout);
        }, 2000);

        clearTimeout($expandIcon.data('glowTimeout'));
        clearTimeout($expandIcon.data('discoverTimeout'));
        $expandIcon.data('glowTimeout', glowTimeout);

        var expandIconRight = parseFloat($expandIcon.css('right'));
        var newRight = expandIconRight + ((group.length - numHiddenTags) *
                                            Dag.tableWidth) - 24;
        $expandIcon.css('right', newRight);
    }

    // starting from the rightmost table in a hidden group, we increase the
    // x-coor for each table going from child to parent
    function expandGroupHelper(group, node, $dagWrap, horzShift, storedInfo) {
        if (storedInfo.seen[node.value.dagNodeId]) {
            return;
        }
        storedInfo.seen[node.value.dagNodeId] = true;
        var groupIndex = group.indexOf(node);
        var nodeX = node.value.display.x;
        var $dagTable = $dagWrap.find('.dagTable[data-index=' +
                                        node.value.dagNodeId + ']');
        if (groupIndex > -1) {
            $dagTable.parent().removeClass('hidden').addClass('discovered glowing');
            node.value.display.isHidden = false;

            if (!node.value.display.isHiddenTag) {
                nodeX += horzShift;
                horzShift += Dag.tableWidth;
                // adjust all execept right-most node
                if (!node.value.display.hiddenLeader) {
                    node.value.display.depth += (storedInfo.groupLen -
                                                group.length -
                                                Dag.condenseOffset);
                }
            }

            group.splice(groupIndex, 1);
        } else {
            nodeX += horzShift;
            if (node.value.display.isParentHidden) {
                var $expandIcon = $dagWrap.find('.expandWrap[data-index=' +
                                                node.value.dagNodeId + ']');
                var expandIconRight = parseFloat($expandIcon.css('right'));
                $expandIcon.css('right', (expandIconRight + horzShift));
                $expandIcon.data('depth', $expandIcon.data('depth') +
                                          storedInfo.groupShift);
                var $groupOutline = $expandIcon.next();
                var groupRight = parseFloat($groupOutline.css('right'));
                $groupOutline.css('right', (groupRight + horzShift));
            }
            node.value.display.depth += storedInfo.groupShift;
        }
        node.value.display.x = nodeX;
        $dagTable.parent().css('right', nodeX);
        storedInfo.width = Math.max(storedInfo.width, nodeX + dataStoreWidth);

        var numParents = node.parents.length;
        for (var i = 0; i < numParents; i++) {
            var parentNode = node.parents[i];

            // check if there's enough space for branch section to expand without
            // having to move parent table
            if (!group.length && parentNode.children.length > 1 &&
                !storedInfo.multiParentFound) {

                storedInfo.multiParentFound = true;
                var children = parentNode.children;
                var parallelBranchIsAncestor = false;
                for (var j = 0; j < children.length; j++) {
                    if (children[j] !== node &&
                        storedInfo.allAncestors[children[j].value.dagNodeId]) {
                        parallelBranchIsAncestor = true;
                        break;
                    }
                }
                if (!parallelBranchIsAncestor) {
                    var diff = node.value.display.depth + 1 -
                                parentNode.value.display.depth;

                    if (diff < 0) {
                        return;
                    } else {
                        storedInfo.groupShift = diff;
                        horzShift = diff * Dag.tableWidth;
                    }
                }
            }

            expandGroupHelper(group, parentNode, $dagWrap,
                               horzShift, storedInfo);
        }
    }

    function collapseGroup(groupInfo, $dagWrap, $expandIcon) {
        groupInfo.collapsed = true;
        var allDagInfo = $dagWrap.data('allDagInfo');
        var tree = allDagInfo.tree;
        var group = groupInfo.group;
        var $dagImage = $dagWrap.find('.dagImage');
        var prevScrollLeft = $dagImage.parent().scrollLeft();
        var numGroupNodes = group.length;
        var numHiddenTags = 0;
        for (var i = 0; i < numGroupNodes; i++) {
            if (group[i].value.display.isHiddenTag) {
                numHiddenTags++;
            }
        }
        var allAncestors = getAllAncestors(group[numGroupNodes - 1]);

        var storedInfo = {
            "width": 0,
            "groupLen": numGroupNodes,
            numHiddenTags: numHiddenTags,
            seen: {},
            groupParent: group[0].parents[0],
            groupShift: numGroupNodes - numHiddenTags - Dag.condenseOffset,
            allAncestors: allAncestors
        };

        var horzShift = (Dag.tableWidth * Dag.condenseOffset);
        var groupCopy = [];
        for (var i = 0; i < group.length; i++) {
            groupCopy.push(group[i]);
        }

        collapseGroupHelper(groupCopy, group[numGroupNodes - 1], $dagWrap,
                          horzShift, storedInfo);

        var newWidth = 0;
        $dagWrap.find('.dagTable.dataStore').each(function() {
            var right = parseFloat($(this).parent().css('right'));
            newWidth = Math.max(newWidth, right + dataStoreWidth);
        });

        $dagImage.outerWidth(newWidth);
        $dagImage.parent().scrollLeft(prevScrollLeft);
        var collapse = true;
        var all = false;
        DagDraw.updateCanvasAfterWidthChange($dagWrap, tree, newWidth, collapse,
                                             all);

        var expandIconRight = parseFloat($expandIcon.css('right'));
        var newRight = expandIconRight -
                           ((group.length - numHiddenTags) * Dag.tableWidth) +
                           Math.round(0.11 * Dag.tableWidth);
                $expandIcon.css('right', newRight);
    }

    function collapseGroupHelper(group, node, $dagWrap, horzShift, storedInfo) {
        if (storedInfo.seen[node.value.dagNodeId]) {
            return;
        }
        storedInfo.seen[node.value.dagNodeId] = true;
        var groupIndex = group.indexOf(node);
        var nodeX = node.value.display.x;
        var $dagTable = $dagWrap.find('.dagTable[data-index=' +
                                        node.value.dagNodeId + ']');
        // node is part of the collapsing group
        if (groupIndex > -1) {
            $dagTable.parent().addClass('hidden');
            node.value.display.isHidden = true;
            if (!node.value.display.isHiddenTag) {
                horzShift -= Dag.tableWidth;
                nodeX += (horzShift + Dag.tableWidth);

                if (!node.value.display.hiddenLeader) {
                    node.value.display.depth -= (storedInfo.groupLen -
                                                group.length -
                                                Dag.condenseOffset);
                }
            }

            group.splice(groupIndex, 1);

        } else {
            if (node.value.display.isParentHidden) {
                var $expandIcon = $dagWrap.find('.expandWrap[data-index=' +
                                                 node.value.dagNodeId + ']');
                var expandIconRight = parseFloat($expandIcon.css('right'));
                $expandIcon.css('right', (expandIconRight + horzShift));
                $expandIcon.data('depth', $expandIcon.data('depth') -
                                          (storedInfo.groupShift));
                var $groupOutline = $dagWrap.find('.groupOutline[data-index=' +
                                                    node.value.dagNodeId + ']');
                var groupRight = parseFloat($groupOutline.css('right'));
                $groupOutline.css('right', (groupRight + horzShift));

            }
            nodeX += horzShift;
            node.value.display.depth -= storedInfo.groupShift;
        }

        node.value.display.x = nodeX;
        $dagTable.parent().css('right', nodeX);

        var numParents = node.parents.length;
        for (var i = 0; i < numParents; i++) {
            var parentNode = node.parents[i];

            // prevent parent table from moving in if there's a parallel
            // branch that is not condensing
            if (!group.length && parentNode.children.length > 1) {
                for (var j = 0; j < parentNode.children.length; j++) {
                    var child = parentNode.children[j];
                    if (!storedInfo.allAncestors[child.value.dagNodeId]) {
                        var diff = parentNode.value.display.depth -
                                    storedInfo.groupShift -
                                   child.value.display.depth;
                        if (diff < 1) {
                            storedInfo.groupShift -= (1 - diff);
                            horzShift += ((1 - diff) * Dag.tableWidth);
                        }
                    }
                }
            }
            collapseGroupHelper(group, parentNode, $dagWrap,
                               horzShift, storedInfo);
        }
    }

    function expandShiftTables(node, $dagImage) {
        node.value.display.isHidden = false;
        if (node.value.display.x !==
            node.value.display.expandedDepth * Dag.tableWidth) {
            node.value.display.depth = node.value.display.expandedDepth;
            node.value.display.x = node.value.display.expandedDepth *
                                   Dag.tableWidth;
            $dagImage.find('.dagTable[data-index="' + node.value.dagNodeId + '"]')
                     .parent()
                     .css('right', node.value.display.x).removeClass('hidden');

        }
        for (var i = 0; i < node.parents.length; i++) {
            expandShiftTables(node.parents[i], $dagImage);
        }
    }

    function collapseShiftTables(node, $dagImage) {
        var newX;
        if (node.value.display.hiddenLeader) {
            newX = (node.value.display.condensedDepth + Dag.condenseOffset) * Dag.tableWidth;
        } else {
            newX = node.value.display.condensedDepth * Dag.tableWidth;
        }

        if (node.value.display.x !== newX) {
            node.value.display.x = newX;
            node.value.display.depth = node.value.display.condensedDepth;
            $dagTableWrap = $dagImage.find('.dagTable[data-index="' +
                                        node.value.dagNodeId + '"]').parent();
            $dagTableWrap.css('right', node.value.display.x);
        }
        for (var i = 0; i < node.parents.length; i++) {
            collapseShiftTables(node.parents[i], $dagImage);
        }
    }

    function checkIfDagWrapVisible($dagWrap) {
        $dagPanel = $('#dagPanel');
        if (!$dagWrap.is(':visible')) {
            return (false);
        }
        if ($dagPanel.hasClass('hidden')) {
            return (false);
        }
        var $dagArea = $dagPanel.find('.dagArea');
        var dagHeight = $dagWrap.height();
        var dagAreaHeight = $dagArea.height();
        var dagTop = $dagWrap.position().top;

        if (dagTop + 30 > dagAreaHeight || dagTop + dagHeight < 50) {
            return (false);
        }
        return (true);
    }

    function checkCanExpand(group, depth, id, $dagWrap) {
        var allDagInfo = $dagWrap.data('allDagInfo');
        var nodes = allDagInfo.tree;
        var currentCanvasWidth = $dagWrap.find('canvas').width();
        var currentCanvasHeight = $dagWrap.find('canvas').height();
        var savedInfo = {depth: depth};
        var node = allDagInfo.nodeIdMap[id];
        checkExpandHelper(node, id, nodes, savedInfo);
        var expectedWidth = (group.length + savedInfo.depth) * Dag.tableWidth +
                            100;
        expectedWidth = Math.max(currentCanvasWidth, expectedWidth);
        if (expectedWidth > Dag.canvasLimit ||
            (expectedWidth * currentCanvasHeight) > Dag.canvasAreaLimit) {
            return (false);
        } else {
            return (true);
        }
    }

    function checkExpandHelper(node, savedInfo) {
        if (node.parents.length === 0) {
            savedInfo.depth = Math.max(node.value.display.depth,
                                       savedInfo.depth);
        } else {
            for (var i = 0; i < node.parents.length; i++) {
                checkExpandHelper(node.parents[i], savedInfo);
            }
        }
    }

    function preventUnintendedScrolling() {
        var winHeight;
        var vertScrolling = false;
        var vertScrollingTimeout;
        $('.dagArea').scroll(function() {
            if (!vertScrolling) {
                if ($('#dagSchema').is(':visible') && scrollPosition > -1) {
                    $(this).scrollTop(scrollPosition);
                    return;
                }
                if ($('.menu').is(':visible')) {
                    $('.menu').hide();
                    xcMenu.removeKeyboardNavigation();
                }
                vertScrolling = true;
                winHeight = $(window).height();
            }
            clearInterval(vertScrollingTimeout);
            vertScrollingTimeout = setTimeout(function() {
                vertScrolling = false;
            }, 300);

            DagPanel.setScrollBarId(winHeight);
            DagPanel.adjustScrollBarPositionAndSize();
        });
    }

    function dagScrollListeners($dagImageWrap) {
        var winHeight;
        var horzScrolling = false;
        var horzScrollingTimeout;

        $dagImageWrap.scroll(function() {
            if (gMouseEvents.getLastMouseDownTarget().attr('id') ===
                "dagScrollBarWrap") {
                return;
            }
            if (!horzScrolling) {
                horzScrolling = true;
                winHeight = $(window).height();
                DagPanel.setScrollBarId(winHeight);
                if ($('.menu').is(':visible')) {
                    $('.menu').hide();
                    xcMenu.removeKeyboardNavigation();
                }
            }
            clearInterval(horzScrollingTimeout);
            horzScrollingTimeout = setTimeout(function() {
                horzScrolling = false;
            }, 300);

            DagPanel.adjustScrollBarPositionAndSize();
        });

        var wheeling = false;
        var wheelTimeout;
        $dagImageWrap.on('mousewheel', function() {
            if (!wheeling) {
                wheeling = true;
                gMouseEvents.setMouseDownTarget($(this));
            }
            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(function() {
                wheeling = false;
            }, 100);
        });
    }

    function getSourceColNames(func) {
        var names = [];

        getNames(func.args);

        function getNames(args) {
            for (var i = 0; i < args.length; i++) {
                if (typeof args[i] === "string") {
                    if (args[i][0] !== "\"" &&
                        args[i][args.length - 1] !== "\"" &&
                        names.indexOf(args[i]) === -1) {
                        names.push(args[i]);
                    }
                } else if (typeof args[i] === "object") {
                    getNames(args[i].args);
                }
            }
        }

        return (names);
    }

    function getRenamedColName(colName, node) {
        if (node.value.struct.renameMap && node.value.struct.renameMap.length) {
            var renameMap = node.value.struct.renameMap;
            var parsedName = xcHelper.parsePrefixColName(colName);

            for (var i = 0; i < renameMap.length; i++) {
                if (renameMap[i].type === DfFieldTypeT.DfFatptr) {
                    if (parsedName.prefix &&
                        renameMap[i].newName === parsedName.prefix) {
                        return xcHelper.getPrefixColName(renameMap[i].oldName,
                                                         parsedName.name);
                    }
                } else if (renameMap[i].newName === colName) {
                    return renameMap[i].oldName;
                }
            }
        }
        return colName;
    }

    function closeDagHighlight(event) {
        var $target = $(event.target);
        if ($target.hasClass('dagImageWrap')) {
            var bottom = $target[0].getBoundingClientRect().bottom;
            if (event.pageY > (bottom - 20)) {
                // click is occuring on the scrollbar
                return;
            }
        } else if ($target.closest('#dagSchema').length) {
            return;
        } else if ($target.closest('#dagScrollBarWrap').length) {
            return;
        }

        $('.columnOriginInfo').remove();
        $dagPanel.find('.highlighted').removeClass('highlighted');
        $(document).off('mousedown', closeDagHighlight);
    }

    // sourceColNames is an array of the names we're searching for lineage
    // origNode is the last descendent node known to contain the col
    function findColumnSource(sourceColNames, $dagWrap, node,
                              curColName, isEmptyCol, prevFound, origNode,
                              storedInfo) {
        var parentNodes = getSourceTables(curColName, node);
        curColName = getRenamedColName(curColName, node);
        var parentNode;
        var parentName;
        var tableName;
        var isEmpty;
        var found = false;
        // look through the parent tables
        for (var i = 0; i < parentNodes.length; i++) {
            parentNode = parentNodes[i];
            parentName = parentNode.value.name;
            var table;

            // ignore endpoings
            if (parentNode.value.numParents > 0) {
                table = gTables[xcHelper.getTableId(parentName)];
            }

            if (table) {
                var cols = table.tableCols;
                var foundSameColName = false; // if found column with same
                // backName as curColName
                var colCreatedHere = false; // if this is the first place
                // where descendent column has no value

                // make a copy so we have original for every table iteration
                var sourceColNamesCopy = xcHelper.deepCopy(sourceColNames);
                for (var j = 0; j < cols.length; j++) {
                    // skip DATA COL
                    if (cols[j].isDATACol()) {
                        continue;
                    }
                    var srcNames;
                    var backColName = cols[j].getBackColName() ||
                                      cols[j].getFrontColName();
                    //XX backColName could be blank

                    // check if table has column of the same name
                    if (!foundSameColName && backColName === curColName) {
                        foundSameColName = true;
                        srcNames = getSourceColNames(cols[j].func);
                        found = true;
                        storedInfo.foundTables[parentNode.value.dagNodeId] = true;
                        isEmpty = cols[j].isEmptyCol();
                        findColumnSource(srcNames, $dagWrap, parentNode,
                                            backColName,
                                            isEmpty, found, origNode, storedInfo);

                        colCreatedHere = cols[j].isEmptyCol() && !isEmptyCol;
                        if (colCreatedHere) {
                            // this table is where the column became non-empty,
                             // continue and look through sourceColNames for
                             // the origin column
                        } else {
                            break;
                        }
                    } else {
                        // table doesn't have column of that name but check if
                        // table has column that matches target column's
                        // derivatives
                        var colNameIndex = sourceColNamesCopy
                                                        .indexOf(backColName);
                        if (colNameIndex > -1) {
                            srcNames = getSourceColNames(cols[j].func);

                            sourceColNamesCopy.splice(colNameIndex, 1);
                            isEmpty = cols[j].isEmptyCol();
                            found = true;
                            storedInfo.foundTables[parentNode.value.dagNodeId] = true;
                            findColumnSource(srcNames, $dagWrap, parentNode,
                                            backColName,
                                            isEmpty, found, origNode, storedInfo);

                        }
                    }

                    if (sourceColNamesCopy.length === 0 && colCreatedHere) {
                        break;
                    }
                }
            } else if (parentNode.value.numParents) {
                // gTable doesn't exist so we move on to its parent
                var $dagTable = $dagWrap.find('.dagTable[data-index="' +
                                            parentNode.value.dagNodeId + '"]');
                if ($dagTable.hasClass('Dropped')) {
                    var newOrigNode = origNode;
                    if (prevFound) {
                        newOrigNode = node;
                    }
                    storedInfo.droppedTables[parentNode.value.dagNodeId] = true;
                    findColumnSource(sourceColNames, $dagWrap, parentNode,
                                     curColName, false, false, newOrigNode,
                                     storedInfo);
                } else {
                    // table has no data, could be orphaned
                }
            } else if (!isEmptyCol && prevFound) {
                // has no parents, must be a dataset
                storedInfo.foundTables[parentNode.value.dagNodeId] = true;
                highlightAncestors($dagWrap, parentNode, origNode,
                            storedInfo.foundTables, storedInfo.droppedTables);
                found = true;
            }
        }
        if (!found && prevFound) {
            highlightAncestors($dagWrap, node, origNode,
                            storedInfo.foundTables, storedInfo.droppedTables);
        }
    }

    function getSourceTables(colName, node) {
        // only joins should have renameMap, will have 2 parents
        if (node.value.struct.renameMap && node.value.struct.renameMap.length) {
            var renameMap = node.value.struct.renameMap;
            var parents = node.parents;
            if (node.parents[0].value.name === node.parents[1].value.name) {
                return parents;
            }
            var parsedName = xcHelper.parsePrefixColName(colName);
            for (var i = 0; i < renameMap.length; i++) {
                if (renameMap[i].type === DfFieldTypeT.DfFatptr) {
                    if (parsedName.prefix) {
                        if (renameMap[i].newName === parsedName.prefix) {
                            if (i >= node.value.struct.numLeftColumns) {
                                return [parents[1]];
                            } else {
                                return [parents[0]];
                            }
                        } else if (renameMap[i].oldName === parsedName.prefix) {
                            if (i >= node.value.struct.numLeftColumns) {
                                return [parents[0]];
                            } else {
                                return [parents[1]];
                            }
                        }
                    }
                } else if (renameMap[i].newName === colName) {
                    if (i >= node.value.struct.numLeftColumns) {
                        return [node.parents[1]];
                    } else {
                        return [node.parents[0]];
                    }
                } else if (renameMap[i].oldName === colName) {
                    if (i >= node.value.struct.numLeftColumns) {
                        return [node.parents[0]];
                    } else {
                        return [node.parents[1]];
                    }
                }
            }
        }
        return node.parents;
    }

    // returns a map of ids
    function getAllAncestors(node) {
        var allAncestors = {};
        search(node);

        function search(node) {
            for (var i = 0; i < node.parents.length; i++) {
                search(node.parents[i]);
                allAncestors[node.parents[i].value.dagNodeId] = true;
            }
        }
        return allAncestors;
    }

    function highlightColumnSource($dagWrap, node) {
        var $dagTable = $dagWrap.find('.dagTable[data-index="' +
                                        node.value.dagNodeId + '"]');
        $dagTable.addClass("highlighted");

        // XX showing column name on each table is disabled

        // var id = $dagTable.data('id');

        // var rect = $dagTable[0].getBoundingClientRect();
        // if ($dagWrap.find('.columnOriginInfo[data-id="' + id + '"]')
        //             .length === 0) {
        //     var top = rect.top - 15;
        //     var left = rect.left;
        //     top -= $('#dagPanel').offset().top;
        //     $dagWrap.append('<div class="columnOriginInfo " data-id="' + id +
        //         '" style="top: ' + top + 'px;left: ' + left + 'px">' +
        //         name + '</div>');
        // }
    }

    function highlightAncestors($dagWrap, node, origNode, allAncestors,
                                droppedTables) {
        if (node === origNode) {
            return;
        }

        highlightSources(node);

        function highlightSources(node) {
            if (!allAncestors[node.value.dagNodeId] &&
                !droppedTables[node.value.dagNodeId]) {
                return;
            }
            highlightColumnSource($dagWrap, node);
            for (var i = 0; i < node.children.length; i++) {
                highlightSources(node.children[i]);
            }
        }
    }

    if (window.unitTestMode) {
        Dag.__testOnly__ = {};
        Dag.__testOnly__.getSchemaNumRows = getSchemaNumRows;
        Dag.__testOnly__.findColumnSource = findColumnSource;
        Dag.__testOnly__.getSourceTables = getSourceTables;
        Dag.__testOnly__.getRenamedColName = getRenamedColName;
    }

    return (Dag);

}(jQuery, {}));
