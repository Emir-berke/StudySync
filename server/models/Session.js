
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    scheduledAt: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["upcoming", "active", "completed"],
      default: "upcoming"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
