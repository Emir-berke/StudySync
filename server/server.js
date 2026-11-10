
const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

// Start server
app.listen(PORT, () => {
  console.log(`StudySync server running on port ${PORT}`);
});
