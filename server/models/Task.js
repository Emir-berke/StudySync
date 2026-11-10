
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo"
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    dueDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Improve queries that retrieve tasks for a session
taskSchema.index({ session: 1, status: 1 });

module.exports = mongoose.model("Task", taskSchema);
