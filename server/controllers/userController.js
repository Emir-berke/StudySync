const User = require("../models/User");
const { serializeUser } = require("./authController");

const isOwnerOrAdmin = (requestUser, userId) =>
  requestUser.role === "admin" || requestUser._id.toString() === userId;

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-passwordHash");

    res.json({
      success: true,
      users: users.map(serializeUser),
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = (req, res) =>
  res.json({
    success: true,
    user: serializeUser(req.user),
  });

const getUserById = async (req, res, next) => {
  try {
    if (!isOwnerOrAdmin(req.user, req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this user",
      });
    }

    const user = await User.findById(req.params.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    if (!isOwnerOrAdmin(req.user, req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this user",
      });
    }

    if (req.body.role && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only an administrator can change user roles",
      });
    }

    if (req.body.email) {
      const existingUser = await User.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (!isOwnerOrAdmin(req.user, req.params.id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this user",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  deleteUser,
  getCurrentUser,
  getUserById,
  listUsers,
  updateUser,
};
