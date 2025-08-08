const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

// GET /api/users - Get all users (with filtering and pagination)
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      department,
      search,
      isActive,
    } = req.query;

    const query = {};

    // Apply filters
    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Search functionality
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// GET /api/users/:id - Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// PUT /api/users/:id - Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      role,
      department,
      position,
      phone,
      bio,
      skills,
      isActive,
    } = req.body;

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Only admins can update users." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department;
    if (position !== undefined) user.position = position;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// PUT /api/users/:id/promote - Promote user to manager (admin only)
exports.promoteUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Only admins can promote users." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if user is already a manager or admin
    if (user.role === "manager" || user.role === "admin") {
      return res.status(400).json({
        error: `User is already a ${user.role}.`,
      });
    }

    // Promote user to manager
    user.role = "manager";
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.json({
      message: "User promoted to manager successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Promote user error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// PUT /api/users/:id/demote - Demote manager to employee (admin only)
exports.demoteUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Only admins can demote users." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if user is a manager
    if (user.role !== "manager") {
      return res.status(400).json({
        error: "User is not a manager.",
      });
    }

    // Check if user is managing any projects
    const managedProjects = await Project.find({ manager: user._id });
    if (managedProjects.length > 0) {
      return res.status(400).json({
        error: "Cannot demote user. User is managing active projects.",
      });
    }

    // Demote user to employee
    user.role = "employee";
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.json({
      message: "User demoted to employee successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Demote user error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// DELETE /api/users/:id - Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Only admins can delete users." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if user is trying to delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own account." });
    }

    // Check if user has active projects or tasks
    const userProjects = await Project.find({ manager: user._id });
    const userTasks = await Task.find({ assignedTo: { $in: [user._id] } });

    if (userProjects.length > 0 || userTasks.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete user. User has active projects or tasks assigned.",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// GET /api/users/:id/projects - Get user's projects
exports.getUserProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const projects = await Project.find({
      $or: [{ manager: req.params.id }, { team: req.params.id }],
    })
      .populate("manager", "username firstName lastName email avatar")
      .populate("team", "username firstName lastName email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments({
      $or: [{ manager: req.params.id }, { team: req.params.id }],
    });

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
    console.error("Get user projects error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// GET /api/users/:id/tasks - Get user's tasks
exports.getUserTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { assignedTo: { $in: [req.params.id] } };
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .populate("project", "name status")
      .populate("assignedTo", "username firstName lastName email avatar")
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
    console.error("Get user tasks error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// PUT /api/users/preferences - Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      darkMode,
      language,
      timezone,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update preferences
    user.preferences = {
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      darkMode: darkMode !== undefined ? darkMode : true,
      language: language || "en",
      timezone: timezone || "UTC",
    };

    await user.save();

    res.json({
      message: "Preferences updated successfully.",
      preferences: user.preferences,
    });
  } catch (err) {
    console.error("Update preferences error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// GET /api/users/stats - Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    res.json({
      roleBreakdown: stats,
      totalUsers,
      activeUsers,
      inactiveUsers,
    });
  } catch (err) {
    console.error("Get user stats error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};
