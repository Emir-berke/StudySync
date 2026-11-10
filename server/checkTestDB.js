
require("dotenv").config();
const mongoose = require("mongoose");

async function checkTestDB() {
  try {
    const uri = process.env.TEST_MONGO_URI;

    if (!uri) {
      throw new Error("TEST_MONGO_URI is missing");
    }

    const dbName = decodeURIComponent(
      new URL(uri).pathname.slice(1)
    );

    if (dbName !== "studysync_test") {
      throw new Error("Incorrect test database name");
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("Test database connected successfully!");
    console.log("Database:", mongoose.connection.name);
  } catch (error) {
    console.error("Connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

checkTestDB();
