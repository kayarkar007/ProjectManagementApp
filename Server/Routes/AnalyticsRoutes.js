const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const AnalyticsController = require("../controllers/AnalyticsController");
const { auth } = require("../Middleware/auth");

// Rate limiting for analytics endpoints
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: "Too many analytics requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: errors.array() 
    });
  }
  next();
};

// Validation middleware
const validateDateRange = [
  query("startDate")
    .optional()
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage("Start date must be a valid date"),
  query("endDate")
    .optional()
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage("End date must be a valid date"),
  query("department")
    .optional()
    .isIn([
      "Engineering",
      "Design",
      "Product",
      "Marketing",
      "Sales",
      "Support",
      "HR",
      "Finance",
      "Operations",
    ])
    .withMessage("Invalid department"),
];

const validateReportParams = [
  query("reportType")
    .isIn(["project_summary", "team_performance", "financial_summary"])
    .withMessage("Invalid report type"),
  query("startDate")
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage("Start date is required and must be a valid date"),
  query("endDate")
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage("End date is required and must be a valid date"),
  query("format")
    .optional()
    .isIn(["json", "csv"])
    .withMessage("Format must be either 'json' or 'csv'"),
];

// Apply rate limiting to all analytics routes
router.use(analyticsLimiter);

// GET /api/analytics/dashboard - Get dashboard analytics
router.get("/dashboard", auth, AnalyticsController.getDashboardAnalytics);

// GET /api/analytics/project/:projectId - Get project-specific analytics
router.get(
  "/project/:projectId",
  auth,
  AnalyticsController.getProjectAnalytics
);

// GET /api/analytics/team - Get team performance analytics
router.get(
  "/team",
  auth,
  validateDateRange,
  handleValidationErrors,
  AnalyticsController.getTeamAnalytics
);

// GET /api/analytics/reports - Generate custom reports
router.get(
  "/reports",
  auth,
  validateReportParams,
  handleValidationErrors,
  AnalyticsController.generateReport
);

module.exports = router;
