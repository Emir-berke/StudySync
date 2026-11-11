const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("supertest");

jest.mock("../models/User", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
}));

const User = require("../models/User");
const app = require("../app");

const JWT_SECRET = "test-only-jwt-secret";
const studentId = "507f1f77bcf86cd799439011";
const adminId = "507f1f77bcf86cd799439012";

const student = {
  _id: studentId,
  name: "Test Student",
  email: "student@example.com",
  role: "student",
};

const admin = {
  _id: adminId,
  name: "Test Admin",
  email: "admin@example.com",
  role: "admin",
};

const selectable = (value) => ({
  select: jest.fn().mockResolvedValue(value),
});

const tokenFor = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

describe("StudySync authentication and authorization", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_EXPIRES_IN = "1h";
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("POST /api/auth/register creates a user with a password hash", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockImplementation(async (data) => ({
      _id: studentId,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: "student",
    }));

    const response = await request(app).post("/api/auth/register").send({
      name: "Test Student",
      email: "STUDENT@example.com",
      password: "Password123",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: "student@example.com",
      role: "student",
    });
    expect(response.body.user.passwordHash).toBeUndefined();

    const createdUser = User.create.mock.calls[0][0];
    expect(createdUser.passwordHash).not.toBe("Password123");
    await expect(
      bcrypt.compare("Password123", createdUser.passwordHash)
    ).resolves.toBe(true);
  });

  test("POST /api/auth/register rejects duplicate emails", async () => {
    User.findOne.mockResolvedValue(student);

    const response = await request(app).post("/api/auth/register").send({
      name: "Another Student",
      email: "student@example.com",
      password: "Password123",
    });

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toMatch(/already exists/i);
    expect(User.create).not.toHaveBeenCalled();
  });

  test("POST /api/auth/register validates password strength", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Test Student",
      email: "student@example.com",
      password: "weak",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test("POST /api/auth/login returns a JWT for valid credentials", async () => {
    const passwordHash = await bcrypt.hash("Password123", 10);
    User.findOne.mockReturnValue(selectable({ ...student, passwordHash }));

    const response = await request(app).post("/api/auth/login").send({
      email: "student@example.com",
      password: "Password123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe(student.email);
  });

  test("POST /api/auth/login rejects invalid credentials", async () => {
    const passwordHash = await bcrypt.hash("Password123", 10);
    User.findOne.mockReturnValue(selectable({ ...student, passwordHash }));

    const response = await request(app).post("/api/auth/login").send({
      email: "student@example.com",
      password: "WrongPassword123",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  test("GET /api/users/me rejects a missing token", async () => {
    const response = await request(app).get("/api/users/me");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toMatch(/token is required/i);
  });

  test("GET /api/users/me returns the authenticated user", async () => {
    User.findById.mockReturnValue(selectable(student));

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toMatchObject({
      id: studentId,
      email: student.email,
      role: "student",
    });
  });

  test("GET /api/users/me rejects an invalid token", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toMatch(/invalid or expired/i);
  });

  test("GET /api/users rejects a student role", async () => {
    User.findById.mockReturnValue(selectable(student));

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toMatch(/permission/i);
  });

  test("GET /api/users allows an administrator", async () => {
    User.findById.mockReturnValue(selectable(admin));
    User.find.mockReturnValue(selectable([student]));

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0].email).toBe(student.email);
  });

  test("GET /api/users/:id prevents access to another student's account", async () => {
    User.findById.mockReturnValue(selectable(student));

    const response = await request(app)
      .get(`/api/users/${adminId}`)
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toMatch(/permission/i);
  });

  test("PATCH /api/users/:id lets a student update their own profile", async () => {
    const updatedStudent = { ...student, name: "Updated Student" };
    User.findById.mockReturnValue(selectable(student));
    User.findByIdAndUpdate.mockReturnValue(selectable(updatedStudent));

    const response = await request(app)
      .patch(`/api/users/${studentId}`)
      .set("Authorization", `Bearer ${tokenFor(student)}`)
      .send({ name: "Updated Student" });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.name).toBe("Updated Student");
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      studentId,
      { name: "Updated Student" },
      { returnDocument: "after", runValidators: true }
    );
  });

  test("PATCH /api/users/:id prevents a student from changing roles", async () => {
    User.findById.mockReturnValue(selectable(student));

    const response = await request(app)
      .patch(`/api/users/${studentId}`)
      .set("Authorization", `Bearer ${tokenFor(student)}`)
      .send({ role: "admin" });

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toMatch(/administrator/i);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test("DELETE /api/users/:id lets a student delete their own account", async () => {
    User.findById.mockReturnValue(selectable(student));
    User.findByIdAndDelete.mockResolvedValue(student);

    const response = await request(app)
      .delete(`/api/users/${studentId}`)
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("User deleted");
  });
});
