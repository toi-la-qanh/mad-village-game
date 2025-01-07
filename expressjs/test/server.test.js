const request = require("supertest");
const app = require("../src/server");
const dbConnection = require("../src/database/db");
const dotenv = require("dotenv");
dotenv.config();

jest.mock("../src/database/db", () => jest.fn());  // Mock the database connection

const socketClient = require("socket.io-client");
const { Server } = require("http");

describe("Socket.IO Authentication", () => {
  let server;
  let cookie;

  beforeAll(async () => {
    jest.setTimeout(30000);
    // Start the server
    server = new Server(app);

    // You can mock your DB connection here if you need
    dbConnection.mockResolvedValue(true);

    // Simulate login to get a cookie
    const loginResponse = await request(app)
      .post("/api/user/signin")  // Adjust this to your actual login route
      .send({ name: "qanh6" }); // Adjust with your actual login data

      console.log("Login response headers:", loginResponse.headers); 
    // Get the cookie from the response
    cookie = loginResponse.headers["set-cookie"][0]; // Get the cookie
  });

  afterAll(() => {
    server.close();  // Close the server after the tests
  });

  it("should have the cookie when the user connects via WebSocket", (done) => {
    // Set up the socket connection using the cookie
    const socketOptions = {
      transportOptions: {
        polling: {
          extraHeaders: {
            Cookie: cookie,  // Send the cookie with the WebSocket connection
          },
        },
      },
    };

    // Create a socket connection to the server with the cookie
    const socket = socketClient(`http://localhost:${process.env.PORT || 3000}`, socketOptions);

    socket.on("connect", () => {
      // Successfully connected, now check if the cookie was handled
      console.log("Socket connected with cookie", cookie);
      
      // Check that the connection was successful and that the cookie was used for authentication
      // You can also check the server logs or response based on your logic
      expect(socket.connected).toBe(true);

      // Close the socket after the test
      socket.close();
      done();
    });

    socket.on("connect_error", (err) => {
      // If the connection failed, report the error
      console.log("Connection error:", err.message);
      done(err);
    });
  });
});

// describe("Express server", () => {
  
//   beforeAll(() => {
//     // Here you can set up any global configurations if needed
//   });

//   afterAll(() => {
//     // Clean up after tests
//     dbConnection.mockRestore();
//   });

//   it("should respond with Node.js version on GET /", async () => {
//     const response = await request(app).get("/");
//     expect(response.status).toBe(200);
//   });

//   it("should return a 404 for a non-existent route", async () => {
//     const response = await request(app).get("/nonexistent-route");
//     expect(response.status).toBe(404);
//   });

//   describe("CORS Middleware", () => {
//     it("should set correct CORS headers", async () => {
//       const response = await request(app).get("/");
//       expect(response.headers["access-control-allow-origin"]).toBe(process.env.FRONTEND_URL);
//       expect(response.headers["access-control-allow-methods"]).toBe("GET, POST, PUT, DELETE ,PATCH, OPTIONS");
//       expect(response.headers["access-control-allow-credentials"]).toBe("true");
//     });
//   });

//   describe("Socket Controller", () => {
//     it("should successfully initialize SocketController", () => {
//       const SocketController = require("../src/socketHandle/socket.controller");
//       const socketControllerInstance = new SocketController();
//       expect(socketControllerInstance).toBeInstanceOf(SocketController);
//     });
//   });
// });