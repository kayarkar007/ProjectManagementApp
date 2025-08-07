const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const nodemailer = require("nodemailer");
const moment = require("moment");

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Notification templates
const notificationTemplates = {
  taskAssigned: {
    subject: "New Task Assignment",
    template: (data) => `
      <h2>New Task Assignment</h2>
      <p>Hello ${data.assigneeName},</p>
      <p>You have been assigned a new task:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>${data.taskTitle}</h3>
        <p><strong>Project:</strong> ${data.projectName}</p>
        <p><strong>Priority:</strong> ${data.priority}</p>
        <p><strong>Due Date:</strong> ${moment(data.dueDate).format(
          "MMMM Do, YYYY"
        )}</p>
        <p><strong>Description:</strong> ${data.description}</p>
      </div>
      <p>Please review the task details and update the status accordingly.</p>
      <a href="${process.env.FRONTEND_URL}/tasks/${
      data.taskId
    }" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Task
      </a>
    `,
  },

  taskDueSoon: {
    subject: "Task Due Soon",
    template: (data) => `
      <h2>Task Due Soon</h2>
      <p>Hello ${data.assigneeName},</p>
      <p>This is a reminder that the following task is due soon:</p>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
        <h3>${data.taskTitle}</h3>
        <p><strong>Project:</strong> ${data.projectName}</p>
        <p><strong>Due Date:</strong> ${moment(data.dueDate).format(
          "MMMM Do, YYYY"
        )}</p>
        <p><strong>Days Remaining:</strong> ${data.daysRemaining}</p>
      </div>
      <p>Please ensure the task is completed on time.</p>
      <a href="${process.env.FRONTEND_URL}/tasks/${
      data.taskId
    }" style="background-color: #ffc107; color: #212529; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Task
      </a>
    `,
  },

  taskOverdue: {
    subject: "Task Overdue",
    template: (data) => `
      <h2>Task Overdue</h2>
      <p>Hello ${data.assigneeName},</p>
      <p>The following task is overdue:</p>
      <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
        <h3>${data.taskTitle}</h3>
        <p><strong>Project:</strong> ${data.projectName}</p>
        <p><strong>Due Date:</strong> ${moment(data.dueDate).format(
          "MMMM Do, YYYY"
        )}</p>
        <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
      </div>
      <p>Please complete this task as soon as possible and update the status.</p>
      <a href="${process.env.FRONTEND_URL}/tasks/${
      data.taskId
    }" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Task
      </a>
    `,
  },

  projectUpdate: {
    subject: "Project Update",
    template: (data) => `
      <h2>Project Update</h2>
      <p>Hello ${data.userName},</p>
      <p>There has been an update to the project "${data.projectName}":</p>
      <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #17a2b8;">
        <h3>${data.updateType}</h3>
        <p><strong>Details:</strong> ${data.updateDetails}</p>
        <p><strong>Updated By:</strong> ${data.updatedBy}</p>
        <p><strong>Date:</strong> ${moment(data.updateDate).format(
          "MMMM Do, YYYY HH:mm"
        )}</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/projects/${
      data.projectId
    }" style="background-color: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Project
      </a>
    `,
  },

  milestoneReached: {
    subject: "Milestone Reached",
    template: (data) => `
      <h2>Milestone Reached!</h2>
      <p>Hello ${data.userName},</p>
      <p>Congratulations! A milestone has been reached in the project "${
        data.projectName
      }":</p>
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745;">
        <h3>${data.milestoneName}</h3>
        <p><strong>Description:</strong> ${data.milestoneDescription}</p>
        <p><strong>Completed Date:</strong> ${moment(data.completedDate).format(
          "MMMM Do, YYYY"
        )}</p>
      </div>
      <p>Great work team!</p>
      <a href="${process.env.FRONTEND_URL}/projects/${
      data.projectId
    }" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Project
      </a>
    `,
  },

  riskAlert: {
    subject: "Risk Alert",
    template: (data) => `
      <h2>Risk Alert</h2>
      <p>Hello ${data.userName},</p>
      <p>A new risk has been identified in the project "${data.projectName}":</p>
      <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
        <h3>${data.riskTitle}</h3>
        <p><strong>Risk Level:</strong> ${data.riskLevel}</p>
        <p><strong>Description:</strong> ${data.riskDescription}</p>
        <p><strong>Probability:</strong> ${data.probability}</p>
        <p><strong>Impact:</strong> ${data.impact}</p>
        <p><strong>Mitigation:</strong> ${data.mitigation}</p>
      </div>
      <p>Please review and take appropriate action.</p>
      <a href="${process.env.FRONTEND_URL}/projects/${data.projectId}/risks" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Risks
      </a>
    `,
  },
};

// Send email notification
const sendEmailNotification = async (userId, templateName, data) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.preferences?.notifications?.email) {
      return false;
    }

    const template = notificationTemplates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: template.subject,
      html: template.template(data),
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email notification error:", error);
    return false;
  }
};

// Send real-time notification via Socket.IO
const sendRealTimeNotification = (io, userId, notification) => {
  io.to(`user_${userId}`).emit("notification", notification);
};

// Smart notification routing
const routeNotification = async (io, notification) => {
  const { type, recipients, data } = notification;

  // Determine notification channels based on type and user preferences
  for (const userId of recipients) {
    const user = await User.findById(userId);
    if (!user) continue;

    const preferences = user.preferences?.notifications || {};

    // Always send real-time notification
    sendRealTimeNotification(io, userId, {
      id: Date.now().toString(),
      type,
      title: getNotificationTitle(type),
      message: getNotificationMessage(type, data),
      data,
      timestamp: new Date(),
      read: false,
    });

    // Send email based on user preferences
    if (preferences.email) {
      const emailSent = await sendEmailNotification(userId, type, data);
      if (emailSent) {
        console.log(`Email notification sent to ${user.email} for ${type}`);
      }
    }

    // Send SMS if configured and enabled
    if (preferences.sms && user.phone) {
      // SMS implementation would go here
      console.log(
        `SMS notification would be sent to ${user.phone} for ${type}`
      );
    }
  }
};

// Get notification title
const getNotificationTitle = (type) => {
  const titles = {
    taskAssigned: "New Task Assignment",
    taskDueSoon: "Task Due Soon",
    taskOverdue: "Task Overdue",
    projectUpdate: "Project Update",
    milestoneReached: "Milestone Reached",
    riskAlert: "Risk Alert",
    commentAdded: "New Comment",
    statusChanged: "Status Changed",
  };
  return titles[type] || "Notification";
};

// Get notification message
const getNotificationMessage = (type, data) => {
  switch (type) {
    case "taskAssigned":
      return `You have been assigned a new task: ${data.taskTitle}`;
    case "taskDueSoon":
      return `Task "${data.taskTitle}" is due in ${data.daysRemaining} days`;
    case "taskOverdue":
      return `Task "${data.taskTitle}" is overdue by ${data.daysOverdue} days`;
    case "projectUpdate":
      return `Project "${data.projectName}" has been updated: ${data.updateType}`;
    case "milestoneReached":
      return `Milestone "${data.milestoneName}" has been reached in project "${data.projectName}"`;
    case "riskAlert":
      return `New risk identified in project "${data.projectName}": ${data.riskTitle}`;
    case "commentAdded":
      return `New comment added to ${data.entityType}: ${data.entityName}`;
    case "statusChanged":
      return `Status changed for ${data.entityType}: ${data.entityName} is now ${data.newStatus}`;
    default:
      return "You have a new notification";
  }
};

// POST /api/notifications/send
exports.sendNotification = async (req, res) => {
  try {
    const { type, recipients, data } = req.body;

    if (!type || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: "Invalid notification parameters" });
    }

    // Get Socket.IO instance from app
    const io = req.app.get("io");

    await routeNotification(io, { type, recipients, data });

    res.json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
};

// POST /api/notifications/task-assigned
exports.notifyTaskAssigned = async (req, res) => {
  try {
    const { taskId, assigneeId, assignedBy } = req.body;

    const task = await Task.findById(taskId).populate("project", "name");
    const assignee = await User.findById(assigneeId);
    const assigner = await User.findById(assignedBy);

    if (!task || !assignee || !assigner) {
      return res
        .status(404)
        .json({ error: "Task, assignee, or assigner not found" });
    }

    const io = req.app.get("io");

    await routeNotification(io, {
      type: "taskAssigned",
      recipients: [assigneeId],
      data: {
        taskId: task._id,
        taskTitle: task.title,
        projectName: task.project.name,
        projectId: task.project._id,
        priority: task.priority,
        dueDate: task.dueDate,
        description: task.description,
        assigneeName: assignee.fullName,
        assignedBy: assigner.fullName,
      },
    });

    res.json({ message: "Task assignment notification sent" });
  } catch (error) {
    console.error("Task assignment notification error:", error);
    res
      .status(500)
      .json({ error: "Failed to send task assignment notification" });
  }
};

// POST /api/notifications/check-due-tasks
exports.checkDueTasks = async (req, res) => {
  try {
    const io = req.app.get("io");
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find tasks due soon (within 3 days)
    const tasksDueSoon = await Task.find({
      dueDate: { $gte: now, $lte: threeDaysFromNow },
      status: { $nin: ["Completed", "Cancelled"] },
    })
      .populate("assignedTo.user", "username firstName lastName preferences")
      .populate("project", "name");

    let notificationsSent = 0;

    for (const task of tasksDueSoon) {
      const daysRemaining = Math.ceil(
        (task.dueDate - now) / (1000 * 60 * 60 * 24)
      );

      for (const assignment of task.assignedTo) {
        const user = assignment.user;
        if (!user.preferences?.notifications?.deadlineReminders) continue;

        await routeNotification(io, {
          type: "taskDueSoon",
          recipients: [user._id],
          data: {
            taskId: task._id,
            taskTitle: task.title,
            projectName: task.project.name,
            projectId: task.project._id,
            dueDate: task.dueDate,
            daysRemaining,
            assigneeName: user.fullName,
          },
        });

        notificationsSent++;
      }
    }

    // Find overdue tasks
    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $nin: ["Completed", "Cancelled"] },
    })
      .populate("assignedTo.user", "username firstName lastName preferences")
      .populate("project", "name");

    for (const task of overdueTasks) {
      const daysOverdue = Math.ceil(
        (now - task.dueDate) / (1000 * 60 * 60 * 24)
      );

      for (const assignment of task.assignedTo) {
        const user = assignment.user;
        if (!user.preferences?.notifications?.deadlineReminders) continue;

        await routeNotification(io, {
          type: "taskOverdue",
          recipients: [user._id],
          data: {
            taskId: task._id,
            taskTitle: task.title,
            projectName: task.project.name,
            projectId: task.project._id,
            dueDate: task.dueDate,
            daysOverdue,
            assigneeName: user.fullName,
          },
        });

        notificationsSent++;
      }
    }

    res.json({
      message: "Due task check completed",
      notificationsSent,
      tasksDueSoon: tasksDueSoon.length,
      overdueTasks: overdueTasks.length,
    });
  } catch (error) {
    console.error("Check due tasks error:", error);
    res.status(500).json({ error: "Failed to check due tasks" });
  }
};

// POST /api/notifications/project-update
exports.notifyProjectUpdate = async (req, res) => {
  try {
    const { projectId, updateType, updateDetails, updatedBy } = req.body;

    const project = await Project.findById(projectId);
    const updater = await User.findById(updatedBy);

    if (!project || !updater) {
      return res.status(404).json({ error: "Project or updater not found" });
    }

    // Get all team members and stakeholders
    const recipients = [
      project.manager,
      ...project.team.map((member) => member.user),
      ...project.stakeholders.map((stakeholder) => stakeholder.user),
    ].filter(Boolean);

    const io = req.app.get("io");

    await routeNotification(io, {
      type: "projectUpdate",
      recipients,
      data: {
        projectId: project._id,
        projectName: project.name,
        updateType,
        updateDetails,
        updatedBy: updater.fullName,
        updateDate: new Date(),
      },
    });

    res.json({ message: "Project update notification sent" });
  } catch (error) {
    console.error("Project update notification error:", error);
    res
      .status(500)
      .json({ error: "Failed to send project update notification" });
  }
};

// POST /api/notifications/milestone-reached
exports.notifyMilestoneReached = async (req, res) => {
  try {
    const { projectId, milestoneName, milestoneDescription, completedBy } =
      req.body;

    const project = await Project.findById(projectId);
    const completer = await User.findById(completedBy);

    if (!project || !completer) {
      return res.status(404).json({ error: "Project or completer not found" });
    }

    // Get all team members and stakeholders
    const recipients = [
      project.manager,
      ...project.team.map((member) => member.user),
      ...project.stakeholders.map((stakeholder) => stakeholder.user),
    ].filter(Boolean);

    const io = req.app.get("io");

    await routeNotification(io, {
      type: "milestoneReached",
      recipients,
      data: {
        projectId: project._id,
        projectName: project.name,
        milestoneName,
        milestoneDescription,
        completedDate: new Date(),
        completedBy: completer.fullName,
      },
    });

    res.json({ message: "Milestone notification sent" });
  } catch (error) {
    console.error("Milestone notification error:", error);
    res.status(500).json({ error: "Failed to send milestone notification" });
  }
};

// POST /api/notifications/risk-alert
exports.notifyRiskAlert = async (req, res) => {
  try {
    const {
      projectId,
      riskTitle,
      riskDescription,
      riskLevel,
      probability,
      impact,
      mitigation,
      assignedTo,
    } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Get project manager and risk assignee
    const recipients = [project.manager];
    if (assignedTo) {
      recipients.push(assignedTo);
    }

    const io = req.app.get("io");

    await routeNotification(io, {
      type: "riskAlert",
      recipients,
      data: {
        projectId: project._id,
        projectName: project.name,
        riskTitle,
        riskDescription,
        riskLevel,
        probability,
        impact,
        mitigation,
      },
    });

    res.json({ message: "Risk alert notification sent" });
  } catch (error) {
    console.error("Risk alert notification error:", error);
    res.status(500).json({ error: "Failed to send risk alert notification" });
  }
};

// GET /api/notifications/user/:userId
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    // This would typically query a notifications collection
    // For now, we'll return a mock response
    const notifications = [
      {
        id: "1",
        type: "taskAssigned",
        title: "New Task Assignment",
        message:
          "You have been assigned a new task: Implement user authentication",
        data: {
          taskId: "task123",
          taskTitle: "Implement user authentication",
          projectName: "E-commerce Platform",
        },
        timestamp: new Date(),
        read: false,
      },
    ];

    res.json({
      notifications: notifications.slice(offset, offset + parseInt(limit)),
      total: notifications.length,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error("Get user notifications error:", error);
    res.status(500).json({ error: "Failed to get user notifications" });
  }
};

// PUT /api/notifications/:notificationId/read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    // This would typically update a notifications collection
    // For now, we'll return a success response

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};
