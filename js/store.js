// Lookup table that translates between tablename and the indices that it should
// be holding

var gTableIndicesLookup = {};
var gTableDirectionLookup = {};
var gWorksheetName = [];
var gTableOrderLookup = [];

// data set folder structure
var gDSObjFolder = {};

function emptyAllStorage() {
    return (KVStore.delete(KVStore.gStorageKey));
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

function setIndex(tName, index) {
    gTableIndicesLookup[tName] = {};
    gTableIndicesLookup[tName]['columns'] = index;
    gTableIndicesLookup[tName]['active'] = true;
    gTableIndicesLookup[tName]['timeStamp'] = (new Date()).getTime();
}

function setDirection(tName, order) {
    gTableDirectionLookup[tName] = order;
}

function commitToStorage(atStartup) {
    setTableOrder(atStartup);
    var deferred = jQuery.Deferred();

    storage = {"TILookup": gTableIndicesLookup,
                "TDLookup": gTableDirectionLookup,
                "WSName": gWorksheetName,
                "TOLookup": gTableOrderLookup,
                "gDSObj": gDSObjFolder,
                "holdStatus": KVStore.isHold()};

    KVStore.put(KVStore.gStorageKey, JSON.stringify(storage))
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
            if (gInfos["WSName"]) {
                gWorksheetName = gInfos["WSName"];
            }
            if (gInfos["TOLookup"]) {
                gTableOrderLookup = gInfos["TOLookup"];
            }
            if (gInfos["gDSObj"]) {
                gDSObjFolder = gInfos["gDSObj"];
            }
        } else {
            gTableIndicesLookup = {};
            gTableDirectionLookup = {};
            gWorksheetName = [];
            gTableOrderLookup = [];
            gDSObjFolder = {};
        }

        return (XcalarGetDatasets());
    })
    .then(function(datasets) {
        var numDatasets = datasets.numDatasets;
        // clear KVStore if no datasets are loaded
        if (numDatasets == 0 || numDatasets == null) {
            // emptyAllStorage();
            gTableIndicesLookup = {};
            gTableDirectionLookup = {};
            gWorksheetName = [];
            gTableOrderLookup = [];
        }
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
    if (!gWorksheetName) {
        console.log("Nothing has ever been stored ever!");
        gWorksheetName = [];
    }
    if (gWorksheetName.length <= index) {
        console.log("No such index");
        return (null);
    }
    return (gWorksheetName[index]);
}
  
function setWorksheetName(index, name) {
    console.log(arguments, 'setWorksheetName');
    gWorksheetName[index] = name;
}

function removeWorksheetName(index) {
    gWorksheetName.splice(index-2, 1);
}

function setTableOrder(atStartup) {
    if (atStartup) {
        return;
    }
    var tables = [];
    for (var i = 0; i < gTables.length; i++) {
        tables.push(gTables[i].frontTableName);
    }
    gTableOrderLookup = tables;
}

var KVStore = (function() {
    var self = {};
    var isHold = false;

    self.gStorageKey = generateKey(hostname, portNumber, "gInfo");

    self.get = function(key) {
        var deferred = jQuery.Deferred();
        XcalarKeyLookup(key)
        .then(function(value) {
            console.log(JSON.parse(value.value));
            deferred.resolve(value);
        })
        .fail(function(error) {
            console.log("Get from KV Store fails!");
            deferred.reject(error);
        });

        return (deferred.promise());
    }

    self.put = function(key, value) {
        var deferred = jQuery.Deferred();
        XcalarKeyPut(key, value)
        .then(function() {
            console.log("Put to KV Store succeed!");
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
        XcalarKeyLookup(self.gStorageKey)
        .then(function(output) {
            if (!output) {
                console.log("KVStore is empty!");
                isHold = true;
                deferred.resolve(null);
            } else {
                var gInfos = JSON.parse(output.value);
                if (gInfos["holdStatus"] === true) {
                    Alert.error("Already in use!",
                                "Sorry, someone are using it.",
                                true);
                    deferred.reject("Already in use!");
                } else {
                    isHold = true;
                    deferred.resolve(gInfos);
                }
            }
        })
        .fail(function(error) {
            deferred.reject(error);
        });

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
        return (commitToStorage());
    }

    self.isHold = function() {
        return (isHold);
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
