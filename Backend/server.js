require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Core middleware
app.use(cors());
app.use(express.json());

// Health check — confirms the API is up and reachable
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SentimentLens API is running"
  });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Connect to MongoDB, then start the server only once the connection succeeds
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Server] SentimentLens API running on port ${PORT}`);
  });
});
