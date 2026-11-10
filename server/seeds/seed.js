
require("dotenv").config();

const mongoose = require("mongoose");

const User = require("../models/User");
const Session = require("../models/Session");
const Task = require("../models/Task");

const sampleUsers = require("./sampleUsers");
const sampleSessions = require("./sampleSessions");
const sampleTasks = require("./sampleTasks");

const seedDatabase = async () => {
  try {
    if (process.env.NODE_ENV !== "test") {
      throw new Error(
        "Seeding is only allowed when NODE_ENV=test"
      );
    }

    if (!process.env.TEST_MONGO_URI) {
      throw new Error("TEST_MONGO_URI is missing");
    }

    await mongoose.connect(process.env.TEST_MONGO_URI);
    console.log("Connected to test database");

    const databaseName = mongoose.connection.db.databaseName;

    if (databaseName !== "studysync_test") {
      throw new Error(
        "Test database name must end with _test"
      );
    }

    // Remove existing sample/test records
    await Task.deleteMany({});
    await Session.deleteMany({});
    await User.deleteMany({});

    // Insert users first
    const users = await User.insertMany(await sampleUsers());

    // Sessions need user IDs
    const sessions = await Session.insertMany(
      sampleSessions(users)
    );

    // Tasks need user and session IDs
    const tasks = await Task.insertMany(
      sampleTasks(users, sessions)
    );

    console.log("Seed data created successfully!");
    console.log(`Users: ${users.length}`);
    console.log(`Sessions: ${sessions.length}`);
    console.log(`Tasks: ${tasks.length}`);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
