// Lookup table that translates between tablename and the indices that it should
// be holding

var gTableIndicesLookup = {};
var gTableDirectionLookup = {};
var gWorksheets = [];
var gTableOrderLookup = [];

// data set folder structure
var gDSObjFolder = {};

function emptyAllStorage(localEmpty) {
    var deferred = jQuery.Deferred();

    gTableIndicesLookup = {};
    gTableDirectionLookup = {};
    gWorksheets = [];
    gTableOrderLookup = [];
    gDSObjFolder = {};
    Cli.clear();
    $("#scratchPadSection textarea").val("");

    if (localEmpty) {
        deferred.resolve();
    } else {
        KVStore.delete(KVStore.gStorageKey)
        .then(function() {
            return (KVStore.delete(KVStore.gLogKey));
        })
        .then(deferred.resolve)
        .fail(deferred.reject);
    }

    return (deferred.promise());
}

function getIndex(tName) {
    if (!gTableIndicesLookup) {
        console.log("Nothing has ever been stored ever!");
        gTableIndicesLookup = {};
    }
    if (tName in gTableIndicesLookup) {
        return (gTableIndicesLookup[tName]['columns']);
    } else {
        console.log("No such table has been saved before");
        return (null);
    }
    return (null);
}

function getDirection(tName) {
    if (!gTableDirectionLookup) {
        console.log("Nothing has ever been stored ever!");
        gTableDirectionLookup = {};
    }
    if (tName in gTableDirectionLookup) {
        return (gTableDirectionLookup[tName]);
    } else {
        console.log("No such table has been saved before");
        return (null);
    }
    return (null);
}

function setIndex(tName, index, dsName, tableProperties) {
    gTableIndicesLookup[tName] = {};
    gTableIndicesLookup[tName]['columns'] = index;
    gTableIndicesLookup[tName]['active'] = true;
    gTableIndicesLookup[tName]['timeStamp'] = (new Date()).getTime();
    if (dsName) {
        gTableIndicesLookup[tName]['datasetName'] = dsName;
        gTableIndicesLookup[tName]['isTable'] = false;
    } else {
        gTableIndicesLookup[tName]['isTable'] = true;
    }

    if (tableProperties) {
        gTableIndicesLookup[tName]['bookmarks'] = tableProperties.bookmarks;
        gTableIndicesLookup[tName]['rowHeights'] = tableProperties.rowHeights;
        
    } else {
        gTableIndicesLookup[tName]['bookmarks'] = [];
        gTableIndicesLookup[tName]['rowHeights'] = {};
    }
}

function setDirection(tName, order) {
    gTableDirectionLookup[tName] = order;
}

function commitToStorage(atStartup) {
    var deferred = jQuery.Deferred();
    var scratchPadText = $("#scratchPadSection textarea").val();

    setTableOrder(atStartup);
    // bacis thing to store
    storage = {"TILookup": gTableIndicesLookup,
                "TDLookup": gTableDirectionLookup,
                "gWorksheets": gWorksheets,
                "TOLookup": gTableOrderLookup,
                "gDSObj": gDSObjFolder,
                "holdStatus": KVStore.isHold(),
                "cli": Cli.get(),
                "scratchPad": scratchPadText
            };

    KVStore.put(KVStore.gStorageKey, JSON.stringify(storage), false)
    .then(function() {
        console.log("commitToStorage done!");
        deferred.resolve();
    })
    .fail(function(error) {
        console.log("commitToStorage fails!");
        deferred.reject(error);
    });

    return (deferred.promise());
}

function readFromStorage() {
    var deferred = jQuery.Deferred();

    KVStore.hold()
    .then(function(gInfos) {
        if (gInfos) {
            if (gInfos["TILookup"]) {
                gTableIndicesLookup = gInfos["TILookup"];
            }
            if (gInfos["TDLookup"]) {
                gTableDirectionLookup = gInfos["TDLookup"];
            }
            if (gInfos["gWorksheets"]) {
                gWorksheets = gInfos["gWorksheets"];
            }
            if (gInfos["TOLookup"]) {
                gTableOrderLookup = gInfos["TOLookup"];
            }
            if (gInfos["gDSObj"]) {
                gDSObjFolder = gInfos["gDSObj"];
            }
            if (gInfos["cli"]) {
                Cli.restore(gInfos["cli"]);
            }
            if (gInfos["scratchPad"]) {
                $("#scratchPadSection textarea").val(gInfos["scratchPad"]);
            }
        } else {
            emptyAllStorage(true);
        }

        return (XcalarGetDatasets());
    })
    .then(function(datasets) {
        var numDatasets = datasets.numDatasets;
        // clear KVStore if no datasets are loaded
        if (numDatasets == 0 || numDatasets == null) {
            gTableIndicesLookup = {};
            gTableDirectionLookup = {};
            gWorksheets = [];
            gTableOrderLookup = [];
        }
        DSObj.restore(datasets);
        DataStore.updateInfo(numDatasets);
        return (commitToStorage(AfterStartup.After));
    })
    .then(function() {
        deferred.resolve();
    })
    .fail(function(error) {
        console.log("readFromStorage fails!");
        deferred.reject(error);
    });

    return (deferred.promise());
}

function getWorksheet(index) {
    if (!gWorksheets) {
        console.log("Nothing has ever been stored ever!");
        gWorksheets = [];
    }
    if (gWorksheets.length <= index) {
        console.log("No such index");
        return (null);
    }
    return (gWorksheets[index]);
}
  
function setWorksheet(index, workSheetOpt) {
    if (!gWorksheets[index]) {
        gWorksheets[index] = {};
    }
    for (key in workSheetOpt) {
        gWorksheets[index][key] = workSheetOpt[key];
    }
}

// function removeWorksheet(index) {
//     gWorksheets.splice(index-2, 1);
// }

function setTableOrder(atStartup) {
    if (atStartup) {
        return;
    }
    gTableOrderLookup = [];
    for (var i = 0; i < gTables.length; i++) {
        gTableOrderLookup.push(gTables[i].frontTableName);
    }
}

window.KVStore = (function() {
    var self = {};
    var isHold = false;

    var username = sessionStorage.getItem("xcalar-username");
    if (username) {
        self.gStorageKey = generateKey(username, "gInfo");
        self.gLogKey = generateKey(username, "gLog");
    } else {
        self.gStorageKey = generateKey(hostname, portNumber, "gInfo");
        self.gLogKey = generateKey(hostname, portNumber, "gLog");
    }
    console.log("You are assigned keys", self.gStorageKey, self.gLogKey);

    self.get = function(key) {
        var deferred = jQuery.Deferred();
        XcalarKeyLookup(key)
        .then(function(value) {
            if (value != null && value.value != null) {
                try {
                    value = JSON.parse(value.value);
                    console.log("Parsed result", value);
                    deferred.resolve(value);
                } catch(err) {
                    console.log(err, value);
                    self.delete(key);
                    self.log(err.message);
                    deferred.resolve(null);
                }
            } else {
                deferred.resolve(null);
            }
        })
        .fail(function(error) {
            console.log("Get from KV Store fails!");
            deferred.reject(error);
        });

        return (deferred.promise());
    }

    self.put = function(key, value, persist) {
        var deferred = jQuery.Deferred();
        XcalarKeyPut(key, value, persist)
        .then(function() {
            deferred.resolve();
        })
        .fail(function(error) {
            console.log("Put to KV Store fails!");
            deferred.reject(error);
        });

        return (deferred.promise());
    }

    self.delete = function(key, value) {
        var deferred = jQuery.Deferred();
        XcalarKeyDelete(key)
        .then(function() {
            console.log("Delete in KV Store succeed!");
            deferred.resolve();
        })
        .fail(function(error) {
            console.log("Delete in KV Store fails!");
            deferred.reject(error);
        });

        return (deferred.promise());
    }

    self.hold = function() {
        var deferred = jQuery.Deferred();
        self.get(self.gStorageKey)
        .then(function(gInfos) {
            if (!gInfos) {
                console.log("KVStore is empty!");
                isHold = true;
                deferred.resolve(null);
            } else {
                if (gInfos["holdStatus"] === true && 
                    sessionStorage.getItem(self.gStorageKey) !== "hold") {
                    Alert.error("Signed on elsewhere!",
                                "Please close your other session.",
                                true);
                    deferred.reject("Already in use!");
                } else {
                    if (gInfos["holdStatus"] === true) {
                        console.error("KVStore not release last time...");
                    }
                    isHold = true;
                    sessionStorage.setItem(self.gStorageKey, "hold");
                    deferred.resolve(gInfos);
                }
            }
        })
        .fail(deferred.reject);

        return (deferred.promise());
    }

    self.release = function() {
        if (!isHold) {
            return (promiseWrapper(null));
        }
        isHold = false;

        return (commitToStorage());
    }

    // XXX in case you are hold forever
    self.forceRelease = function() {
        isHold = false;
        XcalarKeyLookup(self.gStorageKey)
        .then(function(output) {
            if (output) {
                var gInfos = JSON.parse(output.value);
                gInfos["holdStatus"] = false;
                XcalarKeyPut(self.gStorageKey, JSON.stringify(gInfos), false);
            }
        });
    }

    self.isHold = function() {
        return (isHold);
    }

    self.log = function(error) {
        var log = {};
        log.error = error;
        self.put(self.gLogKey, JSON.stringify(log));
    }

    function generateKey() {
        // currently just cat all arguments as a key
        var key;
        for (var i = 0; i < arguments.length; i ++) {
            if (arguments[i]) {
                if (!key) {
                    key = arguments[i];
                } else {
                    key += "-" + arguments[i];
                }
            }
        }
        return (key);
    }

    return (self);
}());
