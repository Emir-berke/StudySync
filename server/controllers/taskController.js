const mongoose = require("mongoose");

const Task = require("../models/Task");
const Session = require("../models/Session");
const User = require("../models/User");

// Check whether a supplied ID is a valid MongoDB ObjectId
const invalidId = (id) => !mongoose.isValidObjectId(id);


const createTask = async (req, res) => {
  // Find the session that this task belongs to
  const session = await Session.findById(req.body.session);

  // Check whether the session exists
  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found",
    });
  }

  // Check whether the logged-in user owns this session
  if (!session.createdBy.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the session owner can create tasks",
    });
  }

  // Create the task using the information from the request
  const task = await Task.create(req.body);

  // Return the newly created task
  res.status(201).json({
    success: true,
    task,
  });
};



const listTasks = async (req, res) => {
  // Check whether the requested status is valid
  const allowedStatuses = ["todo", "in-progress", "done"];

  if (req.query.status && !allowedStatuses.includes(req.query.status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task status",
    });
  }

  // Find sessions that the logged-in user belongs to
  const sessions = await Session.find({
    participants: req.user._id,
  }).select("_id");

  // Get the IDs of those sessions
  const sessionIds = sessions.map((session) => session._id);

  // Retrieve tasks belonging only to those sessions
  const filter = {
    session: { $in: sessionIds },
  };

  // Apply the optional status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const tasks = await Task.find(filter)
    .populate("session")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    tasks,
  });
};



const getTask = async (req, res) => {
  // Check whether the task ID is valid
  if (invalidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }

  // Find the task and populate its related information
  const task = await Task.findById(req.params.id)
    .populate("session")
    .populate("assignedTo", "name email");

  // Check whether the task exists
  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Check whether the logged-in user belongs to the session
  const session = task.session;

  const isMember = session.participants.some((participant) =>
    participant.equals(req.user._id)
  );

  if (!isMember) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this task",
    });
  }

  // Return the task
  res.json({
    success: true,
    task,
  });
};


const updateTask = async (req, res) => {
  // Check whether the task ID is valid
  if (invalidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }

  // Find the existing task
  const existingTask = await Task.findById(req.params.id);

  if (!existingTask) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Find the session associated with this task
  const session = await Session.findById(existingTask.session);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found",
    });
  }

  // Only the session owner can update the task
  if (!session.createdBy.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the session owner can update tasks",
    });
  }

  // Update the task with the supplied information
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("session")
    .populate("assignedTo", "name email");

  res.json({
    success: true,
    task,
  });
};


const updateTaskStatus = async (req, res) => {
  // Check whether the task ID is valid
  if (invalidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }

  // Find the task
  const existingTask = await Task.findById(req.params.id);

  if (!existingTask) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Find the session associated with the task
  const session = await Session.findById(existingTask.session);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found",
    });
  }

  // Only the session owner can change task status
  if (!session.createdBy.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the session owner can update task status",
    });
  }

  // Update only the status field
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    task,
  });
};


const assignTask = async (req, res) => {
  // Check whether the task ID is valid
  if (invalidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }

  // Find the task
  const existingTask = await Task.findById(req.params.id);

  if (!existingTask) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Find the session associated with the task
  const session = await Session.findById(existingTask.session);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found",
    });
  }

  // Only the session owner can assign tasks
  if (!session.createdBy.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the session owner can assign tasks",
    });
  }

  // Get the user ID being assigned, or null to unassign
  const assignedTo = req.body.assignedTo;

  // Check that the assigned user is a participant in the session
  if (assignedTo !== null) {
    const isMember = session.participants.some((participant) =>
      participant.equals(assignedTo)
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "Assigned user must be a member of the session",
      });
    }
  }

  // Update the assigned user
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { assignedTo },
    { new: true, runValidators: true }
  )
    .populate("session")
    .populate("assignedTo", "name email");

  res.json({
    success: true,
    task,
  });
};


const deleteTask = async (req, res) => {
  // Check whether the task ID is valid
  if (invalidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });
  }

  // Find the task
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Find the session associated with the task
  const session = await Session.findById(task.session);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found",
    });
  }

  // Only the session owner can delete tasks
  if (!session.createdBy.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the session owner can delete tasks",
    });
  }

  // Delete the task from the database
  await task.deleteOne();

  res.json({
    success: true,
    message: "Task deleted successfully",
  });
};


module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
};



