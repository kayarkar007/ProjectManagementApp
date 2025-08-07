const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");

// GET /api/tasks - Get all tasks (with filtering and pagination)
exports.getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      project,
      assignedTo,
      search,
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project) query.project = project;
    if (assignedTo) query.assignedTo = { $in: [assignedTo] };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .populate("project", "name status")
      .populate("assignedTo", "username firstName lastName email avatar")
      .populate("assignedBy", "username firstName lastName email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// GET /api/tasks/:id - Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name status description")
      .populate("assignedTo", "username firstName lastName email avatar")
      .populate("assignedBy", "username firstName lastName email avatar")
      .populate({
        path: "comments.user",
        select: "username firstName lastName email avatar",
      });

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json(task);
  } catch (err) {
    console.error("Get task error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// POST /api/tasks - Create new task
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      project,
      assignedTo,
      dueDate,
      estimatedHours,
      subtasks,
      tags,
    } = req.body;

    // Validation
    if (!title || !description || !project || !assignedTo || !dueDate) {
      return res.status(400).json({
        error:
          "Title, description, project, assigned users, and due date are required.",
      });
    }

    // Check if project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Check if assigned users exist
    const assignedToArray = Array.isArray(assignedTo)
      ? assignedTo
      : [assignedTo];
    const usersExist = await User.find({ _id: { $in: assignedToArray } });
    if (usersExist.length !== assignedToArray.length) {
      return res
        .status(404)
        .json({ error: "One or more assigned users not found." });
    }

    const task = new Task({
      title: title.trim(),
      description: description.trim(),
      status: status || "To Do",
      priority: priority || "Medium",
      project,
      assignedTo: assignedToArray,
      assignedBy: req.user._id,
      dueDate,
      estimatedHours: estimatedHours || 0,
      subtasks: subtasks || [],
      tags: tags || [],
    });

    await task.save();

    // Add task to project
    await Project.findByIdAndUpdate(project, {
      $push: { tasks: task._id },
    });

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name status")
      .populate("assignedTo", "username firstName lastName email avatar")
      .populate("assignedBy", "username firstName lastName email avatar");

    res.status(201).json({
      message: "Task created successfully.",
      task: populatedTask,
    });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// PUT /api/tasks/:id - Update task
exports.updateTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      estimatedHours,
      actualHours,
      progress,
      subtasks,
      tags,
    } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    // Check if user is assigned to task, project manager, or admin
    const project = await Project.findById(task.project);
    const isAssignedUser = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString()
    );
    const isProjectManager =
      project && project.manager.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAssignedUser && !isProjectManager && !isAdmin) {
      return res.status(403).json({
        error:
          "Access denied. Only assigned user, project manager, or admin can update this task.",
      });
    }

    // Update fields
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) {
      const assignedToArray = Array.isArray(assignedTo)
        ? assignedTo
        : [assignedTo];
      task.assignedTo = assignedToArray;
    }
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (progress !== undefined) task.progress = progress;
    if (subtasks !== undefined) task.subtasks = subtasks;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("project", "name status")
      .populate("assignedTo", "username firstName lastName email avatar")
      .populate("assignedBy", "username firstName lastName email avatar");

    res.json({
      message: "Task updated successfully.",
      task: updatedTask,
    });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// DELETE /api/tasks/:id - Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    // Check if user is project manager or admin
    const project = await Project.findById(task.project);
    const isProjectManager =
      project && project.manager.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isProjectManager && !isAdmin) {
      return res.status(403).json({
        error:
          "Access denied. Only project manager or admin can delete this task.",
      });
    }

    // Remove task from project
    await Project.findByIdAndUpdate(task.project, {
      $pull: { tasks: task._id },
    });

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: "Task deleted successfully." });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// POST /api/tasks/:id/comments - Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required." });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    task.comments.push({
      user: req.user._id,
      content: content.trim(),
    });

    await task.save();

    const updatedTask = await Task.findById(task._id).populate({
      path: "comments.user",
      select: "username firstName lastName email avatar",
    });

    res.json({
      message: "Comment added successfully.",
      task: updatedTask,
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// PUT /api/tasks/:id/progress - Update task progress
exports.updateProgress = async (req, res) => {
  try {
    const { progress, status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    // Check if user is assigned to task
    if (
      task.assignedTo.some(
        (userId) => userId.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({
        error: "Access denied. Only assigned user can update task progress.",
      });
    }

    if (progress !== undefined) task.progress = progress;
    if (status !== undefined) task.status = status;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("project", "name status")
      .populate("assignedTo", "username firstName lastName email avatar");

    res.json({
      message: "Task progress updated successfully.",
      task: updatedTask,
    });
  } catch (err) {
    console.error("Update progress error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// GET /api/tasks/stats - Get task statistics
exports.getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalEstimatedHours: { $sum: "$estimatedHours" },
          totalActualHours: { $sum: "$actualHours" },
        },
      },
    ]);

    const totalTasks = await Task.countDocuments();
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $nin: ["Completed"] },
    });

    res.json({
      statusBreakdown: stats,
      totalTasks,
      overdueTasks,
    });
  } catch (err) {
    console.error("Get task stats error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};
