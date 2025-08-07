const winston = require("winston");

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  winston.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new NotFoundError(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ValidationError(message, err.errors);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new AuthenticationError(message);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new AuthenticationError(message);
  }

  // Rate limit errors
  if (err.statusCode === 429) {
    error = new RateLimitError();
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Development error response
  if (process.env.NODE_ENV === "development") {
    res.status(statusCode).json({
      success: false,
      error: message,
      stack: err.stack,
      statusCode,
    });
  } else {
    // Production error response
    if (error.isOperational) {
      res.status(statusCode).json({
        success: false,
        error: message,
        statusCode,
      });
    } else {
      // Programming or unknown errors: don't leak error details
      res.status(500).json({
        success: false,
        error: "Something went wrong",
        statusCode: 500,
      });
    }
  }
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFound,
};
