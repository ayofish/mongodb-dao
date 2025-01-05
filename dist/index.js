"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "BaseDao", {
  enumerable: true,
  get: function get() {
    return _BaseDao["default"];
  }
});
exports.MongoDBDao = void 0;
Object.defineProperty(exports, "util", {
  enumerable: true,
  get: function get() {
    return _util["default"];
  }
});
var _BaseDao = _interopRequireDefault(require("./BaseDao"));
var _util = _interopRequireDefault(require("./util"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var MongoDBDao = exports.MongoDBDao = _BaseDao["default"];