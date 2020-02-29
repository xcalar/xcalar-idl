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

var schema = require("./xcalar/compute/localtypes/Schema_pb");


////////////////////////////////////////////////////////////////////////////////
// Constructors
////////////////////////////////////////////////////////////////////////////////

function DiscoverSchemasService(client) {
    this.client = client;
}

////////////////////////////////////////////////////////////////////////////////
// Definitions
////////////////////////////////////////////////////////////////////////////////

DiscoverSchemasService.prototype = {
    discoverSchemas: async function(listObjectSchemaRequest) {
        // XXX we want to use Any.pack() here, but it is only available
        // in protobuf 3.2
        // https://github.com/google/protobuf/issues/2612#issuecomment-274567411
        var anyWrapper = new proto.google.protobuf.Any();
        anyWrapper.setValue(listObjectSchemaRequest.serializeBinary());
        anyWrapper.setTypeUrl("type.googleapis.com/xcalar.compute.localtypes.Schema.ListObjectSchemaRequest");
        //anyWrapper.pack(listObjectSchemaRequest.serializeBinary(), "ListObjectSchemaRequest");

        try {
            var responseData = await this.client.execute("DiscoverSchemas", "DiscoverSchemas", anyWrapper);
            var specificBytes = responseData.getValue();
            // XXX Any.unpack() is only available in protobuf 3.2; see above
            //var listObjectSchemaResponse =
            //    responseData.unpack(schema.ListObjectSchemaResponse.deserializeBinary,
            //                        "ListObjectSchemaResponse");
            var listObjectSchemaResponse = schema.ListObjectSchemaResponse.deserializeBinary(specificBytes);
            return listObjectSchemaResponse;
        } catch(error) {
            if (error.response != null) {
                const specificBytes = error.response.getValue();
                error.response = schema.ListObjectSchemaResponse.deserializeBinary(specificBytes);
            }
            throw error;
        }
    },
};

exports.DiscoverSchemasService = DiscoverSchemasService;