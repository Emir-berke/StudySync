
const express = require("express");
const cors = require("cors");

const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health-check route
app.get("/api/health", (req, res) => {
  res.json({
    message: "StudySync API is running!",
    status: "success",
  });
});

// Teammates will add their API routes here.

// Error handler must be last
app.use(errorHandler);

module.exports = app;
