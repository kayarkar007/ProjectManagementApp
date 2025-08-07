const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"],
      default: "Planning",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    budget: {
      type: Number,
      min: 0,
      default: 0,
    },
    actualCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Index for better query performance
projectSchema.index({ status: 1, priority: 1 });
projectSchema.index({ manager: 1 });
projectSchema.index({ team: 1 });

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
