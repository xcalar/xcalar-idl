window.DagFunction = (function($, DagFunction) {
    var dagLineage = {};
    var TreeNode = function(value) {
        this.value = value;
        this.parents = [];
        this.children = [];
        return (this);
    };

    TreeNode.prototype = {
        getVisibleParents: function() {
            var parents = [];
            search(this);

            function search(node) {
                for (var i = 0; i < node.parents.length; i++) {
                    var parentNode = node.parents[i];
                    if (parentNode.value.display.isHiddenTag ||
                        parentNode.value.display.isHidden) {
                        search(parentNode);
                    } else { // may produce duplicate parents on purpose
                        parents.push(parentNode);
                    }
                }
            }
            return parents;
        },

        getVisibleChildren: function() {
            var children = [];
            search(this);

            function search(node) {
                for (var i = 0; i < node.children.length; i++) {
                    var childNode = node.children[i];
                    if (childNode.value.display.isHiddenTag ||
                        childNode.value.display.isHidden) {
                        search(childNode);
                    } else { // may produce duplicate children on purpose
                        children.push(childNode);
                    }
                }
            }
            return children;
        },

        getSourceNames: function(excludeTags) {
            var parentNames = [];
            var node = this;

            if (excludeTags && node.value.display.hasTagGroup) {
                var parents = node.getVisibleParents();
                for (var i = 0; i < parents.length; i++) {
                    parentNames.push(parents[i].value.name);
                }
            } else {
                for (var i = 0; i < node.parents.length; i++) {
                    var parent = node.parents[i];
                    parentNames.push(parent.value.name);
                }
            }

            return parentNames;
        },

        getTagSourceNames: function() {
            var parentNames = [];
            var node = this;

            if (node.value.display.hasTagGroup) {
                var parents = [];
                search(node);

                function search(node) {
                    for (var i = 0; i < node.parents.length; i++) {
                        var parentNode = node.parents[i];
                        if (parentNode.value.display.isInTagGroup ||
                            parentNode.value.display.isHidden) {
                            search(parentNode);
                        } else { // may produce duplicate parents on purpose
                            parents.push(parentNode);
                        }
                    }
                }
                for (var i = 0; i < parents.length; i++) {
                    parentNames.push(parents[i].value.name);
                }
            } else {
                for (var i = 0; i < node.parents.length; i++) {
                    var parent = node.parents[i];
                    parentNames.push(parent.value.name);
                }
            }

            return parentNames;
        },

        getNonIndexSourceNames: function() {
            var parentNames = [];
            var node = this;

            search(node);

            function search(node) {
                for (var i = 0; i < node.parents.length; i++) {
                    if (node.parents[i].value.api !== XcalarApisT.XcalarApiIndex ||
                        node.parents[i].value.struct.source.indexOf(gDSPrefix) ===
                        0) {
                        parentNames.push(node.parents[i].value.name);
                    } else {
                        search(node.parents[i]);
                    }
                }
            }

            return parentNames;
        },

        getAllAncestorNodes: function() {
            var node = this;
            var ancestors = [];
            var seen = {};

            search(node);
            function search(node) {
                for (var i = 0; i < node.parents.length; i++) {
                    if (seen[node.parents[i].value.name]) {
                        continue;
                    }
                    seen[node.parents[i].value.name] = true;
                    ancestors.push(node.parents[i]);
                    search(node.parents[i]);
                }
            }

            return ancestors;
        },

        getAllDescendantNodes: function() {
            var node = this;
            var descendants = [];
            var seen = {};

            search(node);
            function search(node) {
                for (var i = 0; i < node.children.length; i++) {
                    if (seen[node.children[i].value.name]) {
                        continue;
                    }
                    seen[node.children[i].value.name] = true;
                    descendants.push(node.children[i]);
                    search(node.children[i]);
                }
            }

            return descendants;
        }
    };

    var TreeValue = function(info) {
        this.api = info.api;
        this.struct = info.struct;
        this.dagNodeId = info.dagNodeId;
        this.inputName = info.inputName;
        this.name = info.name;
        this.numParents = info.numParents;
        this.parentIds = info.parents;
        this.parentNames = info.parentNames || null;
        this.numChildren = info.numChildren || 0;
        this.childIds = info.children || [];
        this.indexedFields = [];
        this.tag = info.tag || "";
        this.tags = [];
        this.comment = info.comment || "";
        this.state = info.state || DgDagStateT.DgDagStateReady;
        this.display = {};
        this.exportNode = null; // reference to export node if it has one
        return (this);
    };


    DagFunction.setup = function() {
        dagLineage = {};
    };

    DagFunction.construct = function(nodes, tableId) {
        var valArray = [];
        var startPoints = [];
        for (var i = 0; i < nodes.length; i++) {
            var apiString = XcalarApisTStr[nodes[i].api];
            var inputName = DagFunction.getInputType(apiString);
            var inputStruct = nodes[i].input[inputName];
            var dagNodeId = nodes[i].dagNodeId;
            var name = nodes[i].name.name;
            var numParents = nodes[i].numParents;
            if (nodes[i].api === XcalarApisT.XcalarApiExecuteRetina &&
                i === nodes.length - 1) {
                numParents = 0; // last execute retina should not have a parent
                // even though the node may say numParent = 1
            }
            if (nodes[i].api === XcalarApisT.XcalarApiSynthesize) {
                // sometimes the synthesize node will point to itself for it's
                // source
                if (nodes[i + 1]) {
                    inputStruct.source = nodes[i + 1].name.name;
                }
            }
            var tag = nodes[i].tag;
            var comment = parseUserComment(nodes[i].comment);
            var state = nodes[i].state;
            var values = {
                api: nodes[i].api,
                struct: inputStruct,
                dagNodeId: dagNodeId,
                inputName: inputName,
                name: name,
                numParents: numParents,
                parents: nodes[i].parents,
                numChildren: nodes[i].numChildren,
                children: nodes[i].children,
                tag: tag,
                comment: comment,
                state: state
            };
            var treeNode = new TreeValue(values);
            valArray.push(treeNode);
            if (nodes[i].api === XcalarApisT.XcalarApiExport && i !== 0) {
                startPoints.push(treeNode);
            }

        }
        var allEndPoints = [];
        var lineageStruct = {};
        var trees = [];
        var alreadySeen = {};
        var tree = constructTree(valArray[0], valArray, alreadySeen, null,
                                 allEndPoints);

        if (!tree) {
            console.info("No creatable tree");
            return;
        }
        trees.push(tree);

        for (var i = 0; i < startPoints.length; i++) {
            tree = constructTree(startPoints[i], valArray, alreadySeen, null,
                                 allEndPoints);
            trees.push(tree);
        }

        var nodeIdMap = getIdMap(trees);

        // move main treeNode to the front
        var mainTreeIndex = getIndexOfFullTree(trees);

        tree = trees[mainTreeIndex];
        trees.splice(mainTreeIndex, 1);
        trees.splice(0, 0, tree);
        var sets = getSets(trees);

        setIndexedFields(sets);

        lineageStruct.tree = tree;
        lineageStruct.trees = trees;
        lineageStruct.sets = sets;
        lineageStruct.endPoints = allEndPoints;
        lineageStruct.orderedPrintArray = getOrderedDedupedNodes(allEndPoints,
                                          "TreeNode");
        lineageStruct.nodeIdMap = nodeIdMap;
        if (tableId != null) {
            dagLineage[tableId] = lineageStruct;
        }
        return lineageStruct;
    };

    DagFunction.getAggsFromEvalStrs = function(evalStrs) {
        var allTables = [];
        // var tablesMap = {};
        if (!evalStrs) {
            return allTables;
        }
        for (var i = 0; i < evalStrs.length; i++) {
            var evalStr = evalStrs[i].evalString;
            var tables = [];
            try {
                var func = ColManager.parseFuncString(evalStr);
                tables = xcHelper.getNamesFromFunc(func, true);
            } catch (err) {
                console.error("could not parse eval str", evalStr);
            }
            for (var j = 0; j < tables.length; j++) {
                if (allTables.indexOf(tables[j]) === -1) {
                    allTables.push(tables[j]);
                }
            }
        }
        return allTables;
    };

    // only being used for group by, join, union
    function setIndexedFields(sets) {
        var seen = {};
        for (var i = 0; i < sets.length; i++) {
            var tree = sets[i];
            search(tree);
        }

        function search(node) {
            if (seen[node.value.name]) {
                return;
            }
            seen[node.value.name] = true;
            if (node.value.api === XcalarApisT.XcalarApiGroupBy) {
                node.value.indexedFields = getIndexedFields(node);
            } else if (node.value.api === XcalarApisT.XcalarApiJoin) {
                node.value.indexedFields = getJoinIndexedFields(node);
            }
            for (var i = 0; i < node.parents.length; i++) {
                search(node.parents[i]);
            }
        }
    }

    function getIndexedFields(node) {
        var cols = [];
        search(node);
        function search(node) {
            // if parent node is join, it's indexed by left parent, ignore right
            var numParents = Math.min(node.parents.length, 1);
            for (var i = 0; i < numParents; i++) {
                var parentNode = node.parents[i];
                if (parentNode.value.api === XcalarApisT.XcalarApiIndex) {
                    cols = parentNode.value.struct.key.map(function(key) {
                        return key.name;
                    });
                    return cols;
                } else {
                    search(parentNode);
                }
            }
        }

        return cols;
    }

    function getJoinIndexedFields(node) {
        var cols = {left: [], right: []};
        search(node.parents[0], true);
        search(node.parents[1]);

        function search(node, isLeft) {
            if (node.value.api === XcalarApisT.XcalarApiIndex) {
                var keys = node.value.struct.key.map(function(key) {
                    return key.name;
                });
                if (isLeft) {
                    cols.left = keys;
                } else {
                    cols.right = keys;
                }
                return;
            }
            // if parent node is join, it's indexed by left parent, ignore right
            var numParents = Math.min(node.parents.length, 1);
            for (var i = 0; i < numParents; i++) {
                search(node.parents[i], isLeft);
            }
        }

        return cols;
    }

    DagFunction.destruct = function(tableId) {
        delete dagLineage[tableId];
    };

    DagFunction.getInputType = function(api) {
        var val = api.substr('XcalarApi'.length);
        var inputVal = "";
        switch (val) {
            case ('BulkLoad'):
                inputVal = 'load';
                break;
            case ('GetStat'):
                inputVal = 'stat';
                break;
            case ('GetStatByGroupId'):
                inputVal = 'statByGroupId';
                break;
            default:
                inputVal = val[0].toLowerCase() + val.substr(1);
                break;
        }
        inputVal += 'Input';
        return (inputVal);
    };

    DagFunction.getAll = function() {
        return (dagLineage);
    };

    DagFunction.get = function(tableId) {
        if (tableId in dagLineage) {
            return (dagLineage[tableId]);
        } else {
            return (null);
        }
    };

    DagFunction.printDagCli = function(tableName) {
        var tableId = xcHelper.getTableId(tableName);
        if (dagLineage[tableId]) {
            var queryStr = getXcalarQueryCli(dagLineage[tableId]
                                            .orderedPrintArray);
            return PromiseHelper.resolve(queryStr);
        } else {
            var deferred = PromiseHelper.deferred();
            XcalarGetDag(tableName)
            .then(function(dagOutput) {
                var tableId = xcHelper.getTableId(tableName);
                var outStruct = DagFunction.construct(dagOutput.node, tableId);
                var queryStr = getXcalarQueryCli(outStruct.orderedPrintArray);
                deferred.resolve(queryStr);
            })
            .fail(function(err) {
                deferred.reject(err);
            });
            return deferred.promise();
        }
    };

    DagFunction.cloneDagNode = function(inputName, origInputStruct) {
        // We are looking for something like XcalarApiBLAHInputT
        var structName = getConstructorName(inputName);
        var newStruct = {};
        try {
            // XXX Once we have a nice clean interface from the backend
            // we can algorithmically generate this rather than use eval
            newStruct = eval("new " + structName);
        } catch (error) {
            console.error(error);
            console.error("Constructor doesn't eval to any known struct! " +
                          structName);
            return;
        }

        function getConstructorName(inputName) {
            var input = inputName.substr(0, inputName.length - 5);
            switch (input) {
                case ("load"):
                    consName = "BulkLoad";
                    break;
                case ("stat"):
                    consName = "GetStat";
                    break;
                case ("statByGroupId"):
                    consName = "GetStatByGroupId";
                    break;
                default:
                    consName = input[0].toUpperCase() + input.substr(1);
            }
            consName = "XcalarApi" + consName + "InputT()";

            return (consName);
        }

        return (jQuery.extend(true, newStruct, origInputStruct));
    };

    // oldTableName is a descendant/parent
    DagFunction.revertTable = function(tableId, newTableName, oldTableName) {
        var tableType = TableType.Orphan;
        var oldTableId = xcHelper.getTableId(oldTableName);
        var wsId = WSManager.getWSFromTable(oldTableId);
        var oldTableNames = [];
        if (oldTableName) {
            oldTableNames.push(oldTableName);
        }
        xcHelper.lockTable(tableId);
        xcHelper.lockTable(oldTableId);
        TblManager.refreshTable([newTableName], null, oldTableNames, wsId,
                                null)
        .then(function() {
            xcHelper.unlockTable(tableId);
            xcHelper.unlockTable(oldTableId);
            var newTableId = xcHelper.getTableId(newTableName);

            var $tableWrap = $('#xcTableWrap-' + newTableId).mousedown();
            Dag.focusDagForActiveTable();
            xcHelper.centerFocusedTable($tableWrap, true);

            Log.add(SQLTStr.RevertTable, {
                "operation": SQLOps.RevertTable,
                "tableName": newTableName,
                "oldTableName": oldTableName,
                "oldTableId": oldTableId,
                "tableId": newTableId,
                "tableType": tableType,
                "worksheet": wsId,
                "worksheetIndex": WSManager.indexOfWS(wsId),
                "htmlExclude": ["tableType", "oldTableName", "worksheet",
                                "worksheetIndex"]
            });
        });
    };

    DagFunction.addTable = function(tableId) {
        var deferred = PromiseHelper.deferred();
        var wsId = WSManager.getActiveWS();
        var tableType = TableType.Orphan;

        WSManager.moveTemporaryTable(tableId, wsId, tableType)
        .then(function() {
            DFCreateView.updateTables(tableId);
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    };

    DagFunction.focusTable = function(tableId) {
        var $dagPanel = $('#dagPanel');
        var wsId = WSManager.getWSFromTable(tableId);
        if (!wsId) {
            console.error('Cannot focus table due to no worksheet!');
            return;
        }

        var $wsListItem = $('#worksheetTab-' + wsId);
        if ($wsListItem.hasClass("hiddenTab")) {
            $wsListItem.find(".unhide").click();
        } else {
            $wsListItem.trigger(fakeEvent.mousedown);
        }

        if ($dagPanel.hasClass('full')) {
            $('#dagPulloutTab').click();
        }
        var $tableWrap = $('#xcTableWrap-' + tableId);
        xcHelper.centerFocusedTable($tableWrap);
        $tableWrap.mousedown();
        TblFunc.moveFirstColumn();
        Dag.focusDagForActiveTable(null, true);
    };


    // will always resolve
    // used after a transaction is complete and before constructing dag
    // finalTableId is optional
    DagFunction.tagNodes = function(txId, finalTableId) {
        var deferred = PromiseHelper.deferred();
        var tables = QueryManager.getAllDstTables(txId, true);

        if (!tables.length) {
            return PromiseHelper.resolve();
        }

        var tagName = QueryManager.getQuery(txId).getName();
        var tId;
        if (finalTableId != null) {
            tId = finalTableId;
        } else {
            tId = xcHelper.getTableId(tables[0]);
        }
        if (tId) {
            tagName += "#" + tId;
        }
        tagName = tagName.replace(/ /g, "");
        retagIndexedTables(txId, tagName)
        .then(function() {
            return XcalarTagDagNodes(tagName, tables);
        })
        .then(function() {
            deferred.resolve({
                tagName: tagName,
                tables: tables
            });
        })
        .fail(deferred.resolve);

        return deferred.promise();
    };

    function parseUserComment(comment) {
        var commentObj;
        try {
            commentObj = JSON.parse(comment);
            if (typeof commentObj !== "object") {
                commentObj = {
                    userComment: commentObj,
                    meta: {}
                };
            }
        } catch (e) {
            commentObj = {
                userComment: comment || "",
                meta: {}
            };
        }
        return commentObj;
    };

    DagFunction.commentDagNodes = function(tableNames, userComment, meta) {
        var commentObj = {
            userComment: userComment || "",
            meta: meta || {}
        };
        return XcalarCommentDagNodes(JSON.stringify(commentObj), tableNames);
    };

    // will always resolve
    // get indexed tables that were used but not logged in a transaction
    // and append tagName
    function retagIndexedTables(txId, tagName) {
        var deferred = PromiseHelper.deferred();
        var indexTables = QueryManager.getIndexTables(txId);
        var promises = [];
        for (var i = 0; i < indexTables.length; i++) {
            promises.push(XcalarGetDag(indexTables[i]));
        }

        PromiseHelper.when.apply(null, promises)
        .then(function() {
            var rets = arguments;
            promises = [];
            for (var i = 0; i < rets.length; i++) {
                var nodes = rets[i];
                if (nodes && nodes.node) {
                    var tag = nodes.node[0].tag;
                    var newTag;
                    if (tag) {
                        newTag = tag + "," + tagName;
                    } else {
                        newTag = tagName;
                    }
                    promises.push(XcalarTagDagNodes(newTag, indexTables[i]));
                }
            }
            PromiseHelper.when.apply(null, promises)
            .always(deferred.resolve);
        })
        .fail(deferred.resolve);

        return deferred.promise();
    }

    function findTreeValueInValArrayById(id, valArray) {
        for (var i = 0; i < valArray.length; i++) {
            if (valArray[i].dagNodeId === id) {
                return (valArray[i]);
            }
        }
    }

    function findTreeValueInValArrayByName(name, valArray) {
        for (var i = 0; i < valArray.length; i++) {
            if (valArray[i].name === name) {
                return (valArray[i]);
            }
        }
    }

    function findTreeNodeInNodeArray(name, nodeArray) {
        for (var i = 0; i < nodeArray.length; i++) {
            if (nodeArray[i].value.name === name) {
                return (nodeArray[i]);
            }
        }
    }

    function getAllNamesFromStart(tree, startTreeNodes) {
        // Recursively go down the tree of all children until we hit the end
        // Returns list of all names that we have seen in this traversal
        // This terminates due to the graph being a DAG
        var mapOfNames = {};
        for (var i = 0; i < startTreeNodes.length; i++) {
            recurHelper(startTreeNodes[i], mapOfNames);
        }

        return mapOfNames;

        function recurHelper(node, mapSoFar) {
            mapSoFar[node.value.name] = true; // We are only using the key
            for (var i = 0; i < node.children.length; i++) {
                recurHelper(node.children[i], mapSoFar);
            }
        }
    }

    // returns a map of the nodes that already existed in the dataflow before
    // new nodes were inserted
    function getNonInvolvedRerunNames(tree, startTreeNodes, newNodes) {
        var seen = {};
        var mapOfNames = {};
        for (var i = 0; i < startTreeNodes.length; i++) {
            search(startTreeNodes[i]);
        }

        return mapOfNames;

        function search(node) {
            if (seen[node.value.name]) {
                return;
            }
            seen[node.value.name] = true;
            for (var i = 0; i < node.parents.length; i++) {
                var name = node.parents[i].value.name;
                var newNodeFound = false;
                // ignore newly created nodes
                for (var n in newNodes) {
                    var nameList = newNodes[n];
                    newNodeFound = nameList.find(function(node) {
                        return node.args.dest === name;
                    });
                    if (newNodeFound) {
                        break;
                    }
                }
                if (!newNodeFound) {
                    mapOfNames[name] = node.parents[i].value;
                }

                search(node.parents[i]);
            }
        }
    }

    // if a startNode has a dropped parent, we need to search all of its parents
    // until we find one that is not dropped and add it to the startNodes list
    // also, if there's a table upstream that has a dropped parent, we must
    // search all of it's parents as well
    function includeDroppedNodesInStartNodes(startNodes) {
        var startNodeMap = {};
        startNodes.forEach(function(node) {
            startNodeMap[node.value.name] = true;
        });
        var seen = {};
        startNodes.forEach(function(node) {
            traverse(node);
        });

        function traverse(node) {
            if (seen[node.value.name]) {
                return;
            }
            seen[node.value.name] = true;
            node.parents.forEach(function(parent) {
                if (parent.value.state !== DgDagStateT.DgDagStateReady) {
                    findNonDroppedParent(parent, node);
                }
            });

            node.children.forEach(function(child) {
                traverse(child);
            });
        }

        function findNonDroppedParent(node, child) {
            if (node.value.state === DgDagStateT.DgDagStateReady) {
                if (startNodeMap[child.value.name]) {
                    return;
                }
                startNodeMap[child.value.name] = true;
                startNodes.push(child);
                return;
            }
            if (seen[node.value.name]) {
                return;
            }
            seen[node.value.name] = true;
            node.parents.forEach(function(parent) {
                findNonDroppedParent(parent, node);
            });
        }
    }

    function modifyAggParents(node) {
        if (node.api === XcalarApisT.XcalarApiMap ||
            node.api === XcalarApisT.XcalarApiFilter) {
            var aggSources = DagFunction.getAggsFromEvalStrs(node.struct.eval);
            for (var i = 0; i < aggSources.length; i++) {
                if (!node.aggSources) {
                    break;
                }
                if (node.aggSources.indexOf(aggSources[i]) === -1) {
                    aggSources.splice(i, 1);
                    i--;
                }
            }
            node.numParents = aggSources.length + 1;
            node.aggSources = aggSources;
        }
    }

    DagFunction.getReRunQueryString = function(tableName, params, newIndexNodes, newNodes) {
        params = xcHelper.deepCopy(params);
        var paramNodes = Object.keys(params);

        var tableId = xcHelper.getTableId(tableName);
        if (!dagLineage[tableId]) {
            console.error("Your table is not active. Please make it active!");
            return PromiseHelper.reject();
        }
        var valueArray = getOrderedDedupedNodes(dagLineage[tableId].endPoints,
                                                "TreeValue");

        if (valueArray.length === 0) {
            console.info("There is nothing to rerun.");
            return PromiseHelper.reject();
        }
        for (var i = 0; i < valueArray.length; i++) {
            var struct = DagFunction.cloneDagNode(valueArray[i].inputName,
                                                  valueArray[i].struct);
            valueArray[i] = xcHelper.deepCopy(valueArray[i]);
            // ^ Just the above is not enough due to prototype methods in
            // the thrift structs
            valueArray[i].struct = struct;
            modifyAggParents(valueArray[i]);
        }

        if (!modifyValueArrayWithParameters(valueArray, params)) {
            return PromiseHelper.reject();
        }

        // create new index nodes into valueArray and modify it's child node
        var newIndexNodesArray = [];
        insertIndexNodesIntoValArray(newIndexNodes, valueArray, newIndexNodesArray);

        var newNodesArray = [];
        insertNewNodesIntoValArray(newNodes, valueArray, newNodesArray);

        // Time to deep clone the tree. We cannot use deepCopy trick due to
        // constructor functions.
        var allEndPoints = [];
        var deepCopyTree = constructTree(valueArray[valueArray.length - 1],
                                                    valueArray, {},
                                                    null, allEndPoints);
        if (!deepCopyTree) {
            console.info("Tree Empty!");
            return PromiseHelper.reject();
        }

        var treeNodeArray = getOrderedDedupedNodes(allEndPoints, "TreeNode");

        if (treeNodeArray.length === 0) {
            console.info("Nothing to run!");
            return PromiseHelper.reject();
        }
        // Step 1. From deepCopied tree, get list of all xid for children of
        // start node (s)
        var startNodes = [];
        for (var i = 0; i < paramNodes.length; i++) {
            var newTreeNode = findTreeNodeInNodeArray(paramNodes[i], treeNodeArray);
            if (newTreeNode) {
                startNodes.push(newTreeNode);
            }
        }

        for (var i = 0; i < newIndexNodesArray.length; i++) {
            var newTreeNode = findTreeNodeInNodeArray(newIndexNodesArray[i], treeNodeArray);
            newTreeNode.value.tag = newTreeNode.children[0].value.tag;
            newTreeNode.value.tags = newTreeNode.value.tag.split(",");
            startNodes.push(newTreeNode);
        }

        for (var i = 0; i < newNodesArray.length; i++) {
            var newTreeNode = findTreeNodeInNodeArray(newNodesArray[i], treeNodeArray);
            startNodes.push(newTreeNode);
        }

        includeDroppedNodesInStartNodes(startNodes);

        var involvedNames = getAllNamesFromStart(deepCopyTree, startNodes);
        if (involvedNames.length === 0) {
            console.info("No involved xids.");
            return PromiseHelper.reject();
        }
        // returns map of name : value
        var nonInvolvedNames = getNonInvolvedRerunNames(deepCopyTree, startNodes, newNodes);

        // Step 2. Remove nodes from treeNodeArray that is not in involvedNames
        var treeNodesToRerun = [];
        for (var i = 0; i < treeNodeArray.length; i++) {
            if (treeNodeArray[i].value.name in involvedNames) {
                treeNodesToRerun.push(treeNodeArray[i]);
            }
        }

        if (treeNodesToRerun.length === 0) {
            console.info("Nothing to rerun");
            return PromiseHelper.reject();
        }

        // Step 3. From start of treeNodeArray (left side of the graph), start renaming all nodes
        var translation = {};
        var tagHeaders = {}; // will store a map {tag#oldId: tag#newId}
        var aggRenames = {};
        var aggNodes = {};
        var parameterizedAggs = {};
        for (var i = 0; i < treeNodesToRerun.length; i++) {
            var destTableValue = treeNodesToRerun[i].value;

            if (i > 0) {
                updateSourceName(destTableValue, translation);
            }

            updateDestinationName(destTableValue, translation, tagHeaders, aggRenames, paramNodes);
            if (destTableValue.api === XcalarApisT.XcalarApiAggregate) {
                aggNodes[destTableValue.struct.dest] = treeNodesToRerun[i];
                if (paramNodes.indexOf(destTableValue.name) > -1) {
                    parameterizedAggs[destTableValue.struct.dest] = true;
                }
            }
        }

        replaceAggRenames(treeNodesToRerun, aggRenames);
        var aggsToStore = getAggsToStore(aggNodes, aggRenames, parameterizedAggs);

        // assign tags to nodes that need it
        updateTags(paramNodes, treeNodesToRerun, tagHeaders);
        // if some nonInvolvedNodes require tag changes, get a map of
        // {tag: names[]}
        var tagMap = getNonInvolvedTagMap(nonInvolvedNames, tagHeaders);
        var queryString = getXcalarQueryCli(treeNodesToRerun);

        function updateSourceName(value, translation) {
            var struct = value.struct;
            if ("source" in struct) {
                if (typeof struct.source === "string") {
                    if (translation[struct.source]) {
                        struct.source = translation[struct.source];
                    }
                } else {
                    for (var i = 0; i < struct.source.length; i++) {
                        if (translation[struct.source[i]]) {
                            struct.source[i] = translation[struct.source[i]];
                        }
                    }
                }
            }
        }

        function updateDestinationName(value, translation, tagHeaders, aggRenames, paramNodes) {
            if (value.struct.dest in translation) {
                value.struct.dest = translation[value.struct.dest];
            } else {
                var tableName = xcHelper.getTableName(value.struct.dest);
                var oldId = xcHelper.getTableId(value.struct.dest);
                var newId = Authentication.getHashId();
                var newTableName = tableName + newId;

                for (var i = 0; i < value.tags.length; i++) {
                    if (xcHelper.getTableId(value.tags[i]) === oldId) {
                        tagHeaders[value.tags[i]] = xcHelper.getTableName(value.tags[i]) + newId;
                    }
                }

                if (value.api === XcalarApisT.XcalarApiAggregate) {
                    if (paramNodes.indexOf(value.name) > -1) {
                        aggRenames[gAggVarPrefix + value.struct.dest] = gAggVarPrefix + tableName;
                        value.struct.dest = tableName;
                    } else {
                        aggRenames[gAggVarPrefix + value.struct.dest] = gAggVarPrefix + newTableName;
                        value.struct.dest = newTableName;
                    }
                } else {
                    translation[value.struct.dest] = newTableName;
                    value.struct.dest = newTableName;
                }
            }
        }

        function modifyValueArrayWithParameters(valArray, params) {
            for (var p in params) {
                var tValue = findTreeValueInValArrayByName(p, valArray);
                var struct = tValue.struct;
                var param = params[p];
                for (var key in param) {
                    var sub = param[key];
                    var keyArray = key.split(".");
                    var obj = struct;
                    for (var i = 0; i < keyArray.length; i++) {
                        if (keyArray[i] in obj) {
                            if (i === keyArray.length - 1) {
                                obj[keyArray[i]] = sub;
                            } else {
                                obj = obj[keyArray[i]];
                            }
                        } else {
                            console.error("No such param!");
                            return (false);
                        }
                    }
                }
            }
            return (true);
        }

        function updateTags(paramNodes, treeNodesToRerun, tagHeaders) {
            for (var i = 0; i < treeNodesToRerun.length; i++) {
                var tags = treeNodesToRerun[i].value.tags;
                if (tags.length === 1) {
                    if (paramNodes.indexOf(treeNodesToRerun[i].value.name) > -1 &&
                    showSkipTag(tags[0])) {
                        // if node is splitcol or changetype and is edited, do not keep tag
                        treeNodesToRerun[i].value.tag = "";
                        continue;
                    }
                }

                var newTag = "";
                tags.forEach(function(tag) {
                    var headerTag = tagHeaders[tag];
                    if (headerTag) {
                        if (newTag) {
                            newTag += ",";
                        }
                        newTag += headerTag;
                    }
                });
                if (newTag) {
                    treeNodesToRerun[i].value.tag = newTag;
                } else {
                    treeNodesToRerun[i].value.tag = "";
                }
            }
        }

        // if some nonInvolvedNodes require tag changes, get a map of
        // {tag: names[]}
        function getNonInvolvedTagMap(nonInvolvedNames, tagHeaders) {
            var tagMap = {};
            for (var name in nonInvolvedNames) {
                var newTag = nonInvolvedNames[name].tag;
                var tags = nonInvolvedNames[name].tags;
                var hasChange = false;
                for (var i = 0; i < tags.length; i++) {
                    var tag = tags[i];
                    var headerTag = tagHeaders[tag];
                    if (headerTag) {
                        newTag += "," + headerTag;
                        hasChange = true;
                    }
                }
                if (hasChange) {
                    if (!tagMap[newTag]) {
                        tagMap[newTag] = [];
                    }
                    tagMap[newTag].push(name);
                }
            }
            return tagMap;
        }

        function getAggsToStore(aggNodes, aggRenames, parameterizedAggs) {
            var aggsToStore = [];
            var storedAggs = Aggregates.getNamedAggs();
            for (var name in aggRenames) {
                var backName = aggRenames[name].slice(gAggVarPrefix.length);
                if (storedAggs[name.slice(gAggVarPrefix.length)] ||
                    parameterizedAggs[backName]) {
                    // if not parameterized and pre-renamed version is not stored in the
                    // aggregate cache, then we don't add to Aggregates
                    var aggNode = aggNodes[backName];
                    var evalStr = aggNode.value.struct.eval[0].evalString;
                    var op = evalStr.slice(0, evalStr.indexOf("("));
                    var arg = evalStr.slice(evalStr.indexOf("(") + 1, -1);

                    var aggInfo = {
                        "value": null,
                        "dagName": backName,
                        "aggName": aggRenames[name],
                        "tableId": xcHelper.getTableId(aggNode.value.struct.source),
                        "backColName": arg,
                        "op": op
                    };
                    aggsToStore.push(aggInfo);
                }
            }
            return aggsToStore;
        }

        return {
            queryString: queryString,
            tagsNeeded: tagMap,
            aggsToStore: aggsToStore
        };
    }

    // DagFunction.runProcedureWithParams("students#p7304", {"students#p7303":{"eval": [{"evalString":"eq(students::student_id, 2)","newField":""}]}})
    DagFunction.runProcedureWithParams = function(tableName, params, newIndexNodes, newNodes) {
        var deferred = PromiseHelper.deferred();

        var info = DagFunction.getReRunQueryString(tableName, params, newIndexNodes, newNodes);
        var queryStr = info.queryString;
        var tagMap = info.tagsNeeded;
        var aggsToStore = info.aggsToStore;
        var nodes = JSON.parse(queryStr);
        var finalTableName = nodes[nodes.length - 1].args.dest;
        var tableId = xcHelper.getTableId(tableName);

        var sql = {
            "operation": SQLOps.DFRerun,
            "tableName": tableName,
            "tableId": tableId,
            "newTableName": finalTableName
        };
        var txId = Transaction.start({
            "msg": 'Rerun: ' + tableName,
            "operation": SQLOps.DFRerun,
            "sql": sql,
            "steps": nodes.length,
            "track": true
        });

        xcHelper.lockTable(tableId, txId);

        var queryName = "Rerun" + tableName + Math.ceil(Math.random() * 10000);
        $("#dagWrap-" + tableId).addClass("rerunning");
        var queryPassed = false;

        XIApi.query(txId, queryName, queryStr)
        .then(function() {
            for (var i = 0; i < aggsToStore.length; i++) {
                Aggregates.addAgg(aggsToStore[i]);
            }
            queryPassed = true;
            return tagNodesAfterEdit(tagMap);
        })
        .then(function() {
            DagEdit.clearEdit();
            return setColumnsAfterEdit(finalTableName, gTables[tableId]);
        })
        .then(function(cols) {
            var worksheet = WSManager.getWSFromTable(tableId);
            return TblManager.refreshTable([finalTableName], cols, [tableName],
                                    worksheet, txId, {noTag: true,
                                        focusWorkspace: true});
        })
        .then(function() {
            xcHelper.unlockTable(tableId, txId);
            Transaction.done(txId, {
                "msgTable": xcHelper.getTableId(finalTableName),
                "sql": sql
            });
            deferred.resolve();
        })
        .fail(function(error) {
            xcHelper.unlockTable(tableId, txId);

            var noAlert;
            if (!queryPassed && DagEdit.checkCanRestore(tableId)) {
                noAlert = true;
                var msg;
                if (typeof error === "object") {
                    // if it's an try/catch error, code will also goes here
                    msg = error.error || AlertTStr.ErrorMsg;
                } else {
                    msg = error;
                }
                if (msg === undefined) {
                    msg = "Error: " + StatusMessageTStr.RerunFailed;
                }

                msg = "Would you like to try editing this dataflow?<br/>" + msg;

                Alert.error(StatusMessageTStr.RerunFailed, msg, {
                    buttons: [{
                        name: "EDIT",
                        func: function() {
                            DagEdit.restore(tableId);
                        }
                    }],
                    onCancel: function() {
                        DagEdit.off(null, true);
                    },
                    "msgTemplate": msg
                });
            } else {
                noAlert = false;
                DagEdit.off(null, true);
            }
            Transaction.fail(txId, {
                "failMsg": StatusMessageTStr.RerunFailed,
                "error": error,
                "noAlert": noAlert
            });
            $("#dagWrap-" + tableId).removeClass("rerunning");
            deferred.reject();
        });

        return deferred.promise();
    };

    // for new index nodes
    function insertIndexNodesIntoValArray(newIndexNodes, valueArray, newNodesArray) {
        for (var name in newIndexNodes) {
            var indexNodes = newIndexNodes[name];
            for (var i = 0; i < indexNodes.length; i++) {
                var indexNode = indexNodes[i];
                var struct = new XcalarApiIndexInputT();
                struct.broadcast = false;
                struct.delaySort = false;
                struct.dhtName = "";
                struct.key = indexNode.keys;
                struct.prefix = "";
                struct.source = indexNode.src;
                struct.dest = xcHelper.getTableName(indexNode.src) + ".index" +
                              Authentication.getHashId();
                var parentNames = [];
                if (typeof struct.source === "string") {
                    parentNames = [struct.source];
                } else {
                    parentNames = struct.source;
                }
                var values = {
                    api: XcalarApisT.XcalarApiIndex,
                    struct: struct,
                    dagNodeId: struct.dest,
                    inputName: 'indexInput',
                    name: struct.dest,
                    numParents: 1,
                    parents: parentNames,
                    parentNames: parentNames
                };

                var node = new TreeValue(values);
                var dest = valueArray.find(function(val) {
                    return val.name === name;
                });

                if (typeof dest.struct.source === "string") {
                    dest.struct.source = struct.dest;
                    dest.parentNames = [dest.struct.source];
                } else {
                    for (var j = 0; j < dest.struct.source.length; j++) {
                        if (dest.struct.source[j] === struct.source) {
                            dest.struct.source[j] = struct.dest;
                        }
                    }
                    dest.parentNames = dest.struct.source;
                }

                valueArray.unshift(node);
                newNodesArray.push(struct.dest);
            }
        }
    }

    // for other new nodes
    function insertNewNodesIntoValArray(newNodes, valueArray, newNodesArray) {
        for (var name in newNodes) {
            var nodes = newNodes[name];
            var dest = valueArray.find(function(val) {
                return val.name === name;
            });

            if (dest.struct.source) {
                // give parentNames property to the node so when constructing
                // tree, will look at parentNames for parent first, instead of
                // dagnodeId, which we don't have for new nodes we're inserting
                if (typeof dest.struct.source === "string") {
                    dest.parentNames = [dest.struct.source];
                } else {
                    dest.parentNames = dest.struct.source;
                }
            }

            for (var i = 0; i < nodes.length; i++) {
                var struct = nodes[i].args;
                var api = XcalarApisTFromStr[nodes[i].operation];
                var inputName = DagFunction.getInputType(XcalarApisTStr[api]);
                var parentNames = [];
                if (typeof struct.source === "string") {
                    parentNames = [struct.source];
                } else if (typeof struct.source === "object") {
                    parentNames = struct.source;
                }
                var values = {
                    api: api,
                    struct: struct,
                    dagNodeId: struct.dest,
                    inputName: inputName,
                    name: struct.dest,
                    numParents: parentNames.length,
                    parents: parentNames,
                    parentNames: parentNames,
                    tag: dest.tag,
                    comment: ""
                };
                var node = new TreeValue(values);
                valueArray.unshift(node);
                newNodesArray.push(struct.dest);
                node.tags = node.tag.split(",");
            }
        }
    }

    // tagMap {nonInvolvedTableName: [tag#oldId1, tag#newId2]}
    function tagNodesAfterEdit(tagMap) {
        var deferred = PromiseHelper.deferred();
        var promises = [];
        for (var tag in tagMap) {
            promises.push(XcalarTagDagNodes(tag, tagMap[tag]));
        }
        PromiseHelper.when.apply(null, promises)
        .always(deferred.resolve);

        return deferred.promise();
    }

    function getXcalarQueryCli(orderedArray) {
        var queryArray = [];
        var node;
        for (var i = 0; i < orderedArray.length; i++) {
            node = orderedArray[i];
            var query = {
                "operation": XcalarApisTStr[node.value.api],
                "args": node.value.struct,
                "comment": JSON.stringify(node.value.comment),
                "tag": node.value.tag
            };
            queryArray.push(query);
        }
        return JSON.stringify(queryArray);
    }

    function getOrderedDedupedNodes(endPoints, type) {
        var queue = endPoints.slice();
        var printed = [];
        while (queue.length > 0) {
            var node = queue.shift();
            var allParentsPrinted = true;
            for (var i = 0; i < node.parents.length; i++) {
                if (printed.indexOf(node.parents[i]) === -1) {
                    allParentsPrinted = false;
                    break;
                }
            }
            if (allParentsPrinted) {
                printed.push(node);
                // Now add all parents of node to queue
                for (var i = 0; i < node.children.length; i++) {
                    if (queue.indexOf(node.children[i]) === -1) {
                        queue.push(node.children[i]);
                    }
                }
            } else {
                // Move node to back to try to print again later
                queue.push(node);
            }
        }
        if (type === "TreeNode") {
            return printed;
        } else if (type === "TreeValue") {
            for (var i = 0; i < printed.length; i++) {
                printed[i] = printed[i].value;
            }
            return printed;
        } else {
            console.error("Invalid type");
            return [];
        }
    }

    function constructTree(node, valArray, alreadySeen, child, endPoints) {
        var parentTree = null;
        if (!node) {
            return; // xx temporarily muting
            console.error(valArray, alreadySeen, child, endPoints);
            return;
        }

        var treeNode = new TreeNode(node);
        var parents = [];
        if (node.numParents === 0) {
            endPoints.push(treeNode);
        }

        if (node.numParents > 1 && !node.aggSources) {
            var parsedParents = DagFunction.getAggsFromEvalStrs(node.struct.eval);
            if (parsedParents.length) {
                node.aggSources = parsedParents;
            }
        }

        for (var i = 0; i < node.numParents; i++) {
            var parentId;
            var useName  = false;
            if (node.parentNames) {
                // used for constructing tree when rerunning edited dataflow
                // because new nodes don't have dagnodeids
                parentId = node.parentNames[i];
                useName = true;
            } else {
                parentId = node.parentIds[i];
            }
            // var parentId = node.parentIds[i];
            if (parentId in alreadySeen) {
                parentTree = alreadySeen[parentId];
                parentTree.children.push(treeNode);
                if (treeNode.value.api === XcalarApisT.XcalarApiExport) {
                    parentTree.value.exportNode = treeNode;
                }
            } else {
                if (useName) {
                    parentNode = findTreeValueInValArrayByName(parentId, valArray);
                } else {
                    parentNode = findTreeValueInValArrayById(parentId, valArray);
                }

                if (parentNode) {
                    parentTree = constructTree(parentNode, valArray,
                                              alreadySeen, treeNode, endPoints);
                } else {
                    node.numParents--;
                    continue;
                }

            }
            parents.push(parentTree);
        }

        treeNode.parents = parents;

        if (child) {
            treeNode.children.push(child);
            if (child.value.api === XcalarApisT.XcalarApiExport) {
                treeNode.value.exportNode = child;
            }
        }
        alreadySeen[node.dagNodeId] = treeNode;
        return (alreadySeen[node.dagNodeId]);
    }

    // cretes a map of dagNodIds: node
    function getIdMap(trees) {
        var idMap = {};
        for (var i = 0; i < trees.length; i++) {
            addToMap(trees[i]);
        }

        function addToMap(node) {
            idMap[node.value.dagNodeId] = node;
            for (var i = 0; i < node.parents.length; i++) {
                if (!idMap[node.parents[i].value.dagNodeId]) {
                    addToMap(node.parents[i]);
                }
            }
        }
        return idMap;
    }

    // for multiple exports, finds the real root
    function getIndexOfFullTree(trees) {
        if (trees.length === 1) {
            return 0;
        }
        // assumes all the root nodes are exports
        for (var i = 0; i < trees.length; i++) {
            var exportSrc = trees[i].parents[0];
            if (exportSrc.children.length === 1) {
                return i;
            }
        }

        return 0;
    }

    function getSets(trees) {
        var sets = [trees[0]];
        if (trees.length > 1) {
            for (var i = 1; i < trees.length; i++) {
                var exportSrc = trees[i].parents[0];
                if (exportSrc.children.length === 1) {
                    sets.push(trees[i]);
                }
            }
        }
        return sets;
    }

    // remove immediates that are not present in the new table, adds new immediates.
    // immediates that are present in before and after will change user string
    // to pull instead of map
    function setColumnsAfterEdit(finalTableName, table) {
        var deferred = PromiseHelper.deferred();
        var progCols = table.tableCols;

        XcalarGetTableMeta(finalTableName)
        .then(function(tableMeta) {
            var newCols = [];

            var values = tableMeta.valueAttrs;
            var immediates = {};
            var prefixes = {};
            var isDATAColLast = false;
            for (var i = 0; i < values.length; i++) {
                if (values[i].type === DfFieldTypeT.DfFatptr) {
                    prefixes[values[i].name] = true;
                } else {
                    immediates[values[i].name] = {used: false};
                }
            }

            for (var i = 0; i < progCols.length; i++) {
                if (progCols[i].prefix) {
                    if (prefixes[progCols[i].prefix]) {
                        newCols.push(ColManager.newCol(progCols[i]));
                    }
                } else {
                    if (progCols[i].isDATACol()) {
                        newCols.push(ColManager.newCol(progCols[i]));
                        if (i === progCols.length - 1) {
                            isDATAColLast = true;
                        }
                    } else if (immediates[progCols[i].name]) {
                        var newProgCol = ColManager.newCol(progCols[i]);
                        newProgCol.userStr = '"' + progCols[i].name + '" = pull(' + progCols[i].name + ')';
                        newCols.push(newProgCol);
                        immediates[progCols[i].name].used = true;
                    }
                }
            }

            if (table.backTableMeta) {
                var prevValues = table.backTableMeta.valueAttrs;
                for (var i = 0; i < prevValues.length; i++) {
                    if (prevValues[i].type !== DfFieldTypeT.DfFatptr) {
                        if (immediates[prevValues[i].name]) {
                            immediates[prevValues[i].name].used = true;
                        }
                    }
                }
            }

            for (var name in immediates) {
                var immediate = immediates[name];
                if (!immediate.used && name.indexOf("XC_") !== 0) {
                    var newProgCol = ColManager.newCol({
                        "backName": name,
                        "name": name,
                        "isNewCol": false,
                        "sizedTo": "header",
                        "width": xcHelper.getDefaultColWidth(name),
                        "userStr": '"' + name + '" = pull(' + name + ')'
                    });
                    if (isDATAColLast) {
                        newCols.splice(newCols.length - 1, 0, newProgCol);
                    } else {
                        newCols.push(ColManager.newCol(newProgCol));
                    }
                }
            }

            deferred.resolve(newCols);
        })
        .fail(function() {
            // just use original columns
            deferred.resolve(progCols);
        });
        return deferred.promise();
    }

    function replaceAggRenames(treeNodesToRerun, aggRenames) {
        for (var i = 0; i < treeNodesToRerun.length; i++) {
            var value = treeNodesToRerun[i].value;
            if (value.api === XcalarApisT.XcalarApiMap ||
                value.api === XcalarApisT.XcalarApiFilter) {
                for (var j = 0; j < value.struct.eval.length; j++) {
                    var func = ColManager.parseFuncString(value.struct.eval[j].evalString);
                    replaceFuncStr(func, aggRenames);
                    var newEval = xcHelper.stringifyFunc(func);
                    value.struct.eval[j].evalString = newEval;
                }
            }
        }
    }

    function replaceFuncStr(func, aggRenames) {
        for (var i = 0; i < func.args.length; i++) {
            var arg = func.args[i];
            if (typeof arg === "object") {
                replaceFuncStr(arg, aggRenames);
            } else {
                if (aggRenames[arg]) {
                    func.args[i] = aggRenames[arg];
                }
            }
        }
    }

    function showSkipTag(tag) {
        var op = xcHelper.getTableName(tag);
        return (op === SQLOps.SplitCol ||
                op === SQLOps.ChangeType ||
                op === SQLOps.Round);
    }

    /* Unit Test Only */
    if (window.unitTestMode) {
        DagFunction.__testOnly__ = {};
        DagFunction.__testOnly__insertNewNodesIntoValArray = insertNewNodesIntoValArray;
        DagFunction.__testOnly__insertIndexNodesIntoValArray = insertIndexNodesIntoValArray;
        DagFunction.__testOnly__tagNodesAfterEdit = tagNodesAfterEdit;
        DagFunction.__testOnly__setColumnsAfterEdit = setColumnsAfterEdit;
        DagFunction.__testOnly__includeDroppedNodesInStartNodes = includeDroppedNodesInStartNodes;
    }
    /* End Of Unit Test Only */

    return DagFunction;
}(jQuery, {}));
