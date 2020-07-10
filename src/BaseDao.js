import { ObjectId } from "mongodb";
import { cleanMongoId } from "./util";
/**
 * @class BaseDao
 * Base class for all api acess to mongodb
 */
export default class BaseDao {
  /**
   * @constructor
   * @param {Object<mongo:Object<dbName: string, >>} config
   * @param {MongoClient} db
   * @param {string} collectionName
   */
  constructor(config, db, collectionName) {
    this.id = null;
    this.query = null;
    this.collection = collectionName;
    this.dbClient = db;
    this.config = config;
    //paginate data
    this.head = {};
    this.data = [];
    this.error = [];
    //aggregations
    this.sort;
    this.pageSize = config.pageSize || 20;
    this.page = 1;
    //aggregate query
    this.match = {};
  }

  /**
   * the page to view
   */
  set page(page) {
    if (!isNaN(page) && +page > 0) {
      this._page = +page;
    }
  }

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
   * query params from call object {field: value}
   */
  set query(query) {
    if (query && query.page) {
      this.page = query.page;
    }
    if (query && query.pageSize) {
      this.pageSize = query.pageSize;
    }
    this._query = { pageSize: this.pageSize, page: this.page };
  }

  get query() {
    return this._query;
  }

  // get sort(){

  // }

  // get pageSize(){

  // }

  // get offset(){

  // }

  /**
   * @return {Object} database connection to collection
   */
  get dbRef() {
    return this.dbClient.db(this.config.mongo.dbName).collection(this.collection);
  }

  /**
   * sets the id of the document you want to query, also sets the _idString value for raw id string
   * @param {string} id of the document you want to query
   */
  set id(idString) {
    if (idString) {
      if (idString.length >= 24) {
        this._id = ObjectId(idString);
      } else {
        this._id = { _id: "invalid id, must be at least 24 characters long" };
        throw "invalid id, must be at least 24 characters long";
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
        dataset: this.collection,
      },
      data: this.data,
      error: this.error,
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
  async find() {
    this.resetOutput();
    try {
      //id declared, just get one
      if (this.id) {
        const obj = await this.dbRef.findOne(this.id);
        if (obj) {
          this.data = [cleanMongoId(obj)];
        }
      } else {
        // this.data = await this.dbRef.find().toArray();
        this.data = await this.dbRef
          .aggregate([
            { $match: this.match },
            { $skip: (this.page - 1) * this.pageSize },
            { $limit: this.pageSize },
          ])
          .sort({ _id: -1 })
          .toArray();
        //change _id to id
        this.data.map(cleanMongoId);
      }
    } catch (ex) {
      this.resetOutput();
      this.error.push(ex.message);
    }
    return this.data;
  }

  /**
   * inserts data into the collection, overwrite this with your own implemntation for validation
   * @param {Object} data for insert
   */
  async create(data) {
    this.resetOutput();
    if (data) {
      try {
        let insertedData = await this.dbRef.insertOne(data);
        this.data = [
          cleanMongoId({
            id: insertedData.insertedId,
            ...data,
          }),
        ];
      } catch (ex) {
        this.resetOutput();
        this.error.push(ex.message);
      }
    }
    return this.data;
  }

  /**
   * Updates the document with the id set in the class attribute
   * @param {Object} data for update
   */
  async update(data) {
    this.resetOutput();
    if (!this.id) {
      throw "id is required";
    }
    if (!data) {
      throw "missing data";
    }
    if (data) {
      try {
        let origDataRes = await this.dbRef.findOneAndUpdate(
          { _id: this.id },
          { $set: data }
        );
        this.data = [{ ...origDataRes.value, ...data }];
        this.data.map(cleanMongoId);
      } catch (ex) {
        this.resetOutput();
        this.error.push(ex.message);
      }
    }
    return this.data;
  }
  /**
   * handles delete operations
   */
  async delete() {
    this.resetOutput();
    try {
      //id declared, just get one
      if (this.id) {
        const obj = await this.dbRef.deleteOne({ _id: this.id });
        if (obj.deletedCount) {
          this.data = [{ id: this.id.toHexString() }];
        } else {
          //failed delete for some reason
          this.error = [{ fail: this.id.toHexString() }];
        }
      } else {
        this.error = [{ id: "required" }];
        throw "id is required";
      }
    } catch (ex) {
      this.resetOutput();
      this.error.push(ex.message);
    }
    return this.data;
  }
}
