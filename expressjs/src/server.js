const express = require("express");
const app = express();

/* Start the server */

const server = require("http").createServer(app);
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Load environment variables
const dotenv = require("dotenv");
dotenv.config();

// Connect to the database
const dbConnection = require("./database/db.js");
dbConnection();

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
  allowedHeaders: ['Content-Type'], 
  credentials: true,
};

app.use(cors(corsOptions));

// Root route
app.get("/", (req, res) => {
  const nodeVersion = process.versions.node;

  res.send(`This is back-end application using Node.js version ${nodeVersion}`);
});

/* Initialize socket.io */
const SocketController = require("./socketHandle/socket.controller.js");
new SocketController(server);

/* Routes */

const userRoutes = require("./routes/user.route.js");
const roomRoutes = require("./routes/room.route.js");
const gameRoutes = require("./routes/game.route.js");

app.use("/api/user", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/game", gameRoutes);
module.exports = app;
