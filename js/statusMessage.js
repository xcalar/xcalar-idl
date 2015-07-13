// displays load message and animated waiting icon near CLI button
window.StatusMessage = (function() {
    var $statusText = $('#pageStatusText');
    var $waitingIcon = $('#loadingIconWrap').children();
    var isLoading = false;

    var Message = function() {};
    var self = new Message();
    var rotateInterval;
    var messages = [];
    var msgObjs = {};
    var scrollSpeed = 500;
    var rotationTime = 2000;
    var numRotations = 0;
    var rotatePosition = 0;
    var isFailed = false;
    var inScroll;
    var messagesToBeRemoved = [];
    var msgIdCount = 0;
    var inRotation = false;

    Message.prototype.addMsg = function(msg) {
        var msgObj = msg || {};
        msg = msgObj.msg || StatusMessageTStr.Loading;
        msgIdCount++;
        messages.push(msgIdCount);
        msgObjs[msgIdCount] = msgObj;

        if (messages.length === 1) {
            $statusText.append('<span id="stsMsg-' + msgIdCount + '">' + msg +
                               '</span><span id="stsMsg-' + msgIdCount + '">' +
                                msg + '</span>');
            // we append twice in order to make a full cycle for the carousel
        } else {
            $statusText.children('span:last-child')
                       .before('<span id="stsMsg-' + msgIdCount + '">' + msg +
                               '</span>');
        }

        if (messages.length === 1) {
            inScroll = scrollToMessage().then(function() {
                $('#viewLocation').remove();
                $statusText.scrollTop(0);
            }).promise();
        }
        
        $waitingIcon.fadeIn(100);
        if (messages.length === 2) {
            stopRotation();
            rotateMessages();
        }
        
        isLoading = true;
        return (msgIdCount);
    };

    Message.prototype.getPos = function() {
        return rotatePosition;
    };

    Message.prototype.stop = function() {
        stopRotation();
    };

    Message.prototype.success = function(msgId) {
        showDoneNotification(msgId);

        inScroll.then(function() {
            var $successSpan = $statusText.find('#stsMsg-' + msgId);
            $successSpan.addClass('success');
            var completed = '<b>' + StatusMessageTStr.Completed + ': </b>';
            $successSpan.prepend(completed);

            if (messages.indexOf(msgId) === 0) {
                var $secondSpan = $statusText.find('span:last');
                $secondSpan.prepend(completed);
                $secondSpan.addClass('success');
            }
            var messageToRemove = {
                $span           : $successSpan,
                msgId           : msgId,
                msg             : $successSpan.text(),
                desiredRotations: numRotations + 1
            };
            messagesToBeRemoved.push(messageToRemove);
            if (!inRotation) {
                checkForMessageRemoval();
            }
            if (messages.length <= messagesToBeRemoved.length) {
                $waitingIcon.hide();
            }
        });
        
        return (self);
    };

    Message.prototype.fail = function(failMessage, msgId) {
        var fail = true;
        showDoneNotification(msgId, fail);
        failMessage = failMessage || StatusMessageTStr.Error;
        var failHTML = '<span class="text fail">' + failMessage + '</span>' +
                       '<span class="icon close"></span>';

        var $statusSpan = $('#stsMsg-' + msgId);
        $statusSpan.html(failHTML);
        if (messages.indexOf(msgId) === 0) {
            $statusText.find('span:last').html(failHTML);
        }
        if (messages.length <= $statusText.find('.fail').length) {
            $waitingIcon.hide();
        }
        
        return (self);
    };

    Message.prototype.reset = function() {
        msgIdCount = 0;
        stopRotation();
        self.updateLocation(true);
        isFailed = false;
        messages = [];
        numRotations = 0;
        messagesToBeRemoved = [];
    };

    Message.prototype.isFailed = function(){
        return isFailed;
    };

    Message.prototype.updateLocation = function(force) {
        if (!isLoading || force) {
            var currentPanel = $.trim($('.mainMenuTab.active').text());
            var locationHTML = '<span id="viewLocation">' +
                               StatusMessageTStr.Viewing + " " +
                               currentPanel + '</span>';
            $statusText.html(locationHTML);
        }
    };

    function rotateMessages() {
        inRotation = true;
        rotatePosition = 0;
        rotateInterval = setInterval(function() {
            scrollToMessage().then(function() {
                if (rotatePosition >= messages.length) {
                    $statusText.scrollTop(0);
                    rotatePosition = 0;
                    numRotations++;
                }
                checkForMessageRemoval();
            });
            
        }, rotationTime);
    }

    function checkForMessageRemoval() {
        for (var i = 0; i < messagesToBeRemoved.length; i++) {
            var msg = messagesToBeRemoved[i];
            var msgIndex = messages.indexOf(msg.msgId);

            if (numRotations > msg.desiredRotations) {
                var numTotalMessages = messages.length;
                
                if (numTotalMessages === 1) {
                    var currIndex = i;
                    setTimeout(function() {
                        removeSuccessMessage(msg.$span, msgIndex, currIndex,
                                             msg.msgId);
                    }, 2000);

                } else if (msgIndex > rotatePosition) {
                    removeSuccessMessage(msg.$span, msgIndex, i, msg.msgId);
                    i--;
                } else if (msgIndex === 0 && rotatePosition !== 0) {
                    removeSuccessMessage(msg.$span, msgIndex, i, msg.msgId);
                    $statusText.scrollTop(0);
                    rotatePosition = 0;
                    i--;
                }
            } else if (!inRotation) {
                var currIndex = i;
                setTimeout(function() {
                    removeSuccessMessage(msg.$span, msgIndex, currIndex,
                                         msg.msgId);
                }, rotationTime);
            }
        }
    }

    function removeSuccessMessage($span, msgIndex, removalIndex, msgId) {
        $span.remove();
        messages.splice(msgIndex, 1);
        messagesToBeRemoved.splice(removalIndex, 1);
        var $duplicateMsg = $('#stsMsg-' + msgId);
        if ($duplicateMsg.length !== 0) {
            $duplicateMsg.remove();
            var $firstSpan = $statusText.find('span').eq(0).clone();
            $statusText.append($firstSpan);
        }
        
        messageRemoveHelper();
        if (messages.length <= $statusText.find('.fail').length) {
            $waitingIcon.hide();
        }
    }

    function scrollToMessage() {
        var scrollAnimation = $statusText.animate({
            scrollTop: 20 * (++rotatePosition)
        }, scrollSpeed).delay(300).promise();
        return (scrollAnimation);
    }

    function stopRotation() {
        clearInterval(rotateInterval);
        inRotation = false;
        rotatePosition = 0;
        setTimeout(function() {
            checkForMessageRemoval();
        }, rotationTime);
    }

    $statusText.on('click', '.close', function() {
        var $statusSpan = $(this).parent();
        var msgId = parseInt($statusSpan.attr('id').substr(7));
        var msgIndex = messages.indexOf(msgId);
        messages.splice(msgIndex, 1);
        $statusSpan.remove();
        $('#stsMsg-' + msgId).remove(); // remove duplicate if exists
        if (msgIndex === 0) {
            var $firstSpan = $statusText.find('span').eq(0).clone();
            $statusText.append($firstSpan);
            $statusText.scrollTop(0);
            rotatePosition = 0;
        }
        messageRemoveHelper();
    });

    function messageRemoveHelper() {
        if (messages.length === 0) {
            isLoading = false;
            $waitingIcon.hide();
            self.updateLocation();
            stopRotation();
        } else if (messages.length < 2) {
            stopRotation();
        }
    }

    function showDoneNotification(msgId, failed) {
        var operation = msgObjs[msgId].operation;
        var popupNeeded = false;
        var popupWrapExists = false;
        var popupNearTab = false;
        var popupBottom = false;
        var left = 'auto';
        var right = 'auto';
        var bottom = 'auto';
        var top = 'auto';
        var arrow = '';
        var classes = '';
        var status;
        if (failed) {
            status = ' failed';
        } else {
            status = ' completed';
        }

        var $tableDonePopup = $('<div class="tableDonePopup' + status + '"' +
                                'id="tableDonePopup' + msgId + '" >' +
                                operation + status + '</div>');

        if (operation === 'table creation') {
            return;
        }
        if (operation === 'data set load') {
            if (!$('#dataStoresTab').hasClass('active')) {
                
                var $popups = $('.tableDonePopup.datastoreNotify');
                if ($popups.length !== 0) {
                    var $popupWrap = $popups.parent();
                    $popupWrap.append($tableDonePopup);
                    popupWrapExists = true;
                } else {
                    popupNearTab = $('#dataStoresTab');
                }
                classes += ' datastoreNotify';
                popupNeeded = true;
            }
        } else if (!$('#workspaceTab').hasClass('active')) {
            var $popups = $('.tableDonePopup.workspaceNotify');
            if ($popups.length !== 0) {
                var $popupWrap = $popups.parent();
                $popupWrap.append($tableDonePopup);
                popupWrapExists = true;
            } else {
                popupNearTab = $('#workspaceTab');
            }
            classes += ' workspaceNotify';
            popupNeeded = true;
        } else {
            var tableName = msgObjs[msgId].tableName;
            var direction = isTableVisible(tableName);
            
            if (direction !== 'visible') {
                popupNeeded = true;
                var $popups;
                var $popupWrap;
                if (direction === 'left') {
                    $popups = $('.tableDonePopup.leftSide');
                    if ($popups.length !== 0) {
                        $popupWrap = $popups.parent();
                        $popupWrap.append($tableDonePopup);
                        popupWrapExists = true;
                    } else {
                        left = 6;
                        top = Math.max(200, ($(window).height() / 2) - 150);
                    }
                    classes += ' leftSide';
                } else if (direction === 'right') {
                    $popups = $('.tableDonePopup.rightSide');
                    if ($popups.length !== 0) {
                        $popupWrap = $popups.parent();
                        $popupWrap.append($tableDonePopup);
                        popupWrapExists = true;
                    } else {
                        right = 15;
                        top = Math.max(200, ($(window).height() / 2) - 150);
                        arrow = 'rightArrow';
                    }
                    classes += ' rightSide';
                } else {
                    $popups = $('.tableDonePopup.worksheetNotify' + direction);
                    if ($popups.length !== 0) {
                        $popupWrap = $popups.parent();
                        $popupWrap.prepend($tableDonePopup);
                        popupWrapExists = true;
                    } else {
                        popupNearTab = $('#worksheetTab-' + direction);
                        popupBottom = true;
                    }
                    classes += ' worksheetNotify';
                    classes += ' worksheetNotify' + direction;
                }
            }
        }

        if (popupNeeded) {
            $tableDonePopup.addClass(arrow + ' ' + classes);

            if (!popupWrapExists) {
                if (popupNearTab) {
                    left = popupNearTab.offset().left +
                       popupNearTab.outerWidth() + 6;
                    top = 4;
                }

                if (popupBottom) {
                    bottom = 3;
                    top = 'auto';
                }
                var $popupWrap = $('<div class="tableDonePopupWrap"></div>');
                $popupWrap.css({
                    top: top,
                    bottom: bottom,
                    left: left,
                    right: right
                });
                $('body').append($popupWrap);
                $popupWrap.append($tableDonePopup);
            }

            setTimeout(function() {
                $tableDonePopup.fadeIn(200, function() {
                    var displayTime = 2500;
                    if (failed) {
                        displayTime = 4000;
                    }
                    setTimeout(function() {
                        // $tableDonePopup.fadeOut(200, function(){
                        //     if ($tableDonePopup.siblings().length === 0) {
                        //         $tableDonePopup.parent().remove();
                        //     } else {
                        //         $tableDonePopup.remove();
                        //     }                           
                        // });
                    }, displayTime);
                });
            }, 400);
        }
        
        delete msgObjs[msgId];
    }
    
    return (self);
})();


function isTableVisible(tableName) {
    var wsNum = WSManager.getWSFromTable(tableName);
    var activeWS = WSManager.getActiveWS();

    if (wsNum !== activeWS) {
        return (wsNum);
    }

    var numTables = gTables.length;
    var tableNum = 0;
    for (var i = 0; i < numTables; i++) {
        if (gTables[i].tableName === tableName) {
            tableNum = i;
            break;
        }
    }
    var $table = $('#xcTable' + tableNum);
    var rect = $table[0].getBoundingClientRect();
    var windowWidth = $(window).width() - $('#rightSideBar').offset().left - 10;
    var position;
    if (rect.left < 40) {
        // console.log('here')
        if (rect.right > 40) {
            position = 'visible';
        } else {
            position = 'left';
        }
    } else if (rect.left > windowWidth) {
        position = 'right';
    } else {
        // console.log('ah', rect.left)
        position = 'visible';
    }

    return (position);
}