const jwt = require("jsonwebtoken");

// Signs a JWT containing only the user's ID — never put sensitive
// data like email or password in the payload.
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

module.exports = generateToken;
