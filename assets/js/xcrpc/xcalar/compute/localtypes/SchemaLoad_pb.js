/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

goog.exportSymbol('proto.xcalar.compute.localtypes.SchemaLoad.AppRequest', null, global);
goog.exportSymbol('proto.xcalar.compute.localtypes.SchemaLoad.AppResponse', null, global);

/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.xcalar.compute.localtypes.SchemaLoad.AppRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.displayName = 'proto.xcalar.compute.localtypes.SchemaLoad.AppRequest';
}


if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.xcalar.compute.localtypes.SchemaLoad.AppRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    json: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.xcalar.compute.localtypes.SchemaLoad.AppRequest}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.xcalar.compute.localtypes.SchemaLoad.AppRequest;
  return proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.xcalar.compute.localtypes.SchemaLoad.AppRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.xcalar.compute.localtypes.SchemaLoad.AppRequest}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setJson(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.xcalar.compute.localtypes.SchemaLoad.AppRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getJson();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string json = 1;
 * @return {string}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.prototype.getJson = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.xcalar.compute.localtypes.SchemaLoad.AppRequest.prototype.setJson = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.xcalar.compute.localtypes.SchemaLoad.AppResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.displayName = 'proto.xcalar.compute.localtypes.SchemaLoad.AppResponse';
}


if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.xcalar.compute.localtypes.SchemaLoad.AppResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    json: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.xcalar.compute.localtypes.SchemaLoad.AppResponse}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.xcalar.compute.localtypes.SchemaLoad.AppResponse;
  return proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.xcalar.compute.localtypes.SchemaLoad.AppResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.xcalar.compute.localtypes.SchemaLoad.AppResponse}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setJson(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.xcalar.compute.localtypes.SchemaLoad.AppResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getJson();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string json = 1;
 * @return {string}
 */
proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.prototype.getJson = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.xcalar.compute.localtypes.SchemaLoad.AppResponse.prototype.setJson = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};


goog.object.extend(exports, proto.xcalar.compute.localtypes.SchemaLoad);
