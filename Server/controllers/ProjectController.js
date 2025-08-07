const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

// GET /api/projects - Get all projects (with filtering and pagination)
exports.getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      manager,
      teamMember,
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (manager) query.manager = manager;
    if (teamMember) query.team = teamMember;

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .populate("manager", "username firstName lastName email avatar")
      .populate("team", "username firstName lastName email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// GET /api/projects/:id - Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("manager", "username firstName lastName email avatar")
      .populate("team", "username firstName lastName email avatar")
      .populate({
        path: "tasks",
        populate: {
          path: "assignedTo",
          select: "username firstName lastName email avatar",
        },
      })
      .populate({
        path: "comments.user",
        select: "username firstName lastName email avatar",
      });

    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json(project);
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// POST /api/projects - Create new project
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      budget,
      team,
      tags,
    } = req.body;

    // Validation
    if (!name || !description || !startDate || !endDate) {
      return res.status(400).json({
        error: "Name, description, start date, and end date are required.",
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ error: "End date must be after start date." });
    }

    const project = new Project({
      name: name.trim(),
      description: description.trim(),
      status: status || "Planning",
      priority: priority || "Medium",
      startDate,
      endDate,
      budget: budget || 0,
      manager: req.user._id,
      team: team || [],
      tags: tags || [],
    });

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate("manager", "username firstName lastName email avatar")
      .populate("team", "username firstName lastName email avatar");

    res.status(201).json({
      message: "Project created successfully.",
      project: populatedProject,
    });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// PUT /api/projects/:id - Update project
exports.updateProject = async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      budget,
      actualCost,
      progress,
      team,
      tags,
    } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Check if user is project manager or admin
    if (
      project.manager.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        error:
          "Access denied. Only project manager or admin can update this project.",
      });
    }

    // Validation for required fields if they are being updated
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: "Project name is required." });
    }

    if (description !== undefined && !description.trim()) {
      return res
        .status(400)
        .json({ error: "Project description is required." });
    }

    // Validate dates if they are being updated
    if (startDate !== undefined && endDate !== undefined) {
      if (new Date(startDate) >= new Date(endDate)) {
        return res
          .status(400)
          .json({ error: "End date must be after start date." });
      }
    } else if (startDate !== undefined && project.endDate) {
      if (new Date(startDate) >= new Date(project.endDate)) {
        return res
          .status(400)
          .json({ error: "Start date must be before the current end date." });
      }
    } else if (endDate !== undefined && project.startDate) {
      if (new Date(project.startDate) >= new Date(endDate)) {
        return res
          .status(400)
          .json({ error: "End date must be after the current start date." });
      }
    }

    // Update fields
    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (budget !== undefined) project.budget = budget;
    if (actualCost !== undefined) project.actualCost = actualCost;
    if (progress !== undefined) project.progress = progress;
    if (team !== undefined) project.team = team;
    if (tags !== undefined) project.tags = tags;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("manager", "username firstName lastName email avatar")
      .populate("team", "username firstName lastName email avatar");

    res.json({
      message: "Project updated successfully.",
      project: updatedProject,
    });
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// DELETE /api/projects/:id - Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Check if user is project manager or admin
    if (
      project.manager.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        error:
          "Access denied. Only project manager or admin can delete this project.",
      });
    }

    // Delete associated tasks
    await Task.deleteMany({ project: project._id });

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: "Project deleted successfully." });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// POST /api/projects/:id/comments - Add comment to project
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required." });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    project.comments.push({
      user: req.user._id,
      content: content.trim(),
    });

    await project.save();

    const updatedProject = await Project.findById(project._id).populate({
      path: "comments.user",
      select: "username firstName lastName email avatar",
    });

    res.json({
      message: "Comment added successfully.",
      project: updatedProject,
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// GET /api/projects/stats - Get project statistics
exports.getProjectStats = async (req, res) => {
  try {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalBudget: { $sum: "$budget" },
          totalActualCost: { $sum: "$actualCost" },
        },
      },
    ]);

    const totalProjects = await Project.countDocuments();
    const totalBudget = await Project.aggregate([
      { $group: { _id: null, total: { $sum: "$budget" } } },
    ]);

    const totalActualCost = await Project.aggregate([
      { $group: { _id: null, total: { $sum: "$actualCost" } } },
    ]);

    res.json({
      statusBreakdown: stats,
      totalProjects,
      totalBudget: totalBudget[0]?.total || 0,
      totalActualCost: totalActualCost[0]?.total || 0,
    });
  } catch (err) {
    console.error("Get project stats error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};
