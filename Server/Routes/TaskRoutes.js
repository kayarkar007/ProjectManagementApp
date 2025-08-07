const express = require("express");
const router = express.Router();
const TaskController = require("../controllers/TaskController");
const { auth, authorize } = require("../Middleware/auth");

// All routes require authentication
router.use(auth);

// Task routes
router.get("/tasks", TaskController.getTasks);
router.get("/tasks/stats", TaskController.getTaskStats);
router.get("/tasks/:id", TaskController.getTask);
router.post("/tasks", authorize("admin", "manager"), TaskController.createTask);
router.put("/tasks/:id", TaskController.updateTask);
router.delete(
  "/tasks/:id",
  authorize("admin", "manager"),
  TaskController.deleteTask
);

// Task comments
router.post("/tasks/:id/comments", TaskController.addComment);

// Task progress
router.put("/tasks/:id/progress", TaskController.updateProgress);

module.exports = router;
