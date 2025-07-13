const express = require("express");
const app = express();

// Load environment variables
require('@dotenvx/dotenvx').config();

/* Start the server */

const server = require("http").createServer(app);
const PORT = process.env.PORT || 3000;

// Bind to 0.0.0.0 (necessary for Render)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// Local
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// Connect to the database
const dbConnection = require("./database/db.js");
dbConnection();

// Redis client setup
const client = require("./database/redis.js");
client.connect();

// Middleware for parsing request bodies and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// CORS middleware
const cors = require('cors');
const corsOptions = {
  origin: process.env.Frontend_URL, 
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true,
};

app.use(cors(corsOptions));

// Handle preflight requests (OPTIONS)
app.options('*', cors(corsOptions));

// Root route
app.get("/", (req, res) => {
  res.send("Hello from the backend!");
});

/* Initialize socket.io */
const SocketController = require("./socketHandle/socket.controller.js");
new SocketController(server);

/* Routes */

const userRoutes = require("./routes/user.route.js");
const roomRoutes = require("./routes/room.route.js");
const gameRoutes = require("./routes/game.route.js");
const llmRoutes = require("./routes/llm.route.js");

app.use("/api/user", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/llm", llmRoutes);

// Cron jobs for production -> I've already removed this because free tier deploy doesnt have cron feature, instead I'm using https://console.cron-job.org to call api and update myself
// const checkForExpiringUsers = require("./cron/user.cron.js");
// checkForExpiringUsers();

// const updateLLMResponse = require("./cron/llm.cron.js");
// updateLLMResponse();

app.set('trust proxy', 3 /* number of proxies between user and server */);
// app.get('/ip', (request, response) => response.send(request.ip));

module.exports = app;