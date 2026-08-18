const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shape a user document into the safe, public-facing fields only.
function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email
  };
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: toPublicUser(user),
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration"
    });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: toPublicUser(user),
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong during login"
    });
  }
}

// GET /api/auth/me (protected — requires authMiddleware)
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    data: {
      userId: req.user.id
    }
  });
}

module.exports = { register, login, getMe };
