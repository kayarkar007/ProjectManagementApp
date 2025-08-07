const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/project_management_app";

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1); // Exit if DB connection fails
  });

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Project Management App Server is running!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      projects: "/api/projects",
      tasks: "/api/tasks",
      users: "/api/users",
    },
  });
});

// API Routes
app.use("/api", require("./Routes/AuthRoutes"));
app.use("/api", require("./Routes/ProjectRoutes"));
app.use("/api", require("./Routes/TaskRoutes"));
app.use("/api", require("./Routes/UserRoutes"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error. Please try again later.",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});