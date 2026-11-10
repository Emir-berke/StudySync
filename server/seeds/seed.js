
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
    // Only allow seeding in test mode
    if (process.env.NODE_ENV !== "test") {
      throw new Error("Seeding is only allowed in test mode");
    }

    // Make sure the test database connection exists
    if (!process.env.TEST_MONGO_URI) {
      throw new Error("TEST_MONGO_URI is missing");
    }

    // Connect to the test database
    await mongoose.connect(process.env.TEST_MONGO_URI);

    const databaseName = mongoose.connection.db.databaseName;

    // Prevent accidentally modifying another database
    if (databaseName !== "studysync_test") {
      throw new Error(
        "Seeding is only allowed in the studysync_test database"
      );
    }

    console.log("Connected to test database:", databaseName);

    // Remove old test data
    await Task.deleteMany({});
    await Session.deleteMany({});
    await User.deleteMany({});

    // Insert sample users
    const usersData = await sampleUsers();
    const users = await User.insertMany(usersData);

    // Insert sample sessions
    const sessionsData = sampleSessions(users);
    const sessions = await Session.insertMany(sessionsData);

    // Insert sample tasks
    const tasksData = sampleTasks(users, sessions);
    await Task.insertMany(tasksData);

    console.log("StudySync test database seeded successfully!");
  } catch (error) {
    console.error("Database seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
