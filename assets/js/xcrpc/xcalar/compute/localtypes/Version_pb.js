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

var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
goog.exportSymbol('proto.xcalar.compute.localtypes.Version.GetVersionResponse', null, global);

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
proto.xcalar.compute.localtypes.Version.GetVersionResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.xcalar.compute.localtypes.Version.GetVersionResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.xcalar.compute.localtypes.Version.GetVersionResponse.displayName = 'proto.xcalar.compute.localtypes.Version.GetVersionResponse';
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
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.xcalar.compute.localtypes.Version.GetVersionResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.xcalar.compute.localtypes.Version.GetVersionResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    version: jspb.Message.getFieldWithDefault(msg, 1, ""),
    thriftVersionSignatureFull: jspb.Message.getFieldWithDefault(msg, 2, ""),
    thriftVersionSignatureShort: jspb.Message.getFieldWithDefault(msg, 3, 0),
    xcrpcVersionSignatureFull: jspb.Message.getFieldWithDefault(msg, 4, ""),
    xcrpcVersionSignatureShort: jspb.Message.getFieldWithDefault(msg, 5, 0),
    clusterId: jspb.Message.getFieldWithDefault(msg, 6, ""),
    clusterGen: jspb.Message.getFieldWithDefault(msg, 7, 0)
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
 * @return {!proto.xcalar.compute.localtypes.Version.GetVersionResponse}
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.xcalar.compute.localtypes.Version.GetVersionResponse;
  return proto.xcalar.compute.localtypes.Version.GetVersionResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.xcalar.compute.localtypes.Version.GetVersionResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.xcalar.compute.localtypes.Version.GetVersionResponse}
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVersion(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setThriftVersionSignatureFull(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setThriftVersionSignatureShort(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setXcrpcVersionSignatureFull(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setXcrpcVersionSignatureShort(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setClusterId(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setClusterGen(value);
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
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.xcalar.compute.localtypes.Version.GetVersionResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.xcalar.compute.localtypes.Version.GetVersionResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVersion();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getThriftVersionSignatureFull();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getThriftVersionSignatureShort();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
  f = message.getXcrpcVersionSignatureFull();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getXcrpcVersionSignatureShort();
  if (f !== 0) {
    writer.writeUint32(
      5,
      f
    );
  }
  f = message.getClusterId();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getClusterGen();
  if (f !== 0) {
    writer.writeUint64(
      7,
      f
    );
  }
};


/**
 * optional string version = 1;
 * @return {string}
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.setVersion = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string thrift_version_signature_full = 2;
 * @return {string}
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.getThriftVersionSignatureFull = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/** @param {string} value */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.setThriftVersionSignatureFull = function(value) {
  jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional uint32 thrift_version_signature_short = 3;
 * @return {number}
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.getThriftVersionSignatureShort = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/** @param {number} value */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.setThriftVersionSignatureShort = function(value) {
  jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string xcrpc_version_signature_full = 4;
 * @return {string}
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.getXcrpcVersionSignatureFull = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/** @param {string} value */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.setXcrpcVersionSignatureFull = function(value) {
  jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional uint32 xcrpc_version_signature_short = 5;
 * @return {number}
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.getXcrpcVersionSignatureShort = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/** @param {number} value */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.setXcrpcVersionSignatureShort = function(value) {
  jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional string cluster_id = 6;
 * @return {string}
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.getClusterId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/** @param {string} value */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.setClusterId = function(value) {
  jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional uint64 cluster_gen = 7;
 * @return {number}
 */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.getClusterGen = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {number} value */
proto.xcalar.compute.localtypes.Version.GetVersionResponse.prototype.setClusterGen = function(value) {
  jspb.Message.setProto3IntField(this, 7, value);
};


goog.object.extend(exports, proto.xcalar.compute.localtypes.Version);
