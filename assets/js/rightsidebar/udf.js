// this is a sub module of rightSideBar
window.UDF = (function($, UDF) {
    var $fnName;       // $("#udf-fnName");
    var $template;     // $("#udf-fnTemplate");
    var $downloadBtn;  // $("#udf-fnDownload");
    var $browserBtn;   // $("#udf-fileBrowser");
    var $filePath;     // $("#udf-filePath");
    var $listDropdown; // $("#udf-fnMenu");

    var editor;
    var storedUDF = {};

    // constant
    var udfDefault = "# PLEASE TAKE NOTE: \n" +
                    "# UDFs can only support\n" +
                    "# return values of type String\n\n";
    var defaultModule = "default";

    UDF.setup = function() {
        $fnName = $("#udf-fnName");
        $template = $("#udf-fnTemplate");
        $downloadBtn = $("#udf-fnDownload");
        $browserBtn = $("#udf-fileBrowser");
        $filePath = $("#udf-filePath");
        $listDropdown = $("#udf-fnMenu");

        setupUDF();
    };

    UDF.initialize = function() {
        initializeUDFList()
        .then(defaultUDFUpload);
        // Note that defaultUDFUpload() will append the default UDF
        // to udf list, so it should come after initializeUDFList();
    };

    UDF.clear = function() {
        // clear CodeMirror
        if (editor != null) {
            // Wrap in if because KVStore.restore may call UDF.clear()
            // and at that time editor has not setup yet.
            editor.setValue(udfDefault);
            editor.clearHistory();
        }
        storedUDF = {};
        $listDropdown.find('ul').empty()
                                .append('<li name="blank">Blank Function</li>');
    };

    UDF.getEditor = function() {
        return (editor);
    };

    UDF.getUDFs = function() {
        return (storedUDF);
    };

    // used in extManager.js
    UDF.storePython = function(moduleName, entireString) {
        if (storedUDF.hasOwnProperty(moduleName)) {
            // the case of overwrite a module
            $listDropdown.find('li').filter(function() {
                return $(this).text() === moduleName;
            }).remove();
        }

        var $blankFunc = $listDropdown.find('li[name=blank]');
        var li = '<li>' + moduleName + '</li>';
        $blankFunc.after(li);
        storedUDF[moduleName] = entireString;
    };

    function initializeUDFList() {
        var deferred = jQuery.Deferred();
        var $blankFunc = $listDropdown.find('li[name=blank]');
        var li;

        updateUDF()
        .always(function() {
            for (var udf in storedUDF) {
                li = '<li>' + udf + '</li>';
                $blankFunc.after(li);
            }

            deferred.resolve();
        });

        return deferred.promise();
    }

    function updateUDF() {
        var deferred = jQuery.Deferred();

        XcalarListXdfs("*", "User*")
        .then(function(listXdfsObj) {
            var len = listXdfsObj.numXdfs;
            var udfs = listXdfsObj.fnDescs;
            var moduleName;

            for (var i = 0; i < len; i++) {
                moduleName = udfs[i].fnName.split(":")[0];

                if (!storedUDF.hasOwnProperty(moduleName)) {
                    // this means modueName exists
                    // when user fetch this module,
                    // the entire string will cached here
                    storedUDF[moduleName] = null;
                }
            }

            deferred.resolve();
        })
        .fail(deferred.reject);

        return (deferred.promise());
    }

    function getEntireUDF(moduleName) {
        var deferred = jQuery.Deferred();

        if (!storedUDF.hasOwnProperty(moduleName)) {
            var error = "UDF: " + moduleName + " not exists";
            throw error;
        }

        var entireString = storedUDF[moduleName];
        if (entireString == null) {
            XcalarDownloadPython(moduleName)
            .then(deferred.resolve)
            .fail(deferred.reject);
        } else {
            deferred.resolve(entireString);
        }

        return (deferred.promise());
    }

    // setup UDF section
    function setupUDF() {
        var textArea = document.getElementById("udf-codeArea");

        editor = CodeMirror.fromTextArea(textArea, {
            "mode": {
                "name"                  : "python",
                "version"               : 3,
                "singleLineStringErrors": false
            },
            "lineNumbers"  : true,
            "indentUnit"   : 4,
            "matchBrackets": true
        });

        editor.setValue(udfDefault);
        var wasActive = $('#udfSection').hasClass('active');
        // panel needs to be active to set editor value to udf default
        $('#udfSection').addClass('active');
        editor.refresh();

        if (!wasActive) { // only remove active class if it didnt start active
            $('#udfSection').removeClass('active');
        }

        /* switch between UDF sections */
        var $sections = $("#udfSection .mainSection");
        xcHelper.raidoButtons($("#udf-tabs"), function(tabId) {
            $sections.addClass("hidden");
            $("#" + tabId).removeClass("hidden");

            if (tabId === "udf-fnSection") {
                editor.refresh();
            }
        });
        /* end of switch between UDF sections */

        /* upload file section */
        // browser file
        $("#udf-browseBtn").click(function() {
            $(this).blur();
            $browserBtn.click();
            return false;
        });
        // display the chosen file's path
        $browserBtn.change(function() {
            $filePath.val($(this).val().replace(/C:\\fakepath\\/i, ''));
        });
        // clear file path
        $("#udf-clearPath").click(function() {
            $browserBtn.val("");
            $filePath.val("");
            $filePath.focus();
        });
        // upload file
        $("#udf-fileUpload").click(function() {
            $(this).blur();
            var val  = $filePath.val().trim();
            var file = $browserBtn[0].files[0];
            var path;

            if (typeof file !== "object") {
                path = "";
            } else {
                path = file.name;
            }

            var moduleName = path.substring(0, path.indexOf("."));
            var $submitBtn = $(this);
            var options = {"offset": 190};

            if (val === "") {
                StatusBox.show(ErrTStr.NoEmpty, $filePath, true, options);
            } else if (path === "") {
                StatusBox.show(ErrTStr.InvalidFilePath, $filePath, true, options);
            } else if (moduleName.length >
                       XcalarApisConstantsT.XcalarApiMaxPyModuleNameLen) {
                StatusBox.show(ErrTStr.LongFileName, $filePath, true, options);
            } else {
                var reader = new FileReader();
                reader.onload = function(event) {
                    xcHelper.disableSubmit($submitBtn);
                    var entireString = event.target.result;

                    uploadUDF(moduleName, entireString)
                    .always(function() {
                        xcHelper.enableSubmit($submitBtn);
                    });
                };

                reader.readAsText(file);
            }
        });
        /* end of upload file section */

        /* function input section */
        var $dropDownList = $("#udf-fnList");

        xcHelper.dropdownList($dropDownList, {
            "onSelect": function($li) {
                $li.parent().find("li").removeClass("selected");
                $li.addClass("selected");
                var moduleName = $li.text();

                $template.val(moduleName);

                if ($li.attr("name") === "blank") {
                    $downloadBtn.addClass("disabled");
                    editor.setValue(udfDefault);
                } else {
                    $downloadBtn.removeClass("disabled");
                    getEntireUDF(moduleName)
                    .then(function(entireString) {
                        if (entireString == null) {
                            editor.setValue("#" + SideBarTStr.DownoladMsg);
                        } else {
                            editor.setValue(entireString);
                        }
                    })
                    .fail(function(error) {
                        editor.setValue("#" + error);
                    });
                }
            },
            "container"    : "#udfSection",
            "bounds"       : '#udfSection',
            "bottomPadding": 2
        });

        $downloadBtn.click(function() {
            $(this).blur();
            var moduleName = $template.val();

            if (moduleName === "") {
                // invalid case
                return;
            }
            downLoadUDF(moduleName);
        });
        /* end of function input section */

        /* upload written function section */
        $fnName.keypress(function(event) {
            if (event.which === keyCode.Enter) {
                $('#udf-fnUpload').click();
                $(this).blur();
            }
        });

        $("#udf-fnUpload").click(function() {
            $(this).blur();
            var fileName = $fnName.val();
            var options = {"offset": 50};
            if (fileName === "") {
                StatusBox.show(ErrTStr.NoEmpty, $fnName, true, options);
                return;
            } else if (fileName.length >
                XcalarApisConstantsT.XcalarApiMaxPyModuleNameLen) {
                StatusBox.show(ErrTStr.LongFileName, $fnName, true, options);
                return;
            }
            // Get code written and call thrift call to upload
            var entireString = editor.getValue();
            options = {
                "offset": 30,
                "side"  : "left"
            };
            if (entireString.trim() === "" ||
                entireString.trim() === udfDefault.trim())
            {
                StatusBox.show(ErrTStr.NoEmptyFn, $('.CodeMirror'), false,
                                options);
                return;
            } else if (entireString.trim().length >
                       XcalarApisConstantsT.XcalarApiMaxPyModuleSrcLen) {
                StatusBox.show(ErrTStr.LargeFile, $(".CodeMirror"), false,
                                options);
                return;
            }

            var moduleName;
            if (fileName.indexOf(".") >= 0) {
                moduleName = fileName.substring(0, fileName.indexOf("."));
            } else {
                moduleName = fileName;
            }

            uploadUDF(moduleName, entireString, true);
        });
        /* end of upload written function section */
    }

    function downLoadUDF(moduleName) {
        getEntireUDF(moduleName)
        .then(function(entireString) {
            if (entireString == null) {
                Alert.error(SideBarTStr.DownloadError, SideBarTStr.DownoladMsg);
                return;
            }

            // XXX FIXME fix it if you can find a way to download it as .py file
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' +
                                    encodeURIComponent(entireString));
            element.setAttribute('download', moduleName);
            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        })
        .fail(function(error) {
            Alert.error(SideBarTStr.DownloadError, error);
        });
    }

    function uploadUDF(moduleName, entireString, isFnInputSection) {
        moduleName = moduleName.toLowerCase();

        if (moduleName === defaultModule) {
            Alert.error(SideBarTStr.UploadError, SideBarTStr.OverwriteErr);
            return PromiseHelper.reject(SideBarTStr.OverwriteErr);
        }

        var deferred = jQuery.Deferred();

        if (storedUDF.hasOwnProperty(moduleName)) {
            var msg = xcHelper.replaceMsg(SideBarTStr.DupUDFMsg, {
                "module": moduleName
            });

            Alert.show({
                "title"         : SideBarTStr.DupUDF,
                "msg"           : msg,
                "isCheckBox"    : false,
                "confirm"       : function() { uploadHelper(); },
                "cancel"        : function() { deferred.resolve(); },
                "focusOnConfirm": true
            });
        } else {
            uploadHelper();
        }

        function uploadHelper() {
            var isIconBtn = true;
            var $fileUplodBtn = $("#udf-fileUpload");
            var $fnUpload = $("#udf-fnUpload");
            var hasToggleBtn = false;

            // if upload finish with in 1 second, do not toggle
            var timer = setTimeout(function() {
                hasToggleBtn = true;
                xcHelper.toggleBtnInProgress($fileUplodBtn, isIconBtn);
                xcHelper.toggleBtnInProgress($fnUpload, isIconBtn);
            }, 1000);

            XcalarUploadPython(moduleName, entireString)
            .then(function() {
                UDF.storePython(moduleName, entireString);
                KVStore.commit();
                uploadSuccess();

                // clearance
                if (isFnInputSection) {
                    $fnName.val("");
                    $template.val("");
                    $downloadBtn.addClass("disabled");
                } else {
                    $browserBtn.val("");
                    $filePath.val("");
                }

                DatastoreForm.update();
                deferred.resolve();
            })
            .fail(function(error) {
                var title = SideBarTStr.UploadError;
                if (error.status === StatusT.StatusPyExecFailedToCompile) {
                    // XXX might not actually be a syntax error
                    title = SideBarTStr.SyntaxError;
                }

                Alert.error(title, error);
                deferred.reject(error);
            })
            .always(function() {
                if (hasToggleBtn) {
                    // toggle back
                    xcHelper.toggleBtnInProgress($fileUplodBtn);
                    xcHelper.toggleBtnInProgress($fnUpload);
                } else {
                    clearTimeout(timer);
                }
            });
        }

        function uploadSuccess() {
            Alert.show({
                "title"  : SideBarTStr.UpoladUDF,
                "msg"    : SideBarTStr.UploadUDFMsg,
                "isAlert": true,
                "cancel" : function() {
                    $("#udfBtn").parent().click();
                }
            });
        }

        return deferred.promise();
    }

    function defaultUDFUpload() {
        var moduleName = defaultModule;
        var entireString =
        udfDefault +
        'import sys\n' +
        '# For 2.7\n' +
        'sys.path.append("/usr/local/lib/python2.7/dist-packages/apache_log_parser-1.6.1.dev-py2.7.egg")\n' +
        'sys.path.append("/usr/local/lib/python2.7/dist-packages/user_agents-0.3.2-py2.7.egg")\n' +
        'sys.path.append("/usr/local/lib/python2.7/dist-packages/ua_parser-0.3.6-py2.7.egg")\n' +
        'sys.path.append("/usr/lib/python2.7/")\n' +
        'sys.path.append("/usr/lib/python2.7/plat-x86_64-linux-gnu")\n' +
        'sys.path.append("/usr/lib/python2.7/lib-tk")\n' +
        'sys.path.append("/usr/lib/python2.7/lib-old")\n' +
        'sys.path.append("/usr/lib/python2.7/lib-dynload")\n' +
        'sys.path.append("/usr/local/lib/python2.7/dist-packages")\n' +
        'sys.path.append("/usr/lib/python2.7/dist-packages")\n' +
        'sys.path.append("/usr/lib/python2.7/dist-packages/PILcompat")\n' +
        'sys.path.append("/usr/lib/python2.7/dist-packages/gtk-2.0")\n' +
        'sys.path.append("/usr/lib/python2.7/dist-packages/ubuntu-sso-client")\n' +
        '\n' +
        'import xlrd\n' +
        'import datetime\n' +
        'import time\n' +
        'import pytz\n' +
        '\n' +
        "# %a    Locale's abbreviated weekday name.\n" +
        "# %A    Locale's full weekday name.\n" +
        "# %b    Locale's abbreviated month name.\n" +
        "# %B    Locale's full month name.\n" +
        "# %c    Locale's appropriate date and time representation.\n" +
        "# %d    Day of the month as a decimal number [01,31].\n" +
        "# %H    Hour (24-hour clock) as a decimal number [00,23].\n" +
        "# %I    Hour (12-hour clock) as a decimal number [01,12].\n" +
        "# %j    Day of the year as a decimal number [001,366].\n" +
        "# %m    Month as a decimal number [01,12].\n" +
        "# %M    Minute as a decimal number [00,59].\n" +
        "# %p    Locale's equivalent of either AM or PM. (1)\n" +
        "# %S    Second as a decimal number [00,61]. (2)\n" +
        "# %U    Week number of the year (Sunday as the first day of the week) as a decimal number [00,53]. All days in a new year preceding the first Sunday are considered to be in week 0.    (3)\n" +
        "# %w    Weekday as a decimal number [0(Sunday),6].\n" +
        "# %W    Week number of the year (Monday as the first day of the week) as a decimal number [00,53]. All days in a new year preceding the first Monday are considered to be in week 0.    (3)\n" +
        "# %x    Locale's appropriate date representation.\n" +
        "# %X    Locale's appropriate time representation.\n" +
        "# %y    Year without century as a decimal number [00,99].\n" +
        "# %Y    Year with century as a decimal number.\n" +
        "# %Z    Time zone name (no characters if no time zone exists).\n" +
        "# %%    A literal '%' character.\n" +
        '\n' +
        'def convertFormats(colName, inputFormat, outputFormat):\n' +
            '\ttimeStruct = time.strptime(colName, inputFormat)\n' +
            '\toutString = time.strftime(outputFormat, timeStruct)\n' +
            '\treturn outString\n' +
        '\n' +
        'def convertFromUnixTS(colName, outputFormat):\n' +
            '\treturn datetime.datetime.fromtimestamp(float(colName)).strftime(outputFormat)\n' +
        '\n' +
        'def convertToUnixTS(colName, inputFormat):\n' +
            '\treturn str(time.mktime(datetime.datetime.strptime(colName, inputFormat).timetuple()))\n' +
        '\n' +
        'def openExcel(stream, fullPath):\n' +
            '\tfileString = ""\n' +
            '\txl_workbook = xlrd.open_workbook(file_contents=stream)\n' +
            '\txl_sheet = xl_workbook.sheet_by_index(0)\n' +
            '\tnum_cols = xl_sheet.ncols   # Number of columns\n' +
            '\tfor row_idx in range(0, xl_sheet.nrows):    # Iterate through rows\n' +
                '\t\tcurRow = list()\n' +
                '\t\tfor col_idx in range(0, num_cols):  # Iterate through columns\n' +
                    '\t\t\tval = xl_sheet.cell_value(row_idx, col_idx)  # Get cell object by row, col\n' +
                    '\t\t\tif xl_sheet.cell_type(row_idx, col_idx) == xlrd.XL_CELL_DATE:\n' +
                        '\t\t\t\tval = "%s,%s" % (val, xl_workbook.datemode)\n' +
                    '\t\t\telse:\n' +
                        '\t\t\t\tval = "%s" % val\n' +
                    '\t\t\tcurRow.append(val)\n' +
                '\t\tfileString += "\\t".join(curRow)\n' +
                '\t\tfileString += "\\n"\n' +
            '\treturn str(fileString.encode("ascii", "ignore"))\n' +
        '\n' +
        'def convertExcelTime(colName, outputFormat):\n' +
            '\t(val, datemode) = colName.split(",")\n' +
            '\tif (not val or not datemode):\n' +
                '\t\treturn "Your input must be val,datemode"\n' +
            '\t(y, mon, d, h, m, s) = xlrd.xldate_as_tuple(float(val), int(datemode))\n' +
            '\treturn str(datetime.datetime(y, mon, d, h, m, s).strftime(outputFormat))\n' +
        '\n' +
        '# get the substring of txt after the (index)th delimiter\n' +
        '# for example, splitWithDelim("a-b-c", "-", 1) gives "b-c"\n' +
        '# and splitWithDelim("a-b-c", "-", 3) gives ""\n' +
        'def splitWithDelim(txt, index, delim):\n' +
            '\treturn delim.join(txt.split(delim)[index:])\n' +
        '\n' +
        '# get the current time\n' +
        'def now():\n' +
            '\treturn str(int(time.time()))\n' +
        '\n' +
        '# used for multijoin and multiGroupby\n' +
        'def multiJoin(*arg):\n' +
            '\tstri = ""\n' +
            '\tfor a in arg:\n' +
                '\t\tstri = stri + str(a) + ".Xc."\n' +
            '\treturn stri\n';

        XcalarUploadPython(moduleName, entireString)
        .then(function() {
            UDF.storePython(moduleName, entireString);
        })
        .fail(function(error) {
            console.error("upload default udf failed", error);
        });
    }

    return (UDF);
}(jQuery, {}));
