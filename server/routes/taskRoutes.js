
const express = require("express");

const {
  createTask,
  listTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
} = require("../controllers/taskController");

const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");

const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
} = require("../validation/taskSchemas");

const router = express.Router();

// All task routes require the user to be logged in
router.use(requireAuth);

// Create and retrieve tasks
router.post("/", validate(createTaskSchema), createTask);
router.get("/", listTasks);
router.get("/:id", getTask);

// Update task status and assignment
router.put("/:id/status", validate(updateTaskStatusSchema), updateTaskStatus);
router.put("/:id/assign", validate(assignTaskSchema), assignTask);

// Update or delete a task
router.put("/:id", validate(updateTaskSchema), updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
