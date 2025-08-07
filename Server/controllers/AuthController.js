const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  });
};

// POST /api/signup
exports.signup = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Email format validation (simple regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
    });
    if (existingUser) {
      return res.status(409).json({
        error:
          existingUser.email === email.toLowerCase()
            ? "Email is already registered."
            : "Username is already taken.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || "",
      lastName: lastName || "",
      role: role || "employee",
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

// POST /api/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
      redirect: "/dashboard",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

// GET /api/me - Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// PUT /api/me - Update current user profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, department, position, bio, avatar } =
      req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (position !== undefined) user.position = position;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// POST /api/logout
exports.logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};
