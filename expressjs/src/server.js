const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dbConnection = require("./database/db.js");
const dotenv = require("dotenv");
const userRoutes = require('./routes/user.route.js');
const roomRoutes = require('./routes/room.route.js');
const gameRoutes = require("./routes/game.route.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

dbConnection(); // Connect to the database

// Middleware for parsing request bodies and cookies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL); 
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE ,PATCH, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  next();
});

// Root route
app.get("/", (req, res) => {
  const nodeVersion = process.versions.node;

  res.send(`This is back-end application using Node.js version ${nodeVersion}`);
});

app.use("/api", userRoutes);
app.use("/api", roomRoutes);
app.use("/api", gameRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});