"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "util", {
  enumerable: true,
  get: function get() {
    return _util.default;
  }
});
exports.MongoDBDao = void 0;

var _BaseDao = _interopRequireDefault(require("./BaseDao"));

var _util = _interopRequireDefault(require("./util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MongoDBDao = _BaseDao.default;
exports.MongoDBDao = MongoDBDao;
//# sourceMappingURL=index.js.map