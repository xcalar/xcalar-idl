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

var client = require("./Client");
var service = require('./xcalar/compute/localtypes/Service_pb');

var stats = require("./xcalar/compute/localtypes/Stats_pb");


////////////////////////////////////////////////////////////////////////////////
// Constructors
////////////////////////////////////////////////////////////////////////////////

function StatsService(client) {
    this.client = client;
}

////////////////////////////////////////////////////////////////////////////////
// Definitions
////////////////////////////////////////////////////////////////////////////////

StatsService.prototype = {
    getStats: async function(getStatsRequest) {
        // XXX we want to use Any.pack() here, but it is only available
        // in protobuf 3.2
        // https://github.com/google/protobuf/issues/2612#issuecomment-274567411
        var anyWrapper = new proto.google.protobuf.Any();
        anyWrapper.setValue(getStatsRequest.serializeBinary());
        anyWrapper.setTypeUrl("type.googleapis.com/xcalar.compute.localtypes.Stats.GetStatsRequest");
        //anyWrapper.pack(getStatsRequest.serializeBinary(), "GetStatsRequest");

        var responseData = await this.client.execute("Stats", "GetStats", anyWrapper);
        var specificBytes = responseData.getValue();
        // XXX Any.unpack() is only available in protobuf 3.2; see above
        //var getStatsResponse =
        //    responseData.unpack(stats.GetStatsResponse.deserializeBinary,
        //                        "GetStatsResponse");
        var getStatsResponse = stats.GetStatsResponse.deserializeBinary(specificBytes);
        return getStatsResponse;
    },
};

exports.StatsService = StatsService;
