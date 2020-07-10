"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _mongodb = require("mongodb");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * @class BaseDao
 * Base class for all api acess to mongodb
 */
class BaseDao {
  /**
   * @constructor
   * @param {Object<mongo:Object<dbName: string, >>} config
   * @param {MongoClient} dbClient instance of MongoDB Client
   * @param {string} collectionName
   */
  constructor(config, dbClient) {
    this.id = null;
    this.query = null;
    this.dbClient = dbClient;
    this.config = config;
    this.collection = config.collection ? config.collection : ""; //paginate data

    this.head = {};
    this.data = [];
    this.error = []; //aggregations

    this.sort = config.sort ? config.sort : {
      _id: -1
    };
    this.pageSize = config.pageSize ? config.pageSize : 20;
    this.page = 1;
    this.match = {};
  }
  /**
   * the page to view
   * @param {Number} page
   */


  set page(page) {
    if (!isNaN(page) && +page > 0) {
      this._page = +page;
    }
  }
  /**
   * @param {Number} pageSize
   */


  set pageSize(pageSize) {
    if (!isNaN(pageSize) && +pageSize > 0) {
      this._pageSize = +pageSize;
    }
  }

  get page() {
    return this._page;
  }

  get pageSize() {
    return this._pageSize;
  }
  /**
   * query params from call
   * @param {Object<field: value>} query
   */


  set query(query) {
    this._query = query;
  }

  get query() {
    return this._query;
  }
  /**
   * @param {String} collectionName
   */


  set collection(collectionName) {
    this._collection = collectionName;
  }

  get collection() {
    return this._collection;
  } // get offset(){
  // }

  /**
   * @return {Object} database connection to collection
   */


  get dbRef() {
    return this.dbClient.db(this.dbName).collection(this.collection);
  }
  /**
   * sets the id of the document you want to query, also sets the _idString value for raw id string
   * @param {string} id of the document you want to query
   */


  set id(idString) {
    if (idString) {
      if (idString.length >= 24) {
        this._id = (0, _mongodb.ObjectId)(idString);
      } else {
        this._id = {
          _id: "invalid id, must be at least 24 characters long,curr length " + idString.length
        };
        throw this._id;
      }
    } else {
      this._id = null;
    }
  }
  /**
   * @return {ObjectId} mongo database id in BSON Object
   */


  get id() {
    return this._id;
  }
  /**
   * @return the output base object
   */


  get output() {
    return {
      head: {
        page: this.page,
        pageSize: this.pageSize,
        length: this.data.length,
        dataset: this.collection
      },
      data: this.data,
      error: this.error
    };
  }
  /**
   * reset the output parts
   */


  resetOutput() {
    this.head = {};
    this.data = [];
    this.error = [];
  }
  /**
   * @return output object data
   */


  find() {
    var _this = this;

    return _asyncToGenerator(function* () {
      _this.resetOutput();

      try {
        //id declared, just get one
        if (_this.id) {
          var obj = yield _this.dbRef.findOne(_this.id);

          if (obj) {
            _this.data = [obj];
          }
        } else {
          // this.data = await this.dbRef.find().toArray();
          var aggregationArr = [{
            $match: _this.match
          }, {
            $skip: (_this.page - 1) * _this.pageSize
          }, {
            $limit: _this.pageSize
          }];

          if (_this.query) {
            aggregationArr.push(_this.query);
          }

          _this.data = yield _this.dbRef.aggregate(aggregationArr).sort(_this.sort).toArray(); //change _id to id
          // this.data.map(cleanMongoId);
        }
      } catch (ex) {
        _this.resetOutput();

        _this.error.push(ex.message);
      }

      return _this.data;
    })();
  }
  /**
   * inserts data into the collection, overwrite this with your own implemntation for validation
   * @param {Object} data for insert
   */


  create(data) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      _this2.resetOutput();

      if (data) {
        try {
          var insertedData = yield _this2.dbRef.insertOne(data);
          _this2.data = [_objectSpread({
            _id: insertedData.insertedId
          }, data)];
        } catch (ex) {
          _this2.resetOutput();

          _this2.error.push(ex.message);
        }
      }

      return _this2.data;
    })();
  }
  /**
   * Updates the document with the id set in the class attribute
   * @param {Object} data for update
   */


  update(data) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      _this3.resetOutput();

      if (!_this3.id) {
        throw "id is required";
      }

      if (!data) {
        throw "missing data";
      }

      if (data) {
        try {
          var origDataRes = yield _this3.dbRef.findOneAndUpdate({
            _id: _this3.id
          }, {
            $set: data
          });
          _this3.data = [_objectSpread(_objectSpread({}, origDataRes.value), data)];
        } catch (ex) {
          _this3.resetOutput();

          _this3.error.push(ex.message);
        }
      }

      return _this3.data;
    })();
  }
  /**
   * handles delete operations
   */


  delete() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      _this4.resetOutput();

      try {
        //id declared, just get one
        if (_this4.id) {
          var obj = yield _this4.dbRef.deleteOne({
            _id: _this4.id
          });

          if (obj.deletedCount) {
            _this4.data = [{
              id: _this4.id.toHexString()
            }];
          } else {
            //failed delete for some reason
            _this4.error = [{
              fail: _this4.id.toHexString()
            }];
          }
        } else {
          _this4.error = [{
            id: "required"
          }];
          throw "id is required";
        }
      } catch (ex) {
        _this4.resetOutput();

        _this4.error.push(ex.message);
      }

      return _this4.data;
    })();
  }

}

exports.default = BaseDao;
//# sourceMappingURL=BaseDao.js.map