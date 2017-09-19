window.Admin = (function($, Admin) {
    // xx may need to separate UserList module from Admin
    var userListKey = "gUserListKey"; // constant
    var userList = [];
    var loggedInUsers = {};
    var searchHelper;
    var $menuPanel; // $('#monitorMenu-setup');
    var $userList; // $menuPanel.find('.userList');
    var posingAsUser = false; // if admin is using as a different user

    Admin.initialize = function() {
        //xx temp hack  to determine admin
        if (xcLocalStorage.getItem("admin") === "true") {
            gAdmin = true;
            if (xcSessionStorage.getItem("usingAs") === "true" &&
                xcSessionStorage.getItem("adminName") !== XcSupport.getUser()) {
                posingAsUser = true;
                $('#container').addClass('posingAsUser');
            } else {
                $('#container').addClass('admin');
                $("#userNameArea").html('<i class="icon xi-user-setting"></i>');
            }
        }
        if (xcLocalStorage.getItem("xcSupport") === "true" &&
            xcSessionStorage.getItem("usingAs") !== "true") {
            gXcSupport = true;
            $('#container').addClass('admin xcSupport');
        }


        $menuPanel = $('#monitorMenu-setup');
        $userList = $menuPanel.find('.userList');

        if (Admin.isAdmin()) {
            addUserListListeners();
            addMonitorMenuSupportListeners();
            refreshUserList(true);
            setupAdminStatusBar();
            MonitorLog.setup();
            AdminAlertCard.setup();
        }
    };

    Admin.isAdmin = function() {
        return gAdmin;
    };

    Admin.isXcSupport = function() {
        return gXcSupport;
    };

    // will not add user if already exists in kvstore
    Admin.addNewUser = function() {
        var deferred = jQuery.Deferred();
        var username = XcSupport.getUser();

        KVStore.get(userListKey, gKVScope.GLOB)
        .then(function(value) {
            if (value == null) {
                return storeUsername(username);
            } else {
                parseStrIntoUserList(value);
                // usernames are case sensitive
                if (userList.indexOf(username) === -1) {
                    return storeUsername(username, true);
                } else {
                    return PromiseHelper.resolve();
                }
            }
        })
        .then(deferred.resolve)
        .fail(function(err) {
            //xx need to handle or alert?
            console.warn(err);
            deferred.reject(err);
        });

        return deferred.promise();
    };

    Admin.getUserList = function() {
        if (Admin.isAdmin()) {
            return userList;
        } else {
            return [];
        }
    };

    Admin.switchUser = function(username) {
        if (!Admin.isAdmin()) {
            return;
        }
        xcSessionStorage.setItem("xcalar-username", username);
        if (xcSessionStorage.getItem("usingAs") !== "true") {
            xcSessionStorage.setItem("usingAs", true);
            xcSessionStorage.setItem("adminName", XcSupport.getUser());
        }

        xcManager.unload(false, true);
    };

    Admin.userToAdmin = function() {
        if (!Admin.isAdmin()) {
            return;
        }
        xcSessionStorage.removeItem("usingAs");
        var adminName = xcSessionStorage.getItem("adminName");
        xcSessionStorage.setItem("xcalar-username", adminName);

        xcManager.unload(false, true);
    };

    Admin.showSupport = function() {
        Alert.forceClose();

        MainMenu.openPanel("monitorPanel", "setupButton");
        MainMenu.open(true);
        MonitorGraph.stop();
        $('#container').addClass('supportOnly');
        if ($("#container").hasClass("noWorkbook")) {
            $("#container").addClass("noMenuBar");
        }
        $("#container").removeClass("monitorMode setupMode");
        $('#configCard').addClass('xc-hidden');
        StatusMessage.updateLocation();
    };

    function addUserListListeners() {
        searchHelper = new SearchBar($("#adminUserSearch"), {
            "$list": $userList.find('ul'),
            "removeSelected": function() {
                $userList.find(".selected").removeClass('selected');
            },
            "highlightSelected": function($match) {
                $match.addClass("selected");
            },
            "onInput": function(val) {
                filterUserList(val);
            }
        });

        $("#adminUserSearch").on("click", ".closeBox", function() {
            searchHelper.clearSearch(function() {
                clearUserListFilter();
                searchHelper.$arrows.hide();
                $("#adminUserSearch").find("input").focus()
                .removeClass('hasArrows');
            });
        });
        $menuPanel.find(".refreshUserList").click(function() {
            searchHelper.clearSearch(function() {
                clearUserListFilter();
            });

            var sortedByUsage = $userList.hasClass("sortedByUsage");

            var promise = refreshUserList(false, sortedByUsage);
            xcHelper.showRefreshIcon($userList, false, promise);
        });

        $userList.on('click', '.userLi .useAs', function() {
            var $li = $(this).closest(".userLi");
            if ($li.hasClass("self")) {
                return;
            }
            var username = $li.text().trim();
            var title = MonitorTStr.UseXcalarAs;
            var msg = xcHelper.replaceMsg(MonitorTStr.SwitchUserMsg, {
                username: username
            });
            Alert.show({
                "title": title,
                "msg": msg,
                "onConfirm": function() {
                    Admin.switchUser(username);
                }
            });
        });

        $("#userMemPopup").draggable({
            handle: '#userMemPopupTitle',
            cursor: '-webkit-grabbing',
            containment: "window"
        });

        $("#userMemPopup").resizable({
            handles: "n, e, s, w, se",
            minHeight: 300,
            minWidth: 300,
            containment: "document"
        });

        $userList.on("click", ".userLi .memory", function() {
            var $popup = $("#userMemPopup");
            var $li = $(this).closest(".userLi");
            var username = $li.text().trim();

            var popupId = Math.floor(Math.random() * 100000);
            $popup.data("id", popupId);
            $popup.find(".content").empty();
            $popup.find(".titleContentWrap").text(username);
            positionMemPopup($popup);

            $(document).on("mousedown.hideMemPopup", function(event) {
                var $target = $(event.target);
                if ($target.closest("#userMemPopup").length === 0) {
                    if ($target.closest(".memory").length) {
                        $(document).off(".hideMemPopup");
                    } else {
                        hideMemPopup();
                    }
                }
            });

            var promise = getMemUsage(username);
            xcHelper.showRefreshIcon($popup, false, promise);

            promise
            .then(function(data) {
                var totalMem = 0;
                for (var sess in data) {
                    totalMem += xcHelper.textToBytesTranslator(
                                                    data[sess]["Total Memory"]);
                }
                $li.data("memval", totalMem);
                var memText = xcHelper.sizeTranslator(totalMem, true);
                memText = MonitorTStr.MemUsage + ": " + memText[0] + " " +
                         memText[1];
                xcTooltip.changeText($li.find(".memory"), memText);
                if ($popup.data("id") !== popupId) {
                    return;
                }
                var html = xcHelper.prettifyJson(data);
                html = "{\n" + html + "}";
                $popup.find(".content").html(html);
                var $breakdown = $popup.find(".content")
                                      .find('.jsonBlock[data-key="Breakdown"]');
                $breakdown.each(function() {
                    var $bd = $(this);
                    if (!$bd.find(".emptyObj").length) {
                        $bd.addClass("breakdown");
                        var toggle = '<div class="toggleBreakdown xc-action">' +
                                        '<i class="icon xi-arrow-down"></i>' +
                                     '</div>';
                        $bd.prepend(toggle);
                        var ellipsis = '<div class="ellipsis xc-action" ' +
                        'data-tipclasses="highZindex" data-toggle="tooltip" ' +
                        'data-placement="top" data-container="body" title="' +
                        CommonTxtTstr.ClickToExpand + '">...</div>';
                        $bd.find(".jObj").before(ellipsis);
                    }
                });
            })
            .fail(function(error) {
                if ($popup.data("id") !== popupId) {
                    return;
                }
                var type = typeof error;
                var msg;
                var notExists = false;
                var isEmpty = false;

                if (type === "object") {
                    msg = error.error || AlertTStr.ErrorMsg;
                    if (error.status === StatusT.StatusSessionNotFound) {
                        if (username === userIdName) {
                            isEmpty = true;
                        } else {
                            notExists = true;
                        }
                    }
                } else {
                    msg = error;
                }
                var errorDiv = "<div class='error'>" +
                                    msg +
                                "</div>";
                $popup.find(".content").html(errorDiv);
                if (notExists) {
                    $li.addClass("notExists");
                    xcTooltip.add($li, {
                        title: MonitorTStr.UserNotExists
                    });
                } else if (isEmpty) {
                    memText = MonitorTStr.MemUsage + ": 0 B";
                    xcTooltip.changeText($li.find(".memory"), memText);
                }
            });
        });

        $("#userMemPopup").on("click", ".close", function() {
            hideMemPopup();
        });

        $("#userMemPopup").on("click", ".toggleBreakdown, .ellipsis",
        function() {
            $(this).closest(".breakdown").toggleClass("active");
            xcTooltip.hideAll();
            xcHelper.removeSelectionRange();
        });

        $userList.on("click", ".sortOption", function() {
            var sortByName = $(this).hasClass("sortName");
            if (sortByName) {
                if ($userList.hasClass("sortedByName")) {
                    return;
                } else {
                    $userList.addClass("sortedByName").removeClass("sortedByUsage");
                }
            } else { // sort by date
                if ($userList.hasClass("sortedByUsage")) {
                    return;
                } else {
                    $userList.addClass("sortedByUsage").removeClass("sortedByName");
                }
            }

            if (sortByName) {
                var userMemList = [];
                $userList.find("li").each(function() {
                    var $li = $(this);
                    userMemList.push({
                        username: $li.find(".text").text(),
                        memText: $li.find(".memory").data("title")
                    });
                });
                userMemList.sort(function(a, b) {
                    return xcHelper.sortVals(a.username, b.username);
                });
                userList = [];
                for (var i = 0; i < userMemList.length; i++) {
                    userList.push(userMemList[i].username);
                }
                setupUserListMenu(userMemList);
            } else {
                var promise = refreshUserList(false, true);
                xcHelper.showRefreshIcon($userList, false, promise);
            }
        });
    }

    function positionMemPopup($popup) {
        if ($popup.is(":visible")) {
            return;
        }
        $popup.show();

        var defaultWidth = 600;
        var defaultHeight = 600;
        $popup.height("auto");
        $popup.width("auto");
        var height = Math.min(defaultHeight, $popup.height());
        var width = Math.min(defaultWidth, $popup.width());
        height = Math.max(height, 400);
        width = Math.max(width, 400);
        $popup.height(height);
        $popup.width(width);
        var winWidth = $(window).width();
        var winHeight = $(window).height();
        $popup.css({
            left: (winWidth - width) / 2,
            top: (winHeight - height) / 2
        });
    }

    function getMemUsage(username) {
        var deferred  = jQuery.Deferred();
        var userId = XcSupport.getUserIdUnique(username);
        XcalarGetMemoryUsage(username, userId)
        .then(function(origData) {
            var data;
            if (origData && origData.userMemory &&
                origData.userMemory.sessionMemory)
            {
                data = {};
                var mem = origData.userMemory.sessionMemory;
                for (var i = 0; i < mem.length; i++) {
                    var totalMem = 0;
                    var sess = {
                        "Total Memory": 0,
                        "Breakdown": {}
                    };
                    mem[i].tableMemory.sort(function(a, b) {
                        return xcHelper.sortVals(a.tableName, b.tableName);
                    });
                    for (var j = 0; j < mem[i].tableMemory.length; j++) {
                        totalMem += mem[i].tableMemory[j].totalBytes;
                        sess.Breakdown[mem[i].tableMemory[j].tableName] =
                                            mem[i].tableMemory[j].totalBytes;
                    }
                    sess["Total Memory"] = xcHelper.sizeTranslator(totalMem);

                    data[mem[i].sessionName] = sess;
                }
            } else {
                data = origData;
            }
            deferred.resolve(data);
        })
        .fail(deferred.reject);

        return deferred.promise();
    }

    function getAllUsersMemory(sortByUsage) {
        var deferred = jQuery.Deferred();
        var userId;
        var username;
        var promises = [];
        for (var i = 0; i < userList.length; i++) {
            username = userList[i];
            userId = XcSupport.getUserIdUnique(username);
            promises.push(XcalarGetMemoryUsage(username, userId));
        }

        PromiseHelper.when.apply(window, promises)
        .always(function() {
            var users = arguments;
            var data;
            var tempUserList = [];
            var memText;
            for (var i = 0; i < users.length; i++) {
                data = users[i];
                if (data && data.userMemory &&
                    data.userMemory.sessionMemory)
                {
                    var mem = data.userMemory.sessionMemory;
                    var totalMem = 0;
                    for (var j = 0; j < mem.length; j++) {
                        for (var k = 0; k < mem[j].tableMemory.length; k++) {
                            totalMem += mem[j].tableMemory[k].totalBytes;
                        }
                    }
                    username = data.userMemory.userName;
                    memText = xcHelper.sizeTranslator(totalMem, true);
                    memText = memText[0] + " " + memText[1];
                    tempUserList.push({
                        username: username,
                        memVal: totalMem,
                        memText: memText
                    });
                } else if (userList[i] === userIdName &&
                    data && data.status === StatusT.StatusSessionNotFound) {
                    // is self and has no session
                    tempUserList.push({
                        username: userIdName,
                        memVal: 0,
                        memText: "0B"
                    });
                }
            }
            if (sortByUsage) {
                tempUserList.sort(function(a, b) {
                    return b.memVal - a.memVal;
                });
            } else {
                tempUserList.sort(function(a, b) {
                    return xcHelper.sortVals(a.username, b.username);
                });
            }

            userList = [];
            for (var i = 0; i < tempUserList.length; i++) {
                userList.push(tempUserList[i].username);
            }
            setupUserListMenu(tempUserList);
            deferred.resolve();
        });
        return deferred.promise();
    }

    function hideMemPopup() {
        var $popup = $("#userMemPopup");
        $popup.hide();
        $popup.find(".content").empty();
        $(document).off(".hideMemPopup");
    }

    function addMonitorMenuSupportListeners() {
        $("#configStartNode").click(startNode);

        $("#configStopNode").click(stopNode);

        $("#configRestartNode").click(restartNode);

        $("#configSupportStatus").click(getStatus);

        $('#configLicense').click(LicenseModal.show);

        $("#loginConfig").click(showLoginConfig);
    }

    function parseStrIntoUserList(value) {
        var len = value.length;
        if (value.charAt(len - 1) === ",") {
            value = value.substring(0, len - 1);
        }
        var arrayStr = "[" + value + "]";

        try {
            userList = JSON.parse(arrayStr);
        } catch (err) {
            userList = [];
            console.error("restore error logs failed!", err);
        }
        userList.sort(xcHelper.sortVals);
    }

    // xcalar put by default, or append if append param is true
    function storeUsername(username, append) {
        var deferred = jQuery.Deferred();
        var entry = JSON.stringify(username) + ",";
        var promise;
        if (append) {
            promise = XcalarKeyAppend(userListKey, entry, true, gKVScope.GLOB);
        } else {
            promise = XcalarKeyPut(userListKey, entry, true, gKVScope.GLOB);
        }

        promise.then(function() {
            userList.push(username);
            deferred.resolve();
        })
        .fail(deferred.reject);

        return deferred.promise();
    }

    function setupUserListMenu(userMemList) {
        var html = "";
        var memTip = MonitorTStr.ViewMem;
        for (var i = 0; i < userList.length; i++) {
            if (userMemList) {
                memTip = MonitorTStr.MemUsage + ": " +userMemList[i].memText;
            }
            html += '<li class="userLi">' +
                        '<span class="status"' +
                        ' data-toggle="tooltip"' +
                        ' data-container="body"' +
                        ' data-placement="top"' +
                        ' data-title="' + TooltipTStr.LoggedIn + '">' +
                        '</span>' +
                        '<i class="icon xi-user fa-11"></i>' +
                        '<span class="text">' + userList[i] + '</span>' +
                        '<span class="useAs xc-action"' +
                            ' data-toggle="tooltip"' +
                            ' data-container="body"' +
                            ' data-placement="top"' +
                            ' data-title="Use Xcalar as this user">' +
                            '<i class="icon xi-monitor"></i>' +
                        '</span>' +
                        '<span class="memory xc-action"' +
                            ' data-toggle="tooltip"' +
                            ' data-container="body"' +
                            ' data-placement="top"' +
                            ' data-title="' + memTip + '">' +
                            '<i class="icon xi-menu-info"></i>' +
                        '</span>' +
                    '</li>';
        }

        $userList.find('ul').html(html);
        updateLoggedInUsersList();
    }

    function updateLoggedInUsersList() {
        $userList.find(".userLi").each(function() {
            var $li = $(this);
            var name = $li.find(".text").text();
            if (loggedInUsers.hasOwnProperty(name)) {
                $li.addClass("loggedIn");
            } else {
                $li.removeClass("loggedIn");
            }
            if (name === userIdName) {
                $li.addClass("self");
                var msg = MonitorTStr.YouAreUsing + name;
                xcTooltip.changeText($li.find(".useAs"), msg);
            }
        });
    }

    Admin.updateLoggedInUsers = function(users) {
        if (!Admin.isAdmin()) {
            return;
        }
        loggedInUsers = users;
        updateLoggedInUsersList();
    };

    function refreshUserList(firstTime, sortByUsage) {
        var deferred = jQuery.Deferred();
        $userList.addClass("refreshing");

        KVStore.get(userListKey, gKVScope.GLOB)
        .then(function(value) {
            if (value == null) {
                userList = [];
            } else {
                parseStrIntoUserList(value);
            }
            if (!firstTime) {
                return getAllUsersMemory(sortByUsage);
            } else {
                setupUserListMenu();
                return PromiseHelper.resolve();
            }
        })
        .then(deferred.resolve)
        .fail(deferred.reject)
        .always(function() {
            $userList.removeClass("refreshing");
        });

        return deferred.promise();
    }

    function filterUserList(keyWord) {
        var $lis = $menuPanel.find(".userLi");
        // $lis.find('.highlightedText').contents().unwrap();
        $lis.each(function() {
            var $li = $(this);
            if ($li.hasClass("highlighted")) {
                var $span = $li.find(".text");
                $span.html($span.text());
                $li.removeClass("highlighted");
            } else if ($li.hasClass('nonMatch')) {
                // hidden lis that are filtered out
                $li.removeClass('nonMatch xc-hidden');
            }
        });

        if (keyWord == null || keyWord === "") {
            searchHelper.clearSearch(function() {
                searchHelper.$arrows.hide();
            });
            $("#adminUserSearch").find("input").removeClass('hasArrows');
            return;
        } else {
            var regex = new RegExp(xcHelper.escapeRegExp(keyWord), "gi");
            $lis.each(function() {
                var $li = $(this);
                var tableName = $li.text();
                if (regex.test(tableName)) {
                    $li.addClass("highlighted");
                    // var $span = $li.find(".tableName");
                    var $span = $li.find('.text');
                    var text = $span.text();
                    text = text.replace(regex, function (match) {
                        return ('<span class="highlightedText">' + match +
                            '</span>');
                    });

                    $span.html(text);
                } else {
                    // we will hide any lis that do not match
                    $li.addClass('nonMatch xc-hidden');
                }
            });
            searchHelper.updateResults($userList.find('.highlightedText'));
            // var counterWidth = $userList.find('.counter').width();
            // $userList.find('input').css("padding-right", counterWidth + 30);

            if (searchHelper.numMatches !== 0) {
                searchHelper.scrollMatchIntoView(searchHelper.$matches.eq(0));
                searchHelper.$arrows.show();
                $("#adminUserSearch").find("input").addClass('hasArrows');
            } else {
                searchHelper.$arrows.hide();
                $("#adminUserSearch").find("input").removeClass('hasArrows');
            }
        }
    }

    function clearUserListFilter() {
        $("#adminUserSearch").find("input").val("");
        filterUserList(null);
    }

    function setupAdminStatusBar() {
        var $adminBar = $('#adminStatusBar');

        if (posingAsUser) {
            $adminBar.find('.username').text(XcSupport.getUser());
            var width = $adminBar.outerWidth() + 1;
            $adminBar.outerWidth(width);
            // giving adminBar a width so we can use position right with the
            // proper width
            $adminBar.on('click', '.pulloutTab', function() {
                $adminBar.toggleClass('active');
                if ($adminBar.hasClass('active')) {
                    $adminBar.css('right', 0);
                } else {
                    $adminBar.css('right', -width + 20);
                }
            });

            $adminBar.on('click', '.xi-close', function() {
                Admin.userToAdmin();
            });
            $('#adminViewBtn').on('click', function() {
                $adminBar.removeClass('xc-hidden');
            });
        } else {
            $("#adminStatusBar").hide();
        }
    }

    function startNode() {
        supportPrep('startNode')
        .then(XFTSupportTools.clusterStart)
        .then(function(ret) {
            // refresh page
            if (ret.status === Status.Ok &&
                ret.logs.indexOf("already running") > -1) {
                Alert.show({msg: ret.logs, isAlert: true});
            } else {
                location.reload();
            }
        })
        .fail(function(err) {
            nodeCmdFailHandler('startNode', err);
        })
        .always(function() {
            $("#initialLoadScreen").hide();
        });
    }

    function stopNode() {
        supportPrep('stopNode')
        .then(XFTSupportTools.clusterStop)
        .then(function() {
            if ($('#container').hasClass('supportOnly')) {
                xcHelper.showSuccess(SuccessTStr.StopCluster);
            } else {
                var alertError = {"error": ThriftTStr.CCNBE};
                Alert.error(ThriftTStr.CCNBEErr, alertError, {
                    "lockScreen": true
                });
            }
        })
        .fail(function(err) {
            nodeCmdFailHandler('stopNode', err);
        })
        .always(function() {
            $("#initialLoadScreen").hide();
        });
    }

    function restartNode() {
        // restart is unreliable so we stop and start instead
        supportPrep('restartNode')
        .then(XFTSupportTools.clusterStop)
        .then(XFTSupportTools.clusterStart)
        .then(function() {
            location.reload();
        })
        .fail(function(err) {
            nodeCmdFailHandler('restartNode', err);
        })
        .always(function() {
            $("#initialLoadScreen").hide();
        });
    }

    function getStatus() {
        $('#configSupportStatus').addClass('unavailable');
        XFTSupportTools.clusterStatus()
        .then(function(ret) {
            var logs = ret.logs;
            if (!logs) {
                logs = "No logs available.";
            }
            Alert.show({
                "title": MonitorTStr.ClusterStatus,
                "msg": logs,
                "isAlert": true,
                "sizeToText": true
            });
        })
        .fail(function(err) {
            if (err) {
                // the error status is not set by
                // server, it may be due to other reasons
                if (err.logs) {
                    // unexpected error
                    if (err.unexpectedError) {
                        msg = (err.logs === "error")? ErrTStr.Unknown : err.logs;
                        Alert.error(MonitorTStr.GetStatusFail, msg);
                    } else {
                        // the reason for why all the nodes are success or
                        // fail is known and defined.
                        Alert.show({
                            "title": MonitorTStr.ClusterStatus,
                            "msg": err.logs,
                            "isAlert": true
                        });
                    }
                }
            } else {
                msg = ErrTStr.Unknown;
                Alert.error(MonitorTStr.GetStatusFail, msg);
            }
        })
        .always(function() {
            $('#configSupportStatus').removeClass('unavailable');
        });
    }

    // setup func called before startNode, stopNode, etc.
    function supportPrep(command) {
        var deferred = jQuery.Deferred();
        if (!Admin.isAdmin()) {
            deferred.reject({logs: MonitorTStr.NotAuth});
            return deferred.promise();
        }

        var title;
        var alertMsg;
        switch (command) {
            case ('startNode'):
                title = MonitorTStr.StartNodes;
                break;
            case ('stopNode'):
                title = MonitorTStr.StopNodes;
                alertMsg = MonitorTStr.StopAlertMsg;
                break;
            case ('restartNode'):
                title = MonitorTStr.RestartNodes;
                alertMsg = MonitorTStr.RestartAlertMsg;
                break;
            default:
                title = AlertTStr.CONFIRMATION;
                break;
        }
        var msg = xcHelper.replaceMsg(MonitorTStr.NodeConfirmMsg, {
            type: title.toLowerCase().split(" ")[0] // first word (start, restart)
        });

        Alert.show({
            "title": title,
            "msg": msg,
            "onConfirm": function() {
                if (alertMsg) {
                    var alertOption = {
                        "title": title,
                        "message": alertMsg
                    };
                    XcSocket.sendMessage("adminAlert", alertOption);
                }
                $("#initialLoadScreen").show();
                if (WorkbookManager.getActiveWKBK() != null) {
                    KVStore.commit()
                    .then(function() {
                        deferred.resolve();
                    })
                    .fail(function(err) {
                        console.error(err);
                        deferred.resolve();
                    });
                } else {
                    // the first time to use Xcalar and the backend is down
                    // No workbook, KVStore.commit() will report an error
                    deferred.resolve();
                }
            },
            "onCancel": function() {
                deferred.reject('canceled');
            }
        });
        return deferred.promise();
    }

    function nodeCmdFailHandler(command, err) {
        if (err === "canceled") {
            return;
        }
        var title;
        switch (command) {
            case ('startNode'):
                title = MonitorTStr.StartNodeFailed;
                break;
            case ('stopNode'):
                title = MonitorTStr.StopNodeFailed;
                break;
            case ('restartNode'):
                title = MonitorTStr.RestartFailed;
                break;
            default:
                title = AlertTStr.Error;
                break;
        }

        if (err.logs) {
            msg = err.logs;
        } else {
            msg = title + ".";
        }

        Alert.error(title, msg);
    }

    function showLoginConfig() {
        var waadConfig = null;
        var defaultAdminConfig = null;
        var ldapConfig = null;

        $('#loginConfig').addClass('unavailable');
        getWaadConfig(hostname)
        .then(
            function(waadConfigIn) {
                waadConfig = waadConfigIn;
                return (getDefaultAdminConfig(hostname));
            },

            function() {
                return (getDefaultAdminConfig(hostname));
            }
        )
        .then(
            function(defaultAdminConfigIn) {
                defaultAdminConfig = defaultAdminConfigIn;
                return (getLdapConfig(hostname));
            },

            function() {
                return (getLdapConfig(hostname));
            }
        )
        .then(function(ldapConfigIn) {
            ldapConfig = ldapConfigIn;
        })
        .always(function() {
            $('#loginConfig').removeClass('unavailable');
            LoginConfigModal.show(waadConfig, defaultAdminConfig, ldapConfig);
        });
    }

      /* Unit Test Only */
    if (window.unitTestMode) {
        Admin.__testOnly__ = {};
        Admin.__testOnly__.setPosingAs = function() {
            posingAsUser = true;
            $('#container').addClass('posingAsUser');
        };
        Admin.__testOnly__.refreshUserList = refreshUserList;
    }
    /* End Of Unit Test Only */

    return (Admin);
}(jQuery, {}));
