"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanMongoId = void 0;

var cleanMongoId = obj => {
  obj.id = obj._id.toHexString();
  delete obj._id;
  return obj;
};

exports.cleanMongoId = cleanMongoId;
//# sourceMappingURL=util.js.map