const express = require('express');

const {
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  joinSession,
  leaveSession,
} = require('../controllers/sessionController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createSessionSchema,
  updateSessionSchema,
} = require('../validation/sessionSchemas');

const router = express.Router();

router.use(requireAuth);
router.get('/', listSessions);
router.post('/', validate(createSessionSchema), createSession);
router.get('/:id', getSession);
router.patch('/:id', validate(updateSessionSchema), updateSession);
router.delete('/:id', deleteSession);
router.post('/:id/join', joinSession);
router.post('/:id/leave', leaveSession);

module.exports = router;
