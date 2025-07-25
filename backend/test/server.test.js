const request = require("supertest");
const app = require("../src/server");
const socketClient = require("socket.io-client");
const jwt = require("jsonwebtoken");

// Teardown: close DB and Redis connections after all tests
const mongoose = require("mongoose");
const redisClient = require("../src/database/redis");

afterAll(async () => {
  // Close mongoose connection if open
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  // Quit Redis client if open
  if (redisClient && redisClient.quit) {
    await redisClient.quit();
  }
});

describe("Express Server", () => {
  it("should return Hello from the backend! on GET /", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Hello from the backend!");
  });

  it("should connect to Socket.io with a cookie", (done) => {
    const token = jwt.sign({ userId: "testUserId" }, process.env.TOKEN_KEY, {
      expiresIn: "1h",
    });

    const socket = socketClient(`http://localhost:${process.env.PORT}`, {
      withCredentials: true,
      extraHeaders: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      autoConnect: true,
      reconnection: true, // Enable reconnection
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelay: 1000,
    });
    socket.on("connect", () => {
      expect(socket.connected).toBe(true);
      socket.disconnect();
      done();
    });

    socket.on("connect_error", (err) => {
      done(err);
    });
  });

  it("should return 401 for /api/user", async () => {
    const res = await request(app).get("/api/user");
    expect(res.statusCode).toBe(401);
  });

  it("should return 404 with correct error message or 200 for /api/rooms", async () => {
    const res = await request(app).get("/api/rooms?lng=en");
    if (res.statusCode === 200) {
      expect(res.statusCode).toBe(200);
    } else if (res.statusCode === 404) {
      expect(res.body).toHaveProperty("errors");
      expect(res.body.errors).toBe("No rooms available");
    } else {
      throw new Error(`Unexpected status code: ${res.statusCode}`);
    }
  });

  it("should return 200 for /api/game/roles", async () => {
    const res = await request(app).get("/api/game/roles");
    expect(res.statusCode).toBe(200);
  });

  it("should return 200 for /api/llm/instruction", async () => {
    const res = await request(app).get("/api/llm/instruction");
    expect(res.statusCode).toBe(200);
  });
});
