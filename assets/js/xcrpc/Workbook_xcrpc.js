// **********************************************************************
// *** DO NOT EDIT!  This file was autogenerated by xcrpc             ***
// **********************************************************************
// Copyright 2018 Xcalar, Inc. All rights reserved.
//
// No use, or distribution, of this source code is permitted in any form or
// means without a valid, written license agreement with Xcalar, Inc.
// Please refer to the included "COPYING" file for terms and conditions
// regarding the use and redistribution of this software.
//

var jQuery;
// Explicitly check if this code is running under nodejs
if ((typeof process !== 'undefined') &&
    (typeof process.versions !== 'undefined') &&
    (typeof process.versions.node !== 'undefined')) {
    const jsdom = require("jsdom");
    const { JSDOM } = jsdom;
    const { window } = new JSDOM();
    jQuery = require("jquery")(window);
} else {
    jQuery = require('jquery');
};
var client = require("./Client");
var service = require('./xcalar/compute/localtypes/Service_pb');

var workbook = require("./xcalar/compute/localtypes/Workbook_pb");


////////////////////////////////////////////////////////////////////////////////
// Constructors
////////////////////////////////////////////////////////////////////////////////

function WorkbookService(client) {
    this.client = client;
}

////////////////////////////////////////////////////////////////////////////////
// Definitions
////////////////////////////////////////////////////////////////////////////////

WorkbookService.prototype = {
    convertKvsToQuery: function(convertKvsToQueryRequest) {
        var deferred = jQuery.Deferred();
        // XXX we want to use Any.pack() here, but it is only available
        // in protobuf 3.2
        // https://github.com/google/protobuf/issues/2612#issuecomment-274567411
        var anyWrapper = new proto.google.protobuf.Any();
        anyWrapper.setValue(convertKvsToQueryRequest.serializeBinary());
        anyWrapper.setTypeUrl("type.googleapis.com/xcalar.compute.localtypes.Workbook.ConvertKvsToQueryRequest");
        //anyWrapper.pack(convertKvsToQueryRequest.serializeBinary(), "ConvertKvsToQueryRequest");

        var response = this.client.execute("Workbook", "ConvertKvsToQuery", anyWrapper)
        .then(function(responseData) {
            var specificBytes = responseData.getValue();
            // XXX Any.unpack() is only available in protobuf 3.2; see above
            //var convertKvsToQueryResponse =
            //    responseData.unpack(workbook.ConvertKvsToQueryResponse.deserializeBinary,
            //                        "ConvertKvsToQueryResponse");
            var convertKvsToQueryResponse = workbook.ConvertKvsToQueryResponse.deserializeBinary(specificBytes);
            deferred.resolve(convertKvsToQueryResponse);
        })
        .fail(function(error) {
            console.log("convertKvsToQuery fail:" + JSON.stringify(error));
            deferred.reject(error);
        });
        return deferred.promise();
    },
};

exports.WorkbookService = WorkbookService;
