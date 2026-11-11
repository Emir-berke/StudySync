
const express = require("express");
const cors = require("cors");

const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

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

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);

// Error handler must be last
app.use(errorHandler);

module.exports = app;
