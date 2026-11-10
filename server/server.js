
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// MongoDB connection
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/api/health", (req, res) => {
  res.json({
    message: "StudySync API is running!",
    status: "success"
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`StudySync server running on port ${PORT}`);
  });
};

startServer();
