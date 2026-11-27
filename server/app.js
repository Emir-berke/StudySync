
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://studysync-frontend-kv0s.onrender.com"
  ]
}));

// JSON middleware
app.use(express.json());

// Health-check route
app.get("/api/health", (req, res) => {
  res.json({
    message: "StudySync API is running!",
    status: "success",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/tasks", taskRoutes);

// Error handler must be last
app.use(errorHandler);

module.exports = app;
