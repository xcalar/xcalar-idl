describe('TblAnim', function() {
    var testDs;
    var tableName;
    var prefix;
    var tableId;
    var $table;
    var tableName2;
    var prefix2;

    before(function(done) {
        UnitTest.onMinMode();
        var testDSObj = testDatasets.fakeYelp;
        UnitTest.addAll(testDSObj, "unitTestFakeYelp")
        .then(function(ds, tName, tPrefix) {
            testDs = ds;
            tableName = tName;
            prefix = tPrefix;
           
            $('.xcTableWrap').each(function() {
                if ($(this).find('.tableName').val().indexOf(testDs) > -1) {
                    tableId = $(this).find('.hashName').text().slice(1);
                    $table = $(this).find('.dataTable');
                    return false;
                }
            });

            done();
        });
    });

    describe('column resize for worksheet table', function() {
        var $el;
        var $th;
        var startWidth;
        var startX = 0;

        before(function() {
            $el = $table.find('.colGrab').eq(0);
            $th = $el.closest('th');
            startWidth = $th.outerWidth();
            startX = 0;
        });

        it('startColResize should work', function() {
            expect(gMouseStatus).to.be.null;
            expect(startWidth).to.be.gt(50);

            var e = $.Event('mousedown', {pageX: startX});
            TblAnim.startColResize($el, e);

            expect(gMouseStatus).to.equal("checkingResizeCol");
            expect(gRescol.index).to.equal(1);
            expect(gRescol.startWidth).to.equal(startWidth);
            expect(gRescol.newWidth).to.equal(startWidth);
            expect($('#resizeCursor').length).to.equal(0);
        });

        // xx need to test on hidden col
        it('checkColResize should work', function() {
            expect(gMouseStatus).to.equal("checkingResizeCol");
            expect($table.hasClass('resizingCol')).to.be.false;

            var newX = 1;
            var e = $.Event('mousemove', {pageX: newX});
            TblAnim.__testOnly__.checkColResize(e);

            expect(gMouseStatus).to.equal("checkingResizeCol");
            expect($table.hasClass('resizingCol')).to.be.false;
            expect($('#resizeCursor').length).to.equal(0);

            newX = 5;
            e = $.Event('mousemove', {pageX: newX});
          
            TblAnim.__testOnly__.checkColResize(e);

            expect(gMouseStatus).to.equal('resizingCol');
            expect($table.hasClass('resizingCol')).to.be.true;
            expect($('#resizeCursor').length).to.equal(1);
        });

        it('onColResize should work', function() {
            expect($th.outerWidth()).to.equal(gRescol.newWidth);

            // moving mouse all the way to left edge of cell
            // should hit a minimum width
            var newX = -startWidth;
            var e = $.Event('mousemove', {pageX: newX});
            TblAnim.__testOnly__.onColResize(e);

            expect(gMouseStatus).to.equal('resizingCol');
            expect(gRescol.cellMinWidth).to.equal(15);
            expect($th.outerWidth()).to.equal(gRescol.cellMinWidth);
           
            // increasing width by 10px
            newX = 10;
            var e = $.Event('mousemove', {pageX: newX});
            TblAnim.__testOnly__.onColResize(e);
            expect($th.outerWidth()).to.equal(startWidth + newX);
        });

        it('endColResize should work', function() {
            expect(gMouseStatus).to.equal('resizingCol');
            expect($('#resizeCursor').length).to.equal(1);

            TblAnim.__testOnly__.endColResize();

            expect(gMouseStatus).to.be.null;
            var table = gTables[gRescol.tableId];
            var progCol = table.tableCols[gRescol.index - 1];
            expect(progCol.isHidden).to.be.false;
            expect(progCol.width).to.equal(startWidth + 10);
            // based on onColResize width
            expect($th.outerWidth()).to.equal(startWidth + 10);
            expect($('#resizeCursor').length).to.equal(0);
        });
    });

    describe('test TblAnim.resizeColumn', function() {
        it('TblAnim.resizeColumn should work', function() {
            var $th = $table.find('th.col1');
            var initialWidth = $th.outerWidth();
            TblAnim.resizeColumn(tableId, 1, initialWidth, 90, false);
            expect($th.outerWidth()).to.equal(90);

            var table = gTables[tableId];
            var progCol = table.tableCols[0];
            expect(progCol.sizedToHeader).to.be.false;
        });
    });

    describe('column resize for datastore table', function() {
        var $el;
        var $th;
        var startWidth;
        var startX = 0;
        var initialTableWrapWidth;

        before(function() {
            $el = $('#dsTable').find('.colGrab').eq(0);
            $th = $el.closest('th');
            startWidth = $th.outerWidth();
            startX = 0;
            initialTableWrapWidth = $('#dsTableWrap').width();
        });

        it('startColResize should work', function() {
            expect(gMouseStatus).to.be.null;
            expect(startWidth).to.be.gt(50);
            expect(gRescol.isDatastore).to.not.be.true;

            var e = $.Event('mousedown', {pageX: startX});
            e.pageX = startX;
            TblAnim.startColResize($el, e, {target: "datastore"});

            expect(gRescol.isDatastore).to.be.true;
            expect(gRescol.$tableWrap.length).to.equal(1);
            expect(gRescol.$dsTable.length).to.equal(1);
            expect(gRescol.$previewTable.length).to.equal(1);
        });

        // xx need to test on hidden col
        it('checkColResize should work', function() {
            expect(gMouseStatus).to.equal("checkingResizeCol");
            expect($('#dsTable').hasClass('resizingCol')).to.be.false;

            var newX = 5;
            e = $.Event('mousemove', {pageX: newX});
          
            TblAnim.__testOnly__.checkColResize(e);

            expect(gMouseStatus).to.equal('resizingCol');
            expect($('#dsTable').hasClass('resizingCol')).to.be.true;
            expect($('#resizeCursor').length).to.equal(1);
        });

        it('onColResize should work', function() {
             
            expect($th.outerWidth()).to.equal(gRescol.newWidth);
           
            // increasing width by 10px
            var newX = 10;
            var e = $.Event('mousemove', {pageX: newX});
            TblAnim.__testOnly__.onColResize(e);

            expect($th.outerWidth()).to.equal(startWidth + newX);
        });

        it('endColResize should work', function() {
            expect(gMouseStatus).to.equal('resizingCol');
            expect($('#resizeCursor').length).to.equal(1);

            TblAnim.__testOnly__.endColResize();

            expect(gMouseStatus).to.be.null;
            expect(gRescol.isDatastore).to.be.false;
            // based on onColResize width
            expect($th.outerWidth()).to.equal(startWidth + 10);
            expect($('#resizeCursor').length).to.equal(0);
        });
    });

    describe('Row resize', function() {
        var $el;
        var $td;
        var startHeight;
        var startY = 0;
        var rowInfo;

        before(function() {
            $el = $table.find('.rowGrab').eq(1);
            $td = $el.closest('tr').prev().find('td').eq(0);
            $tr = $el.closest('tr').prev();
            startHeight = $td.outerHeight();
            startY = 0;
            rowInfo = TblAnim.__testOnly__.rowInfo;
        });

        it('startRowResize should work', function() {
            expect(gMouseStatus).to.be.null;
            expect(startHeight).to.equal(25);

            var e = $.Event('mousedown', {pageY: startY});
           
            TblAnim.startRowResize($el, e);

            expect(gMouseStatus).to.equal("checkingRowMove");
            expect(rowInfo.startHeight).to.equal(startHeight);
            expect($('#rowResizeCursor').length).to.equal(0);
            expect($tr.find('td > div').eq(0).css('max-height')).to.equal("none");
            expect($tr.find('td > div').eq(1).css('max-height')).to.equal("none");
        });

        it('checkRowResize should work', function() {
            expect(gMouseStatus).to.equal("checkingRowMove");

            var newY = 0;
            var e = $.Event('mousemove', {pageY: newY});
            TblAnim.__testOnly__.checkRowResize(e);

            expect(gMouseStatus).to.equal("checkingRowMove");
            expect($('#rowResizeCursor').length).to.equal(0);
            expect($tr.find('td > div').eq(0).css('max-height')).to.equal("none");
            expect($tr.find('td > div').eq(1).css('max-height')).to.equal("none");

            newY = 5;
            e = $.Event('mousemove', {pageY: newY});
          
            TblAnim.__testOnly__.checkRowResize(e);

            expect(gMouseStatus).to.equal('rowMove');
            expect($('#rowResizeCursor').length).to.equal(1);
            expect($tr.find('td > div').eq(0).css('max-height')).to.equal("25px");
            expect($tr.find('td > div').eq(1).css('max-height')).to.equal("21px");
            expect($tr.outerHeight()).to.equal(25);
        });

        it('onRowResize should work', function() {
            expect($td.outerHeight()).to.equal(rowInfo.startHeight);

            // moving mouse all the way to upper edge of cell
            // should hit a minimum height
            var newY = -startHeight;
            var e = $.Event('mousemove', {pageY: newY});
            TblAnim.__testOnly__.onRowResize(e);

            expect(gMouseStatus).to.equal('rowMove');
            expect(gRescol.minCellHeight).to.equal(25);
            expect($tr.outerHeight()).to.equal(gRescol.minCellHeight);
           
            // increasing height by 10px
            newY = 10;
            var e = $.Event('mousemove', {pageY: newY});
            TblAnim.__testOnly__.onRowResize(e);
            expect($tr.outerHeight()).to.equal(startHeight + newY);
            expect($tr.find('td > div').eq(0).css('max-height')).to.equal("35px");
            expect($tr.find('td > div').eq(1).css('max-height')).to.equal("31px");
        });

        it('endRowResize should work', function() {
            expect(gMouseStatus).to.equal('rowMove');
            expect($('#rowResizeCursor').length).to.equal(1);

            TblAnim.__testOnly__.endRowResize();

            expect(gMouseStatus).to.be.null;
            var table = gTables[tableId];
            var rowObj = table.rowHeights;
            expect(rowObj[0]).to.be.an('object');
            expect(rowObj[1]).to.be.undefined;
            expect(rowObj[0][1]).to.equal(35);
            expect(rowObj[0][2]).to.undefined;

            expect($tr.hasClass('changedHeight')).to.be.true;
            
            // based on onRowResize height
            expect($tr.outerHeight()).to.equal(35);
            expect($('#rowResizeCursor').length).to.equal(0);
        });
    });

    describe('test TblAnim.resizeRow', function() {
        it('TblAnim.resizeRow should work', function() {
            var $tr = $table.find('tbody tr').eq(0);
            var initialHeight = $tr.outerHeight();

            TblAnim.resizeRow(0, tableId, initialHeight, 90);

            expect($tr.outerHeight()).to.equal(90);
            expect($tr.find('td > div').eq(0).css('max-height')).to.equal("90px");
            expect($tr.find('td > div').eq(1).css('max-height')).to.equal("86px");

            var table = gTables[tableId];
            var rowObj = table.rowHeights;
            expect(rowObj[0]).to.be.an('object');
            expect(rowObj[0][1]).to.equal(90);
            expect($tr.outerHeight()).to.equal(90);
            expect($('#rowResizeCursor').length).to.equal(0);
            expect($tr.hasClass('changedHeight')).to.be.true;

            // resize to below minimum height
            // 
            TblAnim.resizeRow(0, tableId, 90, 10);
            expect($tr.outerHeight()).to.equal(25);
            expect($tr.find('td > div').eq(0).css('max-height')).to.equal("25px");
            expect($tr.find('td > div').eq(1).css('max-height')).to.equal("21px");

            var table = gTables[tableId];
            var rowObj = table.rowHeights;
            expect(rowObj[0]).to.be.undefined;
            expect($tr.hasClass('changedHeight')).to.be.false;
        });
    });

    describe('column drag', function() {
        var $el;
        var $th;
        var startWidth;
        var startX = 0;
        var dragInfo;

        before(function() {
            $el = $table.find('.col1');
            $th = $el;
            startWidth = $th.outerWidth();
            startX = 0;
            dragInfo = TblAnim.__testOnly__.dragInfo;
        });

        it('startColDrag should work', function() {
            expect(gMouseStatus).to.be.null;
            expect(startWidth).to.be.gt(50);

            var e = $.Event('mousedown', {pageX: startX});
            TblAnim.startColDrag($el, e);

            expect(gMouseStatus).to.equal("checkingMovingCol");
            expect($('#moveCursor').length).to.equal(1);
        });

        it('checkColDrag should work', function() {
            // should not trigger move
            var newX = 1;
            var e = $.Event('mousemove', {pageX: newX});
            TblAnim.__testOnly__.checkColDrag(e);
            expect(gMouseStatus).to.equal("checkingMovingCol");

            newX = 5;
            var e = $.Event('mousemove', {pageX: newX});
            TblAnim.__testOnly__.checkColDrag(e);
            expect(gMouseStatus).to.equal("dragging");
            var numCols = gTables[tableId].tableCols.length;
            expect(numCols).to.be.gt(5);
            expect($("#fauxCol").length).to.equal(1);
            expect($("#shadowDiv").length).to.equal(1);
            expect($(".dropTarget").length).to.equal(numCols - 1);
        });

        it('onColDrag should work', function() {
            newX = 10;
            var e = $.Event('mousemove', {pageX: newX});
            TblAnim.__testOnly__.onColDrag(e);

            expect(dragInfo.pageX).to.equal(newX);
            expect(dragInfo.fauxCol.css('left')).to.equal("10px");
        });

        it('dragdropSwapColumns should work', function() {
            var swap = TblAnim.__testOnly__.dragdropSwapColumns;
            var $dropTarget = $('.dropTarget').eq(0);
            expect(dragInfo.colIndex).to.equal(1);

            swap($dropTarget);
            expect(dragInfo.colIndex).to.equal(2);

            swap($dropTarget);
            expect(dragInfo.colIndex).to.equal(1);
        });


        it('endColDrag should work', function() {
            expect(gMouseStatus).to.equal("dragging");
            TblAnim.__testOnly__.endColDrag();
            expect(gMouseStatus).to.be.null;
            expect($("#fauxCol").length).to.equal(0);
            expect($("#shadowDiv").length).to.equal(0);
            expect($(".dropTarget").length).to.equal(0);
            expect($('#moveCursor').length).to.equal(0);
        });
    });

  

    after(function(done) {

        UnitTest.deleteAll(tableName, testDs)
        .always(function() {
            UnitTest.offMinMode();
            done();
        });
    });
});