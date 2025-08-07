const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "employee", "client"],
      default: "employee",
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    bio: {
      type: String,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "dark",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
// userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return (
    `${this.firstName || ""} ${this.lastName || ""}`.trim() || this.username
  );
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
