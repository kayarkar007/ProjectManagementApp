const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const { auth, authorize } = require("../Middleware/auth");

// All routes require authentication
router.use(auth);

// User routes (admin only for most operations)
router.get("/users", authorize("admin"), UserController.getUsers);
router.get("/users/stats", authorize("admin"), UserController.getUserStats);
router.get("/users/:id", UserController.getUser);
router.put("/users/:id", authorize("admin"), UserController.updateUser);
router.put(
  "/users/:id/promote",
  authorize("admin"),
  UserController.promoteUser
);
router.put("/users/:id/demote", authorize("admin"), UserController.demoteUser);
router.delete("/users/:id", authorize("admin"), UserController.deleteUser);

// User-specific routes
router.get("/users/:id/projects", UserController.getUserProjects);
router.get("/users/:id/tasks", UserController.getUserTasks);

module.exports = router;
