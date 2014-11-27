function menuAreaClose() {
    $("#menuArea").hide();
}

function menuBarArt() {
    var clickTarget = null;
    var clickTooFast = false;
    $("#menuBar div").on("click", function() {
        if (clickTooFast) {
            return;
        }
        clickTooFast = true;
        setTimeout(function() {clickTooFast = false}, 300);
        if (clickTarget == $(event.target).text()) {
            //if clicking on an already open menu, close it
            $("#menuBar div").removeClass("menuSelected");
            $('#mainFrame').height('calc(100% - 148px)');

            $("#menuArea").height(0);
            clickTarget = null;
            $('.trueTHead').css('top',111).addClass('moveTop');
            setTimeout(function() {
                $('.trueTHead').removeClass('moveTop');
                $('.colGrab').height($('#mainFrame').height());
            },300);
            return;
        }
        clickTarget = $(event.target).text();

        $('.trueTHead').css('top',177).addClass('moveTop');

        setTimeout(function() {
            $('.trueTHead').removeClass('moveTop');
            $('.colGrab').height($('#mainFrame').height());
        },300);

        $("#menuBar div").removeClass("menuSelected");
        $(this).addClass("menuSelected");
        $("#menuArea").show().height(66);
        $('#mainFrame').height('calc(100% - 214px)');
        

        switch ($(this).text()) {
        case ("datastore"):
            $("#datastorePanel").show();
            $("#datastorePanel").siblings().each(function() {
                $(this).hide();
            }); 
            break;
        case ("monitor"):
            resetLoadArea();
            $("#monitorPanel").show();
            $("#monitorPanel").siblings().each(function() {
                $(this).hide();
            }); 
            break;
        case ("tablestore"):
            resetLoadArea();
            $("#tablestorePanel").show();
            $("#tablestorePanel").siblings().each(function() {
                $(this).hide();
            }); 
            break;
        default:
            console.log($(this.text()+" is not implemented!"));
            break;
        }
    });
}

function resetLoadArea() {
    $('#loadArea').html("").css('z-index', 'auto');
    $('#datastorePanel').width('100%');
    $('.datasetWrap').removeClass('shiftRight');
}

function monitorOverlayPercent() {
    $(".monitor").each(function() {
        var widthOfText = $(this).find("span").width();
        var amountToMove = -($(this).width()-widthOfText)/2-widthOfText/2-25;
        $(this).css("margin-right", amountToMove);
    });
    $(".datasetName").each(function() {
        var widthOfText = $(this).find("span").width();
        var amountToMove = -($(this).width()-widthOfText)/2-widthOfText/2-35;
        $(this).css("margin-right", amountToMove);
    });
}

function getTablesAndDatasets() {
    var tables = XcalarGetTables();
    var numTables = tables.numTables;
    var i;
    $(".datasetWrap").empty(); // Otherwise multiple calls will append the
    // same DS over and over again.
    for (i = 0; i<numTables; i++) {

        var tableDisplay = '<div class="menuAreaItem">'+
                               '<span class="menuAreaLabel monitorSmall">'+
                               'DATA<br>SET</span>'+
                               '<span class="menuAreaValue">'+
                                    tables.tables[i].tableName+
                               '</span>'+
                            '</div>';

        $("#tablestorePanel div:last").after(tableDisplay);
    }

    var datasets = XcalarGetDatasets();
    var numDatasets = datasets.numDatasets;
    for (i = 0; i<numDatasets; i++) {
        var dsName = getDsName(datasets.datasets[i].datasetId);
        var tableDisplay = '<div class="menuAreaItem">'+
                                '<span class="menuAreaLabel monitorSmall">'+
                                    'DATA<br>SET</span>'+
                                '<span class="menuAreaValue">'+
                                    dsName+
                                '</span>'+
                            '</div>';
        $(".datasetWrap").append(tableDisplay);
    };
    monitorOverlayPercent();
}
