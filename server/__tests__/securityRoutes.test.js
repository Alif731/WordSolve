import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const learningRoutes = require("../routes/learningRoutes");
const teacherRoutes = require("../routes/teacherRoutes");
const userRoutes = require("../routes/userRoutes");
const Attempt = require("../models/Attempt");
const Concept = require("../models/Concept");
const TeacherSignupCode = require("../models/TeacherSignupCode");
const User = require("../models/User");
const { csrfGuard } = require("../middleware/csrfMiddleware");

const JWT_SECRET = "test-secret-123456789012345678901234";

let mongoServer;
let app;

const createToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });

const authCookie = (userId) => [`jwt=${createToken(userId)}`];

const createApp = () => {
  const testApp = express();

  testApp.use(express.json());
  // codeql[js/missing-token-validation]
  // cookieParser is flagged by CodeQL because of cookie usage.
  // Custom CSRF protection is implemented immediately below via the csrfGuard middleware.
  testApp.use(cookieParser());
  testApp.use(csrfGuard);
  testApp.use("/api/learning", learningRoutes);
  testApp.use("/api/teacher", teacherRoutes);
  testApp.use("/api/users", userRoutes);

  const { errorHandler } = require("../middleware/errorMiddleware");
  testApp.use(errorHandler);

  return testApp;
};

const createUser = (overrides = {}) =>
  User.create({
    username: overrides.username || `user_${new mongoose.Types.ObjectId()}`,
    password: "password123",
    role: overrides.role || "student",
    mastery: overrides.mastery || {},
    zpdNodes: overrides.zpdNodes || [],
    issuedQuestion: overrides.issuedQuestion || null,
  });

const createConcept = () =>
  Concept.create({
    id: "single_add",
    title: "Single Addition",
    description: "Test concept",
    prerequisites: [],
    questions: [
      {
        text: "What is 2 + 3?",
        correctAnswer: "5",
        type: "direct",
      },
    ],
  });

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.NODE_ENV = "test";

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = createApp();
});

afterEach(async () => {
  await Promise.all([
    Attempt.deleteMany({}),
    Concept.deleteMany({}),
    TeacherSignupCode.deleteMany({}),
    User.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("teacher stats authorization", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/teacher/stats");

    expect(response.status).toBe(401);
  });

  it("rejects authenticated students", async () => {
    const student = await createUser({ role: "student" });

    const response = await request(app)
      .get("/api/teacher/stats")
      .set("Cookie", authCookie(student._id));

    expect(response.status).toBe(403);
  });

  it("allows authenticated teachers", async () => {
    const teacher = await createUser({ role: "teacher" });
    await createUser({
      role: "student",
      mastery: {
        single_add: {
          status: "unlocked",
          attemptCount: 1,
          successCount: 1,
          lastAttempts: [true],
        },
      },
    });

    const response = await request(app)
      .get("/api/teacher/stats")
      .set("Cookie", authCookie(teacher._id));

    expect(response.status).toBe(200);
    expect(response.body.classroomData).toHaveLength(1);
  });
});

describe("account input validation", () => {
  it("rejects weak passwords during registration", async () => {
    const response = await request(app).post("/api/users").send({
      username: "student_one",
      password: "abcdef",
      role: "student",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/number/i);
  });

  it("rejects unsafe usernames during registration", async () => {
    const response = await request(app).post("/api/users").send({
      username: "<script>alert(1)</script>",
      password: "password123",
      role: "student",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/username/i);
  });

  it("rejects invalid profile usernames and avatar styles", async () => {
    const student = await createUser({ username: "student_one" });
    const cookie = authCookie(student._id);

    await request(app)
      .put("/api/users/profile")
      .set("Cookie", cookie)
      .send({ username: "bad name!" })
      .expect(400);

    await request(app)
      .put("/api/users/profile")
      .set("Cookie", cookie)
      .send({ avatar: "not-a-real-style" })
      .expect(400);
  });
});

describe("learning submission authorization and validation", () => {
  it("records the issued question when a problem is fetched", async () => {
    await createConcept();
    const student = await createUser();

    const response = await request(app)
      .get("/api/learning/problem")
      .set("Cookie", authCookie(student._id));

    expect(response.status).toBe(200);
    expect(response.body.concept.id).toBe("single_add");

    const updatedUser = await User.findById(student._id);
    expect(updatedUser.issuedQuestion.conceptId).toBe("single_add");
    expect(updatedUser.issuedQuestion.questionId).toBe(response.body.question.id);
  });

  it("accepts the currently issued question and clears it after submit", async () => {
    const concept = await createConcept();
    const questionId = String(concept.questions[0]._id);
    const student = await createUser({
      zpdNodes: ["single_add"],
      issuedQuestion: {
        conceptId: "single_add",
        questionId,
        issuedAt: new Date(),
      },
    });

    const response = await request(app)
      .post("/api/learning/submit")
      .set("Cookie", authCookie(student._id))
      .send({
        conceptId: "single_add",
        questionId,
        response: "5",
      });

    expect(response.status).toBe(200);
    expect(response.body.isCorrect).toBe(true);

    const updatedUser = await User.findById(student._id);
    expect(updatedUser.issuedQuestion).toBeNull();
  });

  it("rejects submissions when no question has been issued", async () => {
    const concept = await createConcept();
    const student = await createUser({ zpdNodes: ["single_add"] });

    const response = await request(app)
      .post("/api/learning/submit")
      .set("Cookie", authCookie(student._id))
      .send({
        conceptId: "single_add",
        questionId: String(concept.questions[0]._id),
        response: "5",
      });

    expect(response.status).toBe(409);
  });

  it("rejects replaying the same issued question after submission", async () => {
    const concept = await createConcept();
    const questionId = String(concept.questions[0]._id);
    const student = await createUser({
      zpdNodes: ["single_add"],
      issuedQuestion: {
        conceptId: "single_add",
        questionId,
        issuedAt: new Date(),
      },
    });
    const payload = {
      conceptId: "single_add",
      questionId,
      response: "5",
    };

    await request(app)
      .post("/api/learning/submit")
      .set("Cookie", authCookie(student._id))
      .send(payload)
      .expect(200);

    const replayResponse = await request(app)
      .post("/api/learning/submit")
      .set("Cookie", authCookie(student._id))
      .send(payload);

    expect(replayResponse.status).toBe(409);
  });

  it("rejects malformed IDs and oversized responses", async () => {
    const concept = await createConcept();
    const questionId = String(concept.questions[0]._id);
    const student = await createUser({
      issuedQuestion: {
        conceptId: "single_add",
        questionId,
        issuedAt: new Date(),
      },
    });
    const cookie = authCookie(student._id);

    await request(app)
      .post("/api/learning/submit")
      .set("Cookie", cookie)
      .send({
        conceptId: { $ne: null },
        questionId,
        response: "5",
      })
      .expect(400);

    await request(app)
      .post("/api/learning/submit")
      .set("Cookie", cookie)
      .send({
        conceptId: "single_add",
        questionId: "not-an-object-id",
        response: "5",
      })
      .expect(400);

    await request(app)
      .post("/api/learning/submit")
      .set("Cookie", cookie)
      .send({
        conceptId: "single_add",
        questionId,
        response: "x".repeat(12_001),
      })
      .expect(400);
  });
});

describe("CSRF Origin Validation", () => {
  it("rejects cross-origin requests from untrusted origins", async () => {
    const response = await request(app)
      .post("/api/users/auth")
      .set("Origin", "http://evil-website.com")
      .send({
        username: "student_one",
        password: "password123",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/CSRF Token Validation Failed/i);
  });

  it("accepts requests from the trusted client origin", async () => {
    const response = await request(app)
      .post("/api/users/auth")
      .set("Origin", "http://localhost:5173")
      .send({
        username: "nonexistent_user",
        password: "password123",
      });

    // We expect a 401 because the user is not found, NOT a 403 CSRF error
    expect(response.status).toBe(401);
  });
});
