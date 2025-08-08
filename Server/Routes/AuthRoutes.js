const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const { auth } = require("../Middleware/auth");

// Public routes
router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);

// Protected routes
router.get("/me", auth, AuthController.getProfile);
router.put("/me", auth, AuthController.updateProfile);
router.put("/auth/change-password", auth, AuthController.changePassword);
router.post("/logout", auth, AuthController.logout);

module.exports = router;
