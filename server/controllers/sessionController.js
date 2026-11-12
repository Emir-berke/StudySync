const mongoose = require('mongoose');

const Session = require('../models/Session');
const Task = require('../models/Task');

const populated = (query) =>
  query
    .populate('createdBy', 'name email')
    .populate('participants', 'name email')
    .populate('tasks')
    .populate('tasks.assignedTo', 'name email');

const invalidId = (id) => !mongoose.isValidObjectId(id);

const listSessions = async (req, res) => {
  const sessions = await populated(Session.find().sort({ scheduledAt: 1 }));

  res.json({ success: true, sessions });
};

const getSession = async (req, res) => {
  if (invalidId(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid session ID' });
  }

  const session = await populated(Session.findById(req.params.id));
  if (!session) {
    return res
      .status(404)
      .json({ success: false, message: 'Session not found' });
  }

  res.json({ success: true, session });
};

const createSession = async (req, res) => {
  const session = await Session.create({
    ...req.body,
    createdBy: req.user._id,
    participants: [req.user._id],
  });

  await session.populate('createdBy', 'name email');
  await session.populate('participants', 'name email');
  await session.populate('tasks');
  await session.populate('tasks.assignedTo', 'name email');

  res.status(201).json({ success: true, session });
};

const updateSession = async (req, res) => {
  if (invalidId(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid session ID' });
  }

  const existing = await Session.findById(req.params.id);
  if (!existing) {
    return res
      .status(404)
      .json({ success: false, message: 'Session not found' });
  }
  if (!existing.createdBy.equals(req.user._id)) {
    return res
      .status(403)
      .json({ success: false, message: 'Only the session owner can edit it' });
  }

  const session = await populated(
    Session.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }),
  );

  res.json({ success: true, session });
};

const deleteSession = async (req, res) => {
  if (invalidId(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid session ID' });
  }

  const session = await Session.findById(req.params.id);
  if (!session) {
    return res
      .status(404)
      .json({ success: false, message: 'Session not found' });
  }
  if (!session.createdBy.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Only the session owner can delete it',
    });
  }

  await Task.deleteMany({ session: session._id });
  await session.deleteOne();
  res.json({ success: true, message: 'Session deleted' });
};

const joinSession = async (req, res) => {
  if (invalidId(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid session ID' });
  }

  const session = await populated(
    Session.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { participants: req.user._id } },
      { new: true },
    ),
  );
  if (!session) {
    return res
      .status(404)
      .json({ success: false, message: 'Session not found' });
  }

  res.json({ success: true, session });
};

const leaveSession = async (req, res) => {
  if (invalidId(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid session ID' });
  }

  const session = await populated(
    Session.findByIdAndUpdate(
      req.params.id,
      { $pull: { participants: req.user._id } },
      { new: true },
    ),
  );
  if (!session) {
    return res
      .status(404)
      .json({ success: false, message: 'Session not found' });
  }

  res.json({ success: true, session });
};

module.exports = {
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  joinSession,
  leaveSession,
};
