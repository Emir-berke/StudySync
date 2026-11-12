const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');

jest.mock('../models/Session', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/Task', () => ({
  deleteMany: jest.fn(),
}));

const Session = require('../models/Session');
const User = require('../models/User');
const Task = require('../models/Task');
const app = require('../app');

const JWT_SECRET = 'session-api-test-secret';
const ownerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
const memberId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
const otherId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439013');
const sessionId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439014');
const taskId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439015');
const users = {
  [ownerId.toString()]: {
    _id: ownerId,
    name: 'Session Owner',
    email: 'owner@example.com',
    role: 'student',
  },
  [memberId.toString()]: {
    _id: memberId,
    name: 'Session Member',
    email: 'member@example.com',
    role: 'student',
  },
  [otherId.toString()]: {
    _id: otherId,
    name: 'Other Student',
    email: 'other@example.com',
    role: 'student',
  },
};

const tokenFor = (userId) =>
  jwt.sign({ sub: userId.toString() }, JWT_SECRET, { expiresIn: '1h' });
const auth = (userId) => ({ Authorization: `Bearer ${tokenFor(userId)}` });
const publicUser = (userId) => {
  const user = users[userId.toString()];
  return {
    _id: user._id,
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    equals: (id) => user._id.equals(id),
  };
};

const makeSession = (overrides = {}) => {
  const session = {
    _id: sessionId,
    title: 'Biology review',
    description: 'Review cell structure.',
    createdBy: ownerId,
    participants: [ownerId],
    scheduledAt: new Date('2027-05-10T18:30:00.000Z'),
    status: 'upcoming',
    tasks: [
      {
        _id: taskId,
        title: 'Read chapter 4',
        description: 'Review the assigned chapter.',
        session: sessionId,
        assignedTo: memberId,
        status: 'todo',
        priority: 'medium',
        dueDate: null,
      },
    ],
    ...overrides,
    populate: jest.fn(async function (path) {
      if (path === 'createdBy')
        this.createdBy = publicUser(this.createdBy._id || this.createdBy);
      if (path === 'participants') {
        this.participants = this.participants.map((participant) =>
          publicUser(participant._id || participant),
        );
      }
      if (path === 'tasks.assignedTo') {
        this.tasks = this.tasks.map((task) => ({
          ...task,
          assignedTo: publicUser(task.assignedTo._id || task.assignedTo),
        }));
      }
      return this;
    }),
    deleteOne: jest.fn().mockResolvedValue(undefined),
  };

  return session;
};

const queryFor = (value) => {
  const paths = [];
  const query = {
    populate: jest.fn((path) => {
      paths.push(path);
      return query;
    }),
    sort: jest.fn().mockReturnThis(),
    then: (resolve, reject) => {
      const results = Array.isArray(value) ? value : [value];
      for (const result of results) {
        for (const path of paths) {
          if (path === 'createdBy') {
            result.createdBy = publicUser(
              result.createdBy._id || result.createdBy,
            );
          }
          if (path === 'participants') {
            result.participants = result.participants.map((participant) =>
              publicUser(participant._id || participant),
            );
          }
          if (path === 'tasks.assignedTo') {
            result.tasks = result.tasks.map((task) => ({
              ...task,
              assignedTo: publicUser(task.assignedTo._id || task.assignedTo),
            }));
          }
        }
      }
      return Promise.resolve(value).then(resolve, reject);
    },
  };

  return query;
};

const sessionInput = {
  title: 'Biology review',
  description: 'Review cell structure.',
  scheduledAt: '2027-05-10T18:30:00.000Z',
  status: 'upcoming',
};

describe('Study session API', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    Task.deleteMany.mockResolvedValue({ deletedCount: 0 });
    User.findById.mockImplementation((id) => ({
      select: jest.fn().mockResolvedValue(users[id.toString()]),
    }));
  });

  test('authenticated users can create, browse, view, update, and delete sessions', async () => {
    const created = makeSession();
    Session.create.mockResolvedValue(created);

    const createResponse = await request(app)
      .post('/api/sessions')
      .set(auth(ownerId))
      .send(sessionInput);

    expect(createResponse.statusCode).toBe(201);
    expect(Session.create).toHaveBeenCalledWith({
      ...sessionInput,
      scheduledAt: new Date(sessionInput.scheduledAt),
      createdBy: ownerId,
      participants: [ownerId],
    });
    expect(createResponse.body.session.createdBy).toMatchObject({
      id: ownerId.toString(),
      name: 'Session Owner',
    });
    expect(createResponse.body.session.tasks[0]).toMatchObject({
      title: 'Read chapter 4',
      status: 'todo',
      priority: 'medium',
    });

    const listSession = makeSession();
    Session.find.mockReturnValue(queryFor([listSession]));
    const listResponse = await request(app)
      .get('/api/sessions')
      .set(auth(ownerId));

    const detailSession = makeSession();
    Session.findById.mockReturnValueOnce(queryFor(detailSession));
    const detailResponse = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .set(auth(ownerId));

    const editableSession = makeSession();
    Session.findById.mockResolvedValueOnce(editableSession);
    const updatedSession = makeSession({ description: 'Updated description' });
    Session.findByIdAndUpdate.mockReturnValue(queryFor(updatedSession));
    const updateResponse = await request(app)
      .patch(`/api/sessions/${sessionId}`)
      .set(auth(ownerId))
      .send({ description: 'Updated description' });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.sessions).toHaveLength(1);
    expect(listResponse.body.sessions[0].tasks[0].title).toBe('Read chapter 4');
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.body.session.title).toBe('Biology review');
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.session.description).toBe('Updated description');

    const deletableSession = makeSession();
    Session.findById.mockResolvedValueOnce(deletableSession);
    const deleteResponse = await request(app)
      .delete(`/api/sessions/${sessionId}`)
      .set(auth(ownerId));

    expect(deleteResponse.statusCode).toBe(200);
    expect(deletableSession.deleteOne).toHaveBeenCalled();
    expect(Task.deleteMany).toHaveBeenCalledWith({ session: sessionId });
  });

  test('users can join and leave a session', async () => {
    const joined = makeSession({ participants: [ownerId, memberId] });
    const left = makeSession({ participants: [ownerId] });
    Session.findByIdAndUpdate
      .mockReturnValueOnce(queryFor(joined))
      .mockReturnValueOnce(queryFor(left));

    const joinResponse = await request(app)
      .post(`/api/sessions/${sessionId}/join`)
      .set(auth(memberId));
    const leaveResponse = await request(app)
      .post(`/api/sessions/${sessionId}/leave`)
      .set(auth(memberId));

    expect(joinResponse.statusCode).toBe(200);
    expect(joinResponse.body.session.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: memberId.toString() }),
      ]),
    );
    expect(Session.findByIdAndUpdate).toHaveBeenNthCalledWith(
      1,
      sessionId.toString(),
      { $addToSet: { participants: memberId } },
      { new: true },
    );
    expect(leaveResponse.statusCode).toBe(200);
    expect(leaveResponse.body.session.participants).toHaveLength(1);
  });

  test('only the owner can edit or delete a session', async () => {
    Session.findById.mockResolvedValue(makeSession());

    const updateResponse = await request(app)
      .patch(`/api/sessions/${sessionId}`)
      .set(auth(otherId))
      .send({ title: 'Unauthorized change' });
    const deleteResponse = await request(app)
      .delete(`/api/sessions/${sessionId}`)
      .set(auth(otherId));

    expect(updateResponse.statusCode).toBe(403);
    expect(deleteResponse.statusCode).toBe(403);
    expect(Session.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('rejects unauthenticated, invalid identifier, and malformed requests', async () => {
    const unauthenticatedResponse = await request(app).get('/api/sessions');
    const invalidBodyResponse = await request(app)
      .post('/api/sessions')
      .set(auth(ownerId))
      .send({ ...sessionInput, title: ' ' });
    const invalidIdResponse = await request(app)
      .get('/api/sessions/not-an-id')
      .set(auth(ownerId));

    expect(unauthenticatedResponse.statusCode).toBe(401);
    expect(invalidBodyResponse.statusCode).toBe(400);
    expect(invalidIdResponse.statusCode).toBe(400);
  });
});
