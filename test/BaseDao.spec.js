import BaseDao from "../src/BaseDao";
import { MongoClient } from "mongodb";
const config = {
  collection: "facets",
  pageSize: 2,
  dbName: global.__MONGO_DB_NAME__,
};

describe("BaseDao", function () {
  let dbClient = null;
  let baseDao = null;

  beforeEach(async () => {
    dbClient = await MongoClient.connect(global.__MONGO_URI__, {
      useUnifiedTopology: true,
    });
    baseDao = new BaseDao(config, dbClient);
  });

  afterEach(async () => {
    await baseDao.dbRef.remove({});
    await dbClient.close();
  });

  //instance of
  test("should be an instance of BaseDao", () => {
    expect.assertions(1);
    expect(baseDao).toBeInstanceOf(BaseDao);
  });

  describe("Create Data", () => {
    test("create", async () => {
      let insertedData = await baseDao.create({ color: "red" });
      expect(baseDao.data).toHaveLength(1);
      expect(insertedData).toHaveLength(1);

      expect(baseDao.error).toHaveLength(0);
    });

    test("create 2", async () => {
      let insertedData = await baseDao.create({ color: "red" });
      expect(baseDao.data).toHaveLength(1);
      expect(insertedData).toHaveLength(1);

      expect(baseDao.error).toHaveLength(0);

      insertedData = await baseDao.create({ color: "red" });
      expect(baseDao.data).toHaveLength(1);
      expect(insertedData).toHaveLength(1);

      expect(baseDao.error).toHaveLength(0);
    });
  });

  describe("Read Data", () => {
    beforeEach(async () => {
      await baseDao.create({ color: "red" });
      await baseDao.create({ color: "green" });
      baseDao = new BaseDao(config, dbClient);
    });
    //prepare data first
    test("read all", async () => {
      let readData = await baseDao.find();
      expect(readData).toHaveLength(2);
      expect(baseDao.error).toHaveLength(0);
      expect(baseDao.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: "red" }),
          expect.objectContaining({ color: "green" }),
        ])
      );
    });

    //prepare data first
    test("read one", async () => {
      let readData = await baseDao.find();
      baseDao.id = readData[0].id;
      readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      expect(baseDao.error).toHaveLength(0);
      expect(baseDao.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ ...readData[0] })])
      );
    });

    test("read where", async () => {
      baseDao.match = { color: "green" };
      let readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      expect(baseDao.error).toHaveLength(0);
      expect(baseDao.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: "green" })])
      );
    });

    test("read by pages", async () => {
      baseDao.pageSize = 1;
      baseDao.page = 1;
      let readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      expect(baseDao.error).toHaveLength(0);
      expect(baseDao.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: "red" })])
      );
      baseDao.page = 2;
      readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      expect(baseDao.error).toHaveLength(0);
      expect(baseDao.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: "green" })])
      );
    });
  });

  describe("Update Data", () => {
    beforeEach(async () => {
      await baseDao.create({ color: "red" });
      await baseDao.create({ color: "green" });
      baseDao = new BaseDao(config, dbClient);
    });

    test("update", async () => {
      baseDao.match = { color: "green" };
      let readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      baseDao.id = readData[0].id;
      await baseDao.update({ color: "dark green" });
      expect(readData).toHaveLength(1);
      baseDao.match = { color: "dark green" };
      readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      expect(baseDao.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: "dark green" })])
      );
      expect(baseDao.error).toHaveLength(0);
    });

    test("update two", async () => {
      baseDao.match = { color: "green" };
      let readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      baseDao.id = readData[0].id;
      await baseDao.update({ color: "dark green" });
      expect(readData).toHaveLength(1);
      baseDao.match = { color: "dark green" };
      readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      expect(baseDao.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: "dark green" })])
      );
      expect(baseDao.error).toHaveLength(0);

      baseDao.match = { color: "red" };
      readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      baseDao.id = readData[0].id;
      await baseDao.update({ color: "maroon" });
      expect(readData).toHaveLength(1);
      baseDao.match = { color: "maroon" };
      readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      expect(baseDao.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: "maroon" })])
      );
      expect(baseDao.error).toHaveLength(0);
    });
  });

  describe("Delete Data", () => {
    beforeEach(async () => {
      await baseDao.create({ color: "red" });
      await baseDao.create({ color: "green" });
      baseDao = new BaseDao(config, dbClient);
    });

    test("delete one", async () => {
      baseDao.match = { color: "green" };
      let readData = await baseDao.find();
      expect(readData).toHaveLength(1);
      baseDao.id = readData[0].id;
      readData = await baseDao.delete();
      expect(readData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: baseDao.id.toHexString() }),
        ])
      );
      expect(readData).toHaveLength(1);
      baseDao.match = { color: "green" };
      readData = await baseDao.find();
      expect(readData).toHaveLength(0);

      expect(baseDao.error).toHaveLength(0);
    });

    test("delete two", async () => {
      let readData = await baseDao.find();
      expect(readData).toHaveLength(2);
      for (let i = 0; i < readData.length; i++) {
        baseDao.id = readData[i].id;
        await baseDao.delete();
      }
      baseDao.id = null;
      readData = await baseDao.find();
      expect(readData).toHaveLength(0);
      expect(baseDao.error).toHaveLength(0);
    });
  });
});
