const express = require("express");
const router = express.Router();
const ProjectController = require("../controllers/ProjectController");
const { auth, authorize } = require("../Middleware/auth");

// All routes require authentication
router.use(auth);

// Project routes
router.get("/projects", ProjectController.getProjects);
router.get("/projects/stats", ProjectController.getProjectStats);
router.get("/projects/:id", ProjectController.getProject);
router.post(
  "/projects",
  authorize("admin", "manager"),
  ProjectController.createProject
);
router.put("/projects/:id", ProjectController.updateProject);
router.delete(
  "/projects/:id",
  authorize("admin", "manager"),
  ProjectController.deleteProject
);

// Project comments
router.post("/projects/:id/comments", ProjectController.addComment);

module.exports = router;
