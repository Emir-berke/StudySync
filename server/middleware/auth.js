const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { getJwtSecret } = require("../utils/authToken");

const requireAuth = async (req, res, next) => {
  const authorization = req.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User for this token no longer exists",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode === 500) {
      return next(error);
    }

    return res.status(401).json({
      success: false,
      message: "Authentication token is invalid or expired",
    });
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action",
    });
  }

  next();
};

module.exports = {
  requireAuth,
  requireRole,
};
