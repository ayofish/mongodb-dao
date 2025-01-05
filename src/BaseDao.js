import { ObjectId } from "mongodb";
/**
 * @class BaseDao
 * Base class for all api acess to mongodb
 */
export default class BaseDao {
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
    this.dbName = config.dbName;
    this.config = config;
    this.collection = config.collection ? config.collection : "";
    //paginate data
    this.head = {};
    this.data = [];
    this.error = [];
    //aggregations
    this.sort = config.sort ? config.sort : { _id: -1 };
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
  }

  // get offset(){

  // }

  /**
   * @return {Object} database connection to collection
   */
  get dbRef() {
    return this.dbClient.db(this.dbName).collection(this.collection);
  }

  /**
   * Sets the ID for the instance.
   * 
   * @param {string|ObjectId} idString - The ID to set. It can be either a string or an ObjectId.
   * @throws {Object} Throws an error object if the provided ID string is less than 24 characters long.
   */
  set id(idString) {
    if(idString instanceof ObjectId){
      this._id = idString;
    }else{
      if (idString) {
        if (idString.length >= 24) {
          this._id = ObjectId(idString);
        } else {
          this._id = {
            _id:
              "invalid id, must be at least 24 characters long,curr length " +
              idString.length,
          };
          throw this._id;
        }
      } else {
        this._id = null;
      }
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
        const obj = await this.dbRef.findOne({_id: this.id});
        if (obj) {
          this.data = [obj];
        }
      } else {
        // this.data = await this.dbRef.find().toArray();
        let aggregationArr = [
          { $match: this.match },
          { $skip: (this.page - 1) * this.pageSize },
          { $limit: this.pageSize },
        ];
        if (this.query) {
          aggregationArr.push(this.query);
        }
        this.data = await this.dbRef
          .aggregate(aggregationArr)
          .sort(this.sort)
          .toArray();
        //change _id to id
        // this.data.map(cleanMongoId);
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
          {
            _id: insertedData.insertedId,
            ...data,
          },
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
