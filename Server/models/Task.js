const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
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
      enum: ["To Do", "In Progress", "Review", "Completed"],
      default: "To Do",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    estimatedHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    subtasks: [
      {
        title: String,
        completed: {
          type: Boolean,
          default: false,
        },
        dueDate: Date,
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
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    timeEntries: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        hours: Number,
        description: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Indexes for better query performance
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });

// Middleware to update project progress when task progress changes
taskSchema.pre("save", async function (next) {
  if (this.isModified("progress") || this.isModified("status")) {
    try {
      const Project = require("./Project");
      const project = await Project.findById(this.project);
      if (project) {
        // Calculate project progress based on all tasks
        const tasks = await mongoose
          .model("Task")
          .find({ project: this.project });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(
          (task) => task.status === "Completed"
        ).length;
        const inProgressTasks = tasks.filter(
          (task) => task.status === "In Progress"
        ).length;

        // Calculate overall progress
        let totalProgress = 0;
        tasks.forEach((task) => {
          totalProgress += task.progress || 0;
        });

        const averageProgress = totalTasks > 0 ? totalProgress / totalTasks : 0;

        // Update project progress and status
        project.progress = Math.round(averageProgress);

        // Update project status based on task statuses
        if (completedTasks === totalTasks && totalTasks > 0) {
          project.status = "Completed";
        } else if (inProgressTasks > 0 || averageProgress > 0) {
          project.status = "In Progress";
        } else {
          project.status = "Planning";
        }

        await project.save();
      }
    } catch (error) {
      console.error("Error updating project progress:", error);
    }
  }
  next();
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
