const bcrypt = require("bcryptjs");
const request = require("supertest");

process.env.JWT_SECRET = "integration-test-only-jwt-secret";
process.env.JWT_EXPIRES_IN = "1h";

const app = require("../app");
const User = require("../models/User");
const {
  connectTestDB,
  disconnectTestDB,
} = require("./setupTestDB");

const registration = {
  name: "Integration Student",
  email: "integration@example.com",
  password: "Password123",
};

describe("Authentication API with the test database", () => {
  beforeAll(async () => {
    await connectTestDB();
    await User.init();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectTestDB();
  });

  test("registration supports the authenticated self-service CRUD flow", async () => {
    const registrationResponse = await request(app)
      .post("/api/auth/register")
      .send(registration);

    expect(registrationResponse.statusCode).toBe(201);
    const { token, user } = registrationResponse.body;

    const storedUser = await User.findById(user.id).select("+passwordHash");
    expect(storedUser).not.toBeNull();
    await expect(
      bcrypt.compare(registration.password, storedUser.passwordHash)
    ).resolves.toBe(true);

    const profileResponse = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.body.user.email).toBe(registration.email);

    const updateResponse = await request(app)
      .patch(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Integration Student" });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.user.name).toBe("Updated Integration Student");

    const deleteResponse = await request(app)
      .delete(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.statusCode).toBe(200);
    await expect(User.findById(user.id)).resolves.toBeNull();
  });

  test("registration rejects a duplicate email in the database", async () => {
    const firstResponse = await request(app)
      .post("/api/auth/register")
      .send(registration);
    const duplicateResponse = await request(app)
      .post("/api/auth/register")
      .send({ ...registration, name: "Duplicate Student" });

    expect(firstResponse.statusCode).toBe(201);
    expect(duplicateResponse.statusCode).toBe(409);
    expect(await User.countDocuments({ email: registration.email })).toBe(1);
  });

  test("login accepts the correct password and rejects an incorrect password", async () => {
    await request(app).post("/api/auth/register").send(registration);

    const validResponse = await request(app).post("/api/auth/login").send({
      email: registration.email,
      password: registration.password,
    });
    const invalidResponse = await request(app).post("/api/auth/login").send({
      email: registration.email,
      password: "WrongPassword123",
    });

    expect(validResponse.statusCode).toBe(200);
    expect(validResponse.body.token).toEqual(expect.any(String));
    expect(invalidResponse.statusCode).toBe(401);
  });

  test("only an administrator can list all users", async () => {
    const studentResponse = await request(app)
      .post("/api/auth/register")
      .send(registration);
    const passwordHash = await bcrypt.hash("AdminPassword123", 10);
    await User.create({
      name: "Integration Admin",
      email: "admin@example.com",
      passwordHash,
      role: "admin",
    });

    const studentListResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${studentResponse.body.token}`);
    const adminLoginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "AdminPassword123",
    });
    const adminListResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminLoginResponse.body.token}`);

    expect(studentListResponse.statusCode).toBe(403);
    expect(adminListResponse.statusCode).toBe(200);
    expect(adminListResponse.body.users).toHaveLength(2);
  });
});
