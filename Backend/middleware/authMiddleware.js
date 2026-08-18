const jwt = require("jsonwebtoken");

// Verifies the Bearer token on the Authorization header and attaches
// the authenticated user's ID to req.user. Does not query MongoDB —
// the token payload is sufficient for this stage.
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing"
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired"
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token"
    });
  }
}

module.exports = authMiddleware;
