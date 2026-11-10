
const mongoose = require("mongoose");

const {
  connectTestDB,
  disconnectTestDB,
} = require("./setupTestDB");

describe("StudySync Test Database", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("should connect to the correct test database", () => {
    expect(mongoose.connection.readyState).toBe(1);
    expect(mongoose.connection.name).toBe("studysync_test");
  });
});
