// JavaScript Document
// Menu Bar JS
var selectedTab = 1;
var numTabs = 3;
var tableRowIndex = 1;
var currentPageNumber = 0;
var numEntriesPerPage = 12;
var tableName = "";
var resultSetId = 0;

function setTabs() {
    var i;
    for (i = 1; i<=numTabs; i++) {
        dataSourceMouseOver(i);
    }
    dataSourceClick(1);
}

function loadMainContent(op) {
    if (window.location.pathname.search("cat_table.html") > -1) {
        freeAllResultSets();
    }
    $("#leftFrame").load('/'+op.concat('_l.html'));
    $("#mainFrame").load('/'+op.concat('_r.html'));
}

function dataSourceMouseOver(tabNumber) {
    var left = "tab" + tabNumber + "l";
    var center = "tab" + tabNumber + "c";
    var right = "tab" + tabNumber + "r";
  
    var vanishRight = "tab" + (tabNumber+1) + "l";
    var vanishLeft = "tab" + (tabNumber-1) + "r";
  
    if (tabNumber != 1) {
        if (tabNumber-1 == selectedTab) {
            document.getElementById(left).src = "/images/white_m.png";
        } else {
            document.getElementById(vanishLeft).src = "/images/light_m.png";
            document.getElementById(left).src = "/images/light_l.png";
        }
    }
    document.getElementById(center).style.backgroundImage =
        "url('/images/light_m.png')";
    if (tabNumber != numTabs) {
        if (tabNumber+1 == selectedTab) {
            document.getElementById(right).src = "/images/white_m.png";
        } else {
            document.getElementById(vanishRight).src = "/images/light_m.png";
            document.getElementById(right).src = "/images/light_r.png";
        }
    } else {
        document.getElementById(right).src = "/images/light_r.png";
    }
}

function dataSourceMouseOut(tabNumber) {
    var left = "tab" + tabNumber + "l";
    var center = "tab" + tabNumber + "c";
    var right = "tab" + tabNumber + "r";
  
    var vanishRight = "tab" + (tabNumber+1) + "l";
    var vanishLeft = "tab" + (tabNumber-1) + "r";
  
    if (tabNumber != 1) {
        document.getElementById(left).src = "/images/dark_m.png";
        if (tabNumber-1 != selectedTab) {
            document.getElementById(left).src = "/images/dark_m.png";
            document.getElementById(vanishLeft).src = "/images/dark_r.png";
        } else {
            document.getElementById(left).src = "/images/white_m.png";
            document.getElementById(vanishLeft).src = "/images/white_r.png";
        }
    }
    document.getElementById(center).style.backgroundImage =
        "url('/images/dark_m.png')";
    document.getElementById(right).src = "/images/dark_r.png";
    if (tabNumber != numTabs) {
        if (tabNumber+1 != selectedTab) {
            document.getElementById(right).src = "/images/dark_m.png";
            document.getElementById(vanishRight).src = "/images/dark_r.png";
        } else {
            document.getElementById(right).src = "/images/white_m.png";
            document.getElementById(vanishRight).src = "/images/white_l.png";
        }
    }
}

function dataSourceClick(tabNumber) {
    selectedTab = tabNumber;
    var left = "tab" + tabNumber + "l";
    var center = "tab" + tabNumber + "c";
    var right = "tab" + tabNumber + "r";
  
    var vanishRight = "tab" + (tabNumber+1) + "l";
    var vanishLeft = "tab" + (tabNumber-1) + "r";
  
    if (tabNumber != 1) {
        document.getElementById(left).src = "/images/white_l.png";
        document.getElementById(vanishLeft).src = "/images/white_m.png";
    }
  
    document.getElementById(center).style.backgroundImage =
        "url('/images/white_m.png')";
    document.getElementById(right).src = "/images/white_r.png";
    if (tabNumber != numTabs) {
        document.getElementById(vanishRight).src = "/images/white_m.png";
    }
  
    // Disable onmouseout
    document.getElementById(center).onmouseout = function() {null};
    document.getElementById(center).onmouseover = function() {null};
  
    // Enable mouseover and mouseout for other elements
    var index;
    for (index = 1; index <= numTabs; index++) {
        if (index != tabNumber) {
            var tabName = "tab" + index + "c";
            var func1 = "dataSourceMouseOver(" + index + ");";
            var func2 = "dataSourceMouseOut(" + index + ");";
            document.getElementById(tabName).onmouseover = new Function(func1);
            document.getElementById(tabName).onmouseout = new Function(func2);
            document.getElementById(tabName).onmouseout();
        }
    }
}

function generateTabs() {
    var i;
    document.write('<td class="dataSourceMenu" id="tab1c"\
    onMouseOver="dataSourceMouseOver(1);"\
    onMouseOut="dataSourceMouseOut(1);"\
    onClick="dataSourceClick(1);">\
    &nbsp;&nbsp;DataSource-1&nbsp;&nbsp;\
    </td>\
    <td class="dataSourceMenu">\
      <img src="/images/dark_l.png" height="25px" id="tab2l">\
    </td>');
    for (i = 2; i<=numTabs; i++) {
        document.write('\
          <td class="dataSourceMenu">\
            <img src="/images/dark_r.png" height="25px" id="tab'+(i-1)+'r">\
          </td>\
          <td class="dataSourceMenu" id="tab'+i+'c"\
            onMouseOver="dataSourceMouseOver('+i+');"\
            onMouseOut="dataSourceMouseOut('+i+');"\
            onClick="dataSourceClick('+i+');">\
            &nbsp;&nbsp;DataSource-'+i+'&nbsp;&nbsp;\
          </td>');
          if (i < numTabs) {
           document.write('<td class="dataSourceMenu">\
                            <img src="/images/dark_l.png" height="25px"\
                            id="tab'+(i+1)+'l">\
                            </td>');
          } else {
              document.write('<td class="dataSourceMenu">\
                                   <img src="/images/dark_r.png" height="25px"\
                                     id="tab'+i+'r">\
                             </td>');
          }
    }
    document.write('<td id="addTabButton">\
                        <a href="javascript:addTab();">\
                            <img src="/images/add-data-grey.png"\
                                 alt="Add Data Source" width="33" height="16"\
                                 style="position: relative; top: -2px;"\
                                 id="Image7">\
                        </a>\
                    </td>\
                   ');
}

function addTab() {
    var lastTabR = document.getElementById("tab"+numTabs+"r");
    lastTabR.setAttribute("src","/images/dark_l.png");
    numTabs++;
    lastTabR.setAttribute("id", ("tab"+numTabs+"l"));
    $("#addTabButton").remove();
    $("#tabsArea tr").append('\
        <td class="dataSourceMenu">\
            <img src="/images/dark_r.png" height="25px"\
                 id="tab'+(numTabs-1)+'r">\
        </td>\
        <td class="dataSourceMenu" id="tab'+numTabs+'c"\
            onMouseOver="dataSourceMouseOver('+numTabs+');"\
            onMouseOut="dataSourceMouseOut('+numTabs+');"\
            onClick="dataSourceClick('+numTabs+');">\
            &nbsp;&nbsp;DataSource-'+numTabs+'&nbsp;&nbsp;\
        </td>\
        <td class="dataSourceMenu">\
            <img src="/images/dark_r.png" height="25px" id="tab'+numTabs+'r">\
        </td>\
    ');
    for (var i = 1; i<=numTabs; i++) {
        if (i != selectedTab) {
            dataSourceMouseOver(i);
            dataSourceMouseOut(i);
        }
    }
    $("#tabsArea tr").append('\
        <td id="addTabButton">\
            <a href="javascript:addTab();" class="addTabBg">\
                <img src="/images/add-data-grey.png"\
                    alt="Add Data Source" width="33" height="16" id="Image7">\
            </a>\
        </td>\
    ');
}

function generateBar(width, text, page) {
    document.write('<td width="' + width + 
                    '" height="40" align="center" class="menu helvetica_grey"\
                    bgcolor="#e77e23" onClick="loadMainContent(\'' + page +
                    '\');">\
                    <a class="menuItems" onClick="loadMainContent(\'' + page +
                    '\')">'+ text + '</a></td>');
}

function deselectPage(pageNumber) {
    $("a.pageTurnerPageNumber").filter(function() {
        return $(this).text() == pageNumber.toString();
    }).parent().removeClass("pageTurnerPageSelected");
} 

function selectPage(pageNumber) {
    $("a.pageTurnerPageNumber").filter(function() {
        return $(this).text() == pageNumber.toString();
    }).parent().addClass("pageTurnerPageSelected");
} 

function goToPrevPage() {
    console.log(currentPageNumber);
    if (currentPageNumber == 1) {
        console.log("First page, cannot move");
        return;
    }
    var currentPage = currentPageNumber;
    var prevPage = currentPage-1;
    var prevPageElement = $("a.pageTurnerPageNumber").filter(function() {
        return $(this).text() == prevPage.toString();
    });
    if (prevPageElement.length) {
        selectPage(prevPage);
        deselectPage(currentPage);
        getPrevPage(resultSetId);
    } else {
        goToPage(prevPage-1);
    }
}

function goToNextPage() {
    // XXX: TODO: Check whether we are already at the max
    var currentPage = currentPageNumber;
    var nextPage = currentPage+1;

    var nextPageElement = $("a.pageTurnerPageNumber").filter(function() {
        return $(this).text() == nextPage.toString();
    });
    if (nextPageElement.length) {
        selectPage(nextPage);
        deselectPage(currentPage);
        getNextPage(resultSetId);
    } else {
        goToPage(nextPage-1);
    }
}

function goToPage(pageNumber) {
    deselectPage(currentPageNumber);
    currentPageNumber = pageNumber+1;
    var startNumber = pageNumber-5;
    if (startNumber < 0) {
        startNumber = 0;
    }
    generatePages(10, startNumber, true); 
    selectPage(pageNumber+1);
    XcalarSetAbsolute(resultSetId, (currentPageNumber-1)*numEntriesPerPage);
    getPage(resultSetId);
}

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?')
                 + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function generatePages(number, startNumber, rightDots) {
    var htmlString = '\
          <table class="noBorderTable" id="pageTurnerNumberBarInner">\
            <tr>\
              <td class="pageTurnerLeftSpacer"></td>\
              <td class="pageTurnerWrap">\
              <table class="pageTurnerWrap noBorderTable">\
              <tr>\
              <td class="pageTurner" id="pageTurnerLeft">\
                  <a href="javascript:goToPrevPage();" class="pageTurner">\
                  < Prev</a>\
              </td>';
    if (startNumber > 0) {
        // There are previous pages
        htmlString += '\
              <td class="pageTurner"\
               id="leftDots"><a href="javascript:goToPage(';
        htmlString += (startNumber-5);
        htmlString += ');" class="pageTurner">...</a></td>';
    }
    var i;
    for (i = 0; i<number; i++) {
        htmlString += '\
              <td class="pageTurnerPage">\
                  <a href="javascript:goToPage(';
        htmlString += (i+startNumber);
        htmlString += ');" class="pageTurnerPageNumber">';
        htmlString += (i+1+startNumber);
        htmlString += '</a>\
              </td>';
    }
    
    if (rightDots) {
        // There are next pages
        htmlString += '\
              <td id="rightDots" class="pageTurner">\
                <a href="javascript:goToPage(';
        htmlString += (startNumber+number+5);
        htmlString += ');" class="pageTurner">...</a></td>';
    }

    htmlString += '\
              <td id="pageTurnerRight">\
              <a href="javascript:goToNextPage();" class="pageTurner">\
              Next ></a>\
              </td>\
              </tr>\
              </table>\
              </td>\
              <td class="spaceFiller pageTurnerRightSpacer"></td>\
            </tr>\
          </table>\
          ';
    $("#pageTurnerNumberBar").html(htmlString);
}

function resetAutoIndex() {
    tableRowIndex = 1;
}

function getNextPage(resultSetId) {
    if (resultSetId == 0) {
        return;
    }
    currentPageNumber++;
    getPage(resultSetId);
}

function getPrevPage(resultSetId) {
    if (resultSetId == 0) {
        return;
        // Reached the end
    }
                  
    if (currentPageNumber == 1) {
        console.log("At first page already");
    } else {
        currentPageNumber--;
        XcalarSetAbsolute(resultSetId,
                          (currentPageNumber-1)*numEntriesPerPage);
    }
    getPage(resultSetId);
}

function getPage(resultSetId) {
    if (resultSetId == 0) {
        return;
        // Reached the end
    }
    var indices = [];
    var headingsArray = convertColNamesToArray();

    if (headingsArray != null && headingsArray.length > 3) {
        var numRemoved = 0;
        for (var i = 1; i<headingsArray.length; i++) {
            if (headingsArray[i] !== "JSON" &&
                headingsArray[i] !== "Key") {
                console.log("deleted: "+headingsArray[i]);
                var indName = {index: i,
                               name: headingsArray[i],
                               width: $("#headCol"+(i+1-numRemoved)).width()};
                delCol("closeButton"+(i+1-numRemoved), false);
                numRemoved++;
                indices.push(indName);
            }
        }
    }
    $("#autoGenTable").find("tr:gt(0)").remove();
    var tableOfEntries = XcalarGetNextPage(resultSetId,
                                           numEntriesPerPage);
    if (tableOfEntries.numRecords < numEntriesPerPage) {
        // This is the last iteration
        // Time to free the handle
        // XXX: Function call to free handle?
        resultSetId = 0;
    }
    var indexNumber = (currentPageNumber-1) * numEntriesPerPage;
    for (var i = 0; i<Math.min(numEntriesPerPage, 
          tableOfEntries.numRecords); i++) {
        var key = tableOfEntries.records[i].key;
        var value = tableOfEntries.records[i].value;
        generateRowWithAutoIndex2(key, value, indexNumber+i+1);
    }

    for (var i = 0; i<indices.length; i++) {
        addCol("headCol"+(indices[i].index), indices[i].name, null, indices[i].width);
        pullCol(indices[i].name, 1+indices[i].index);
    }
}

function generateNewTableHeading() {
    // this function doesn't appear to be used anywhere
    console.log('generateNewTableHeading()');
    $("#autoGenTable").append('\
      <tr>\
        <td width="3%" height="17" class="table_title_bg" id="headCol1">\
          <strong>ID</strong>\
        </td>\
        <td width="auto" height="17" class="table_title_bg" id="headCol2">\
          <strong>Key</strong>\
        </td>\
        <td width="auto" height="17" class="table_title_bg" id="headCol3">\
          <strong>JSON</strong>\
        </td>\
      </tr>\
    ');
}

function generateRowWithAutoIndex(text, hoverable) {
    var URIEncoded = encodeURIComponent(text);
    console.log(URIEncoded);
    if (hoverable) {
        var clickable = 'class="mousePointer"';
    } 
    else { 
        var clickable = "";
    }
    $("#autoGenTable tr:last").after('<tr><td height="17" align="center"'+
        'bgcolor="#FFFFFF" class="monacotype" id="bodyr'+
        tableRowIndex+"c1"+'" onmouseover="javascript: console.log(this.id)">'+
        tableRowIndex+'</td>'+
        '<td height="17" bgcolor="#FFFFFF" class="monacotype" id="bodyr'+
        tableRowIndex+"c2"+'" onmouseover="javascript: console.log(this.id)"'+
        ' onclick="javascript: window.location.href=\'cat_table.html?'+
        'tablename='+
        URIEncoded+'\'">'+
        '<div class="cellRelative"><span '+clickable+'>'+text+'</span>'+
        '<div class="dropdownContainer"></div>'+
        '</div></td></tr>');
    tableRowIndex++;
}

function generateRowWithAutoIndex2(text1, text2, idNo) {
    // text1 is an int since it's the key
    $("#autoGenTable tr:last").after('<tr>'+
        '<td height="17" align="center"'+
        'bgcolor="#FFFFFF" class="monacotype" id="bodyr'+
        idNo+"c1"+'">'
        +idNo+'</td>'+
        '<td height="17" bgcolor="#FFFFFF" class="monacotype" id="bodyr'+
        idNo+"c2"+'">'+
        text1+'</td>'+
        '<td height="17" bgcolor="#FFFFFF" class="monacotype" id="bodyr'+
        idNo+"c3"+'">'+
        '<div class="elementText">'+
        text2+'</div></td>'+
        '</tr>');
}

function delCol(id, resize) {
    // console.log('delCol()');
    rescolDelWidth(id, resize);
    var numCol = $("#autoGenTable").find("tr:first td").length;
    var colid = parseInt(id.substring(11));
    $("#headCol"+colid).remove();
    console.log($("#headCol"+colid).html());
    for (var i = colid+1; i<=numCol; i++) {
        $("#headCol"+i).attr("id", "headCol"+(i-1));
        $("#closeButton"+i).attr("id", "closeButton"+(i-1));
        $("#addLCol"+i).attr("id", "addLCol"+(i-1));
        $("#addRCol"+i).attr("id", "addRCol"+(i-1));
        $("#rename"+i).attr("id", "rename"+(i-1));
        $("label[for='rename"+i+"']").attr("for", "rename"+(i-1));
    }
 
    var numRow = $("#autoGenTable tr").length;
    var idOfFirstRow = $("#autoGenTable tr:eq(1) td:first").attr("id").
                       substring(5);
    idOfFirstRow = idOfFirstRow.substring(0, idOfFirstRow.indexOf("c"));
    var startingIndex = parseInt(idOfFirstRow);

    for (var i = startingIndex; i<startingIndex+numRow-1; i++) {
        $("#bodyr"+i+"c"+colid).remove();
        for (var j = colid+1; j<=numCol; j++) {
            $("#bodyr"+i+"c"+j).attr("id", "bodyr"+i+"c"+(j-1));
        }
    }
}

function pullCol(key, newColid) {
    var colid = $("#autoGenTable tr:first-child td:contains('JSON')").filter(
        function() {
            return $(this).text().indexOf("JSON") != -1;
    }).attr("id");
    colid = colid.substring(7);
    var numRow = $("#autoGenTable tr").length;
    var idOfFirstRow = $("#autoGenTable tr:eq(1) td:first").attr("id").
                       substring(5);
    idOfFirstRow = idOfFirstRow.substring(0, idOfFirstRow.indexOf("c"));
    var startingIndex = parseInt(idOfFirstRow);
 
    for (var i =  startingIndex; i<numRow+startingIndex-1; i++) {
        var jsonStr = $("#bodyr"+i+"c"+colid).text();
        var value = jQuery.parseJSON(jsonStr);

        var nested = key.split(".");
        for (var j = 0; j<nested.length; j++) {
            value = value[nested[j]];
            // console.log(value);
        }    

        value = '<div class="addedBarText">'+value+"</div>"
        $("#bodyr"+i+"c"+newColid).html(value);
    }    
}

function addCol(id, name, direction, width) {
    // console.log('addCol()');
    var numCol = $("#autoGenTable").find("tr:first td").length;
    var colid = parseInt(id.substring(7));
    var resize = false;
    if (direction == "L") {
        var newColid = colid;
    } else {
        var newColid = colid+1;
    }
    if (name == null) {
        var name = "New Heading";
        var width = 144;
        var resize = true;
    }

    for (var i = numCol; i>=newColid; i--) {
        $("#headCol"+i).attr("id", "headCol"+(i+1));
        $("#closeButton"+i).attr("id", "closeButton"+(i+1));
        $("#addRCol"+i).attr("id", "addRCol"+(i+1));
        $("#addLCol"+i).attr("id", "addLCol"+(i+1));
        $("#rename"+i).attr("id", "rename"+(i+1));
        $("label[for='rename"+i+"']").attr("for", "rename"+(i+1));
    }        
    
    var columnHeadTd = '<td class="table_title_bg editableCol'+
        '" id="headCol'+
        newColid+
        '" style="height:17px; width:'+(width+6)+'px;">'+
        '<div class="dropdownContainer"></div>'+
        '<strong><input type="text" id="rename'+newColid+'" '+
        'class="editableHead" '+
        'value="'+name+'"/></strong>'+
        '</td>';
    if (newColid > 1) {
        $("#headCol"+(newColid-1)).after(columnHeadTd); 
    } else {
        $("#headCol"+(newColid+1)).before(columnHeadTd);
    }

    var dropDownHTML = '<ul class="colMenu">'+
            '<li class="addCol">'+
                'Add a column'+
                '<div class="rightArrow"></div>'+
                '<ul class="subColMenu">'+
                    '<li class="addColumns" id="addLCol'+
                    newColid+'">On the left</li>'+
                    '<li class="addColumns" id="addRCol'+
                    newColid+'">On the right</li>'+
                '</ul>'+ 
            '</li>'+
            '<li class="deleteColumn" onclick="delCol(this.id);" '+
            'id="closeButton'+newColid+'">Delete the column</li>'+
            '<li>Duplicate the column</li>'+
            '<label for="rename'+newColid+'">'+
            '<li>Rename the column</li>'+
            '</label>'+
        '</ul>';

    $('#headCol'+newColid).append(dropDownHTML);

    $('#headCol'+newColid+' .editableHead').mousedown(function(event){
        event.stopPropagation();
    });
    
    $('#headCol'+newColid+' .addColumns').click(function(){
        console.log('addColumns clicked');
        var id = $(this).attr('id');
        var direction = id.substring(3,4);
        $(this).closest('.colMenu').hide();
        addCol(id, null, direction);
    });

    $('#headCol'+newColid+' .dropdownContainer').click(function(){
        $('.colMenu').hide();
        $(this).siblings('.colMenu').show();
    });

    $('#headCol'+newColid+' .subColMenu li').mouseenter(function(){
        $('.subColMenu li').addClass('subColUnselected');
        $(this).addClass('subColSelected');
        $(this).parent().parent().addClass('subSelected');
    }).mouseleave(function(){
        $('.subColMenu li').removeClass('subColUnselected');
        $(this).removeClass('subColSelected');
        $(this).parent().parent().removeClass('subSelected');
    });

    if (resize) {
        $('#rename'+newColid).select();
    }
    
    $('label[for="rename'+newColid+'"]').click(
        function(){
            $('#rename'+newColid).select();
        }
    );

    var numRow = $("#autoGenTable tr").length;

    var idOfFirstRow = $("#autoGenTable tr:eq(1) td:first").attr("id").
                       substring(5);
    idOfFirstRow = idOfFirstRow.substring(0, idOfFirstRow.indexOf("c"));
    var startingIndex = parseInt(idOfFirstRow);
    for (var i = startingIndex; i<startingIndex+numRow-1; i++) {
        for (var j = numCol; j>=newColid; j--) {
            $("#bodyr"+i+"c"+j).attr("id", "bodyr"+i+"c"+(j+1));
            // every column after the new column gets id shifted +1;
        }
        var newCellHTML = '<td height="17" bgcolor="#FFFFFF"'+
            'class="monacotype" id="bodyr'+i+"c"+(newColid)+
            '"'+
            '>&nbsp;</td>';
        if (newColid > 1) {
            $("#bodyr"+i+"c"+(newColid-1)).after(newCellHTML);
        } else {
            $("#bodyr"+i+"c"+(newColid+1)).before(newCellHTML);
        }
    }
    $("#headCol"+newColid).click(function() {
        $(this).select();
    });
    $("#headCol"+newColid+" .editableHead").keypress(function(e) {
      if (e.which==13) {
        var thisId = parseInt($(this).closest('.table_title_bg').
                     attr('id').substring(7));
        pullCol($(this).val(), thisId);
        $(this).blur();
      }
    });
    resizableColumns(resize);
}

function prelimFunctions() {
    setTabs();
    selectPage(1);
}

function getSearchBarText() {
    var tName = $("#searchBar").text();
    alert(tName);
}

function convertColNamesToArray() {
    var head = $("#autoGenTable tr:first-child td strong");
    var numCol = head.length;
    var headings = [];
    for (var i = 0; i<numCol; i++) {
        headings.push($.trim(head.eq(i).text()));
        if (headings[i] == "") {
            headings.pop();
            headings.push($.trim(head.eq(i).children('input').val()));
        }
    }
    return headings;
}

// rescol is used to store resizableColumns() variables across function calls
var rescol = {
    first: true,
    grabbed: false,
    mouseStart: 0,     
    cellMinWidth: 40,
    newCellWidth: 150,
    padding: function(){return (parseInt($('.resizable td:first').css('padding-left')) * 2)}
};

function rescolMouseDown(el, event){
    event.preventDefault();
    rescol.grabbed = true;
    rescol.mouseStart = event.clientX;
    rescol.grabbedCell = el.parent();  // the td 
    rescol.startWidth = rescol.grabbedCell.width(); 
    rescol.nextCell = rescol.grabbedCell.next();  // the next td
    rescol.nextCellWidth = rescol.nextCell.width();

    if (rescol.startWidth < rescol.cellMinWidth) {
        rescol.tempCellMinWidth = rescol.startWidth;
    } else {
        rescol.tempCellMinWidth = rescol.cellMinWidth;
    }
    rescol.rightDragMax = rescol.nextCellWidth - rescol.tempCellMinWidth;
    rescol.leftDragMax =  rescol.tempCellMinWidth - rescol.startWidth;

    disableTextSelection();
    var style = '<style id="e-resizeCursor" type="text/css">*'+ 
        '{cursor: e-resize !important;}</style>';
    $(document.head).append(style);
}

function resizableColumns(resize) {
    console.log('resizableColumns');
    $('.resizable tr:first td').css('position','relative');

    $('.resizable tr:first td').each(
        function() {
            if (!$(this).children().hasClass('resizeCursor') && !$(this).is(':last-child')
                 &&!$(this).is(':first-child')) {
                $(this).prepend('<div class="resizeCursor"></div>');
                var tdId = $(this).attr('id');

                $('#'+tdId+' .resizeCursor').mousedown(
                    function(event) {
                        rescolMouseDown($(this), event);
                    }
                );
            }
        }
    );

    $('.resizeCursor').height($('.resizable').height());

    if (rescol.first) {
        $('.resizable tr:first td').each(
            function() {
                    var initialWidth = $(this).width();
                    $(this).width(initialWidth);
                    $(this).removeAttr('width');
            } 
        );
        $('.resizable').css('table-layout','fixed');
        rescol.first = false;
    } 

    if (resize) {
        var largestCell;
        var largestCellWidth = 0;
        $('.resizable tr:first td').each(
            function(){
                if ($(this).width() > largestCellWidth) {
                    largestCell = $(this);
                    largestCellWidth = $(this).width();
                }
            }
        );
        var newLargeWidth = largestCellWidth - rescol.newCellWidth;
        largestCell.width(newLargeWidth);
    } 
}

$(document).ready(function(){
    $(document).mouseup(function(event){
        if (rescol.grabbed) {
            rescol.grabbed = false;
            $('#e-resizeCursor').remove();
            reenableTextSelection() 
        }
    });

    $(document).mousemove(function(event){
        if (rescol.grabbed) {
            var dragDist = (event.clientX - rescol.mouseStart);
            if ( dragDist > rescol.leftDragMax && dragDist < rescol.rightDragMax ) {
                rescol.grabbedCell.width(rescol.startWidth + dragDist);
                rescol.nextCell.width(rescol.nextCellWidth - dragDist);
            } else if ( dragDist < rescol.leftDragMax ) {
                // set grabbed cell to min width if mouse quickly moves to the left
                rescol.grabbedCell.width(rescol.tempCellMinWidth);
                rescol.nextCell.width(rescol.nextCellWidth + (rescol.startWidth 
                - rescol.tempCellMinWidth));
            } 
        }
    });

    $('.addColumns').click(function() {
        var id = $(this).attr('id');
        var direction = id.substring(3,4);
        $(this).closest('.colMenu').hide();
        addCol(id, null, direction);
    });

    $('.dropdownContainer').click(function() {
        $('.colMenu').hide();
        $(this).siblings('.colMenu').show();

    });

    $('.subColMenu li').mouseenter(function(){
        $('.subColMenu li').addClass('subColUnselected');
        $(this).addClass('subColSelected');
        $(this).parent().parent().addClass('subSelected');
    }).mouseleave(function(){
        $('.subColMenu li').removeClass('subColUnselected');
        $(this).removeClass('subColSelected');
        $(this).parent().parent().removeClass('subSelected');
    });
});

$(document).click(function(event) {
    if (!$(event.target).is('.dropdownContainer, .addCol')) {
            $('.colMenu').hide();
    } 
});


function rescolDelWidth(id, resize) {
    // console.log('rescolDelWidth()');
    var id = parseInt(id.substring(11));
    var delTd = $('.resizable tr:first td').eq(id-1)
    var delTdWidth = delTd.width();
    var padding = parseInt(delTd.css('padding-left')) * 2;
    if (resize == false) {
        var tableWidth = $('.resizable').width();
        $('.resizable').width(tableWidth - delTdWidth - padding - 2);
    }
    else {
        var adjustedTd = $('.resizable tr:first td').eq(id);
        if (adjustedTd.length < 1) {
            adjustedTd = $('.resizable tr:first td').eq(id-2);
            adjustedTd.children('.resizeCursor').remove();
        }
        var adjustedTdWidth = adjustedTd.width();
        adjustedTd.width(adjustedTdWidth+delTdWidth+padding+2);
    }
}


function disableTextSelection() {
    var style = '<style id="disableSelection" type="text/css">*'+ 
        '{ -ms-user-select:none;-moz-user-select:-moz-none;-khtml-user-select:none;'+
        '-webkit-user-select:none;user-select:none; }</style>';
    $(document.head).append(style);
    $('input').prop('disabled', true);
}

function reenableTextSelection() {
  $('#disableSelection').remove();
  $('input').prop('disabled', false);
}
