const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const NotificationController = require("../controllers/NotificationController");
const { auth } = require("../Middleware/auth");

// Rate limiting for notification endpoints
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: "Too many notification requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateNotificationData = [
  body("type")
    .isIn([
      "taskAssigned",
      "taskDueSoon",
      "taskOverdue",
      "projectUpdate",
      "milestoneReached",
      "riskAlert",
      "commentAdded",
      "statusChanged",
    ])
    .withMessage("Invalid notification type"),
  body("recipients")
    .isArray({ min: 1 })
    .withMessage("Recipients must be a non-empty array"),
  body("recipients.*").isMongoId().withMessage("Invalid recipient ID"),
  body("data").isObject().withMessage("Data must be an object"),
];

const validateTaskAssignment = [
  body("taskId").isMongoId().withMessage("Invalid task ID"),
  body("assigneeId").isMongoId().withMessage("Invalid assignee ID"),
  body("assignedBy").isMongoId().withMessage("Invalid assigner ID"),
];

const validateProjectUpdate = [
  body("projectId").isMongoId().withMessage("Invalid project ID"),
  body("updateType").notEmpty().withMessage("Update type is required"),
  body("updateDetails").notEmpty().withMessage("Update details are required"),
  body("updatedBy").isMongoId().withMessage("Invalid updater ID"),
];

const validateMilestoneData = [
  body("projectId").isMongoId().withMessage("Invalid project ID"),
  body("milestoneName").notEmpty().withMessage("Milestone name is required"),
  body("milestoneDescription")
    .notEmpty()
    .withMessage("Milestone description is required"),
  body("completedBy").isMongoId().withMessage("Invalid completer ID"),
];

const validateRiskAlert = [
  body("projectId").isMongoId().withMessage("Invalid project ID"),
  body("riskTitle").notEmpty().withMessage("Risk title is required"),
  body("riskDescription")
    .notEmpty()
    .withMessage("Risk description is required"),
  body("riskLevel")
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage("Invalid risk level"),
  body("probability")
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage("Invalid probability"),
  body("impact")
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage("Invalid impact"),
  body("mitigation").notEmpty().withMessage("Mitigation strategy is required"),
  body("assignedTo").optional().isMongoId().withMessage("Invalid assignee ID"),
];

const validateUserNotifications = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a non-negative integer"),
  query("unreadOnly")
    .optional()
    .isBoolean()
    .withMessage("unreadOnly must be a boolean"),
];

// Apply rate limiting to all notification routes
router.use(notificationLimiter);

// POST /api/notifications/send - Send custom notification
router.post(
  "/send",
  auth,
  validateNotificationData,
  NotificationController.sendNotification
);

// POST /api/notifications/task-assigned - Notify task assignment
router.post(
  "/task-assigned",
  auth,
  validateTaskAssignment,
  NotificationController.notifyTaskAssigned
);

// POST /api/notifications/check-due-tasks - Check and notify due tasks
router.post("/check-due-tasks", auth, NotificationController.checkDueTasks);

// POST /api/notifications/project-update - Notify project update
router.post(
  "/project-update",
  auth,
  validateProjectUpdate,
  NotificationController.notifyProjectUpdate
);

// POST /api/notifications/milestone-reached - Notify milestone reached
router.post(
  "/milestone-reached",
  auth,
  validateMilestoneData,
  NotificationController.notifyMilestoneReached
);

// POST /api/notifications/risk-alert - Notify risk alert
router.post(
  "/risk-alert",
  auth,
  validateRiskAlert,
  NotificationController.notifyRiskAlert
);

// GET /api/notifications/user/:userId - Get user notifications
router.get(
  "/user/:userId",
  auth,
  validateUserNotifications,
  NotificationController.getUserNotifications
);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put(
  "/:notificationId/read",
  auth,
  [body("userId").isMongoId().withMessage("Invalid user ID")],
  NotificationController.markNotificationRead
);

module.exports = router;
