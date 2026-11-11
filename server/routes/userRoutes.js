const express = require("express");

const {
  deleteUser,
  getCurrentUser,
  getUserById,
  listUsers,
  updateUser,
} = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { updateUserSchema } = require("../validation/authSchemas");

const router = express.Router();

router.use(requireAuth);

router.get("/me", getCurrentUser);
router.get("/", requireRole("admin"), listUsers);
router.get("/:id", getUserById);
router.patch("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
