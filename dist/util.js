"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanMongoId = void 0;
var cleanMongoId = exports.cleanMongoId = function cleanMongoId(obj) {
  obj.id = obj._id.toHexString();
  delete obj._id;
  return obj;
};