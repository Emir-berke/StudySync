
const mongoose = require("mongoose");
require("dotenv").config();

const connectTestDB = async () => {
  const uri = process.env.TEST_MONGO_URI;

  if (!uri) {
    throw new Error("TEST_MONGO_URI is missing");
  }

  const dbName = decodeURIComponent(
    new URL(uri).pathname.slice(1)
  );

  if (dbName !== "studysync_test") {
    throw new Error("Tests must use studysync_test");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  if (mongoose.connection.name !== "studysync_test") {
    await mongoose.disconnect();
    throw new Error("Connected to the wrong database");
  }

  console.log("Connected to StudySync test database");
};

const disconnectTestDB = async () => {
  await mongoose.disconnect();
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
};
