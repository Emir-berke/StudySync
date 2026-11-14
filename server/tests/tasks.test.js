
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("supertest");

jest.mock("../models/Task", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../models/Session", () => ({
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../models/User", () => ({
  findById: jest.fn(),
}));

const Task = require("../models/Task");
const Session = require("../models/Session");
const User = require("../models/User");
const app = require("../app");

const JWT_SECRET = "task-api-test-secret";

const ownerId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
const memberId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
const otherId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439013");
const sessionId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439014");
const taskId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439015");

const users = {
  [ownerId.toString()]: {
    _id: ownerId,
    name: "Session Owner",
    email: "owner@example.com",
    role: "student",
  },
  [memberId.toString()]: {
    _id: memberId,
    name: "Session Member",
    email: "member@example.com",
    role: "student",
  },
  [otherId.toString()]: {
    _id: otherId,
    name: "Other Student",
    email: "other@example.com",
    role: "student",
  },
};

const tokenFor = (userId) =>
  jwt.sign({ sub: userId.toString() }, JWT_SECRET, {
    expiresIn: "1h",
  });

const auth = (userId) => ({
  Authorization: `Bearer ${tokenFor(userId)}`,
});

const publicUser = (userId) => {
  const user = users[userId.toString()];

  return {
    _id: user._id,
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
};

const makeSession = (overrides = {}) => ({
  _id: sessionId,
  title: "Biology review",
  createdBy: ownerId,
  participants: [ownerId, memberId],
  ...overrides,
});

const makeTask = (overrides = {}) => ({
  _id: taskId,
  title: "Read chapter 4",
  description: "Review the assigned chapter.",
  session: sessionId,
  assignedTo: memberId,
  status: "todo",
  priority: "medium",
  dueDate: null,
  deleteOne: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Creates a mock Mongoose query that supports populate(), sort(), and select()
const queryFor = (value, transform = () => {}) => {
  const paths = [];

  const query = {
    populate: jest.fn((path) => {
      paths.push(path);
      return query;
    }),
    sort: jest.fn(() => query),
    select: jest.fn(() => query),

    then: (resolve, reject) => {
      const results = Array.isArray(value) ? value : [value];

      results.forEach((result) => {
        if (result) {
          transform(result, paths);
        }
      });

      return Promise.resolve(value).then(resolve, reject);
    },
  };

  return query;
};

const populateTask = (task, paths) => {
  if (paths.includes("session")) {
    task.session = makeSession();
  }

  if (paths.includes("assignedTo") && task.assignedTo) {
    task.assignedTo = publicUser(task.assignedTo._id || task.assignedTo);
  }
};

const populateTasks = (task) => queryFor(task, populateTask);

const taskInput = {
  title: "Read chapter 4",
  description: "Review the assigned chapter.",
  session: sessionId.toString(),
  priority: "medium",
};

describe("StudySync task API", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.resetAllMocks();

    User.findById.mockImplementation((id) => ({
      select: jest.fn().mockResolvedValue(users[id.toString()]),
    }));
  });

  test("session owners can create tasks", async () => {
    Session.findById.mockResolvedValue(makeSession());

    const createdTask = makeTask();
    Task.create.mockResolvedValue(createdTask);

    const response = await request(app)
      .post("/api/tasks")
      .set(auth(ownerId))
      .send(taskInput);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.task.title).toBe("Read chapter 4");

    expect(Task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: taskInput.title,
        session: sessionId.toString(),
      }),
    );
  });

  test("users can list tasks belonging to their sessions", async () => {
    Session.find.mockReturnValue(
      queryFor([{ _id: sessionId }]),
    );

    Task.find.mockReturnValue(
      populateTasks([makeTask()]),
    );

    const response = await request(app)
      .get("/api/tasks")
      .set(auth(memberId));

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.tasks).toHaveLength(1);

    expect(Session.find).toHaveBeenCalledWith({
      participants: memberId,
    });

    expect(Task.find).toHaveBeenCalledWith({
      session: { $in: [sessionId] },
    });
  });

  test("users can filter tasks by status", async () => {
    Session.find.mockReturnValue(
      queryFor([{ _id: sessionId }]),
    );

    Task.find.mockReturnValue(
      populateTasks([makeTask({ status: "done" })]),
    );

    const response = await request(app)
      .get("/api/tasks?status=done")
      .set(auth(memberId));

    expect(response.statusCode).toBe(200);
    expect(Task.find).toHaveBeenCalledWith({
      session: { $in: [sessionId] },
      status: "done",
    });
  });

  test("rejects an invalid task status filter", async () => {
    const response = await request(app)
      .get("/api/tasks?status=finished")
      .set(auth(ownerId));

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Task.find).not.toHaveBeenCalled();
  });

  test("session members can view an individual task", async () => {
    Task.findById.mockReturnValue(
      populateTasks(makeTask()),
    );

    const response = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set(auth(memberId));

    expect(response.statusCode).toBe(200);
    expect(response.body.task.title).toBe("Read chapter 4");
  });

  test("non-members cannot view another session's task", async () => {
    Task.findById.mockReturnValue(
      populateTasks(makeTask({
        session: makeSession({ participants: [ownerId] }),
      })),
    );

    const response = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set(auth(otherId));

    expect(response.statusCode).toBe(403);
  });

  test("only the session owner can update a task", async () => {
    Task.findById.mockResolvedValue(makeTask());
    Session.findById.mockResolvedValue(makeSession());

    const updatedTask = makeTask({ title: "Updated task" });
    Task.findByIdAndUpdate.mockReturnValue(
      populateTasks(updatedTask),
    );

    const response = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(auth(ownerId))
      .send({ title: "Updated task" });

    expect(response.statusCode).toBe(200);
    expect(response.body.task.title).toBe("Updated task");
  });

  test("non-owners cannot update a task", async () => {
    Task.findById.mockResolvedValue(makeTask());
    Session.findById.mockResolvedValue(makeSession());

    const response = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(auth(memberId))
      .send({ title: "Unauthorized update" });

    expect(response.statusCode).toBe(403);
    expect(Task.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test("the session owner can update task status", async () => {
    Task.findById.mockResolvedValue(makeTask());
    Session.findById.mockResolvedValue(makeSession());

    const updatedTask = makeTask({ status: "done" });
    Task.findByIdAndUpdate.mockReturnValue(
      populateTasks(updatedTask),
    );

    const response = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .set(auth(ownerId))
      .send({ status: "done" });

    expect(response.statusCode).toBe(200);
    expect(response.body.task.status).toBe("done");

    expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
      taskId.toString(),
      { status: "done" },
      { new: true, runValidators: true },
    );
  });

  test("rejects an invalid task status update", async () => {
    const response = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .set(auth(ownerId))
      .send({ status: "finished" });

    expect(response.statusCode).toBe(400);
    expect(Task.findById).not.toHaveBeenCalled();
  });

  test("the owner can assign a task to a session member", async () => {
    Task.findById.mockResolvedValue(makeTask());
    Session.findById.mockResolvedValue(makeSession());

    const updatedTask = makeTask();
    Task.findByIdAndUpdate.mockReturnValue(
      populateTasks(updatedTask),
    );

    const response = await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set(auth(ownerId))
      .send({ assignedTo: memberId.toString() });

    expect(response.statusCode).toBe(200);
    expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
      taskId.toString(),
      { assignedTo: memberId.toString() },
      { new: true, runValidators: true },
    );
  });

  test("cannot assign a task to someone outside the session", async () => {
    Task.findById.mockResolvedValue(makeTask());
    Session.findById.mockResolvedValue(makeSession());

    const response = await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set(auth(ownerId))
      .send({ assignedTo: otherId.toString() });

    expect(response.statusCode).toBe(400);
    expect(Task.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test("the owner can unassign a task", async () => {
    Task.findById.mockResolvedValue(makeTask());
    Session.findById.mockResolvedValue(makeSession());

    Task.findByIdAndUpdate.mockReturnValue(
      populateTasks(makeTask({ assignedTo: null })),
    );

    const response = await request(app)
      .put(`/api/tasks/${taskId}/assign`)
      .set(auth(ownerId))
      .send({ assignedTo: null });

    expect(response.statusCode).toBe(200);
    expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
      taskId.toString(),
      { assignedTo: null },
      { new: true, runValidators: true },
    );
  });

  test("the owner can delete a task", async () => {
    const task = makeTask();

    Task.findById.mockResolvedValue(task);
    Session.findById.mockResolvedValue(makeSession());

    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(auth(ownerId));

    expect(response.statusCode).toBe(200);
    expect(task.deleteOne).toHaveBeenCalled();
  });

  test("non-owners cannot delete tasks", async () => {
    const task = makeTask();

    Task.findById.mockResolvedValue(task);
    Session.findById.mockResolvedValue(makeSession());

    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(auth(memberId));

    expect(response.statusCode).toBe(403);
    expect(task.deleteOne).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated requests and invalid task IDs", async () => {
    const unauthenticatedResponse = await request(app)
      .get("/api/tasks");

    const invalidIdResponse = await request(app)
      .get("/api/tasks/not-an-id")
      .set(auth(ownerId));

    expect(unauthenticatedResponse.statusCode).toBe(401);
    expect(invalidIdResponse.statusCode).toBe(400);
  });
});
