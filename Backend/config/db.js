const mongoose = require("mongoose");

// Connects to MongoDB using the URI from environment variables.
// Exits the process if the connection fails, since the API is
// not useful without a working database connection.
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DB] MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
