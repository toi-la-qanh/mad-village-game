const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dbConnection = require('./database/db.js');
const dotenv = require('dotenv');

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
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL); // Replace with your frontend domain
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE ,PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  next();
});

// Root route
app.get("/", (req, res) => {
  const nodeVersion = process.versions.node;
  const expressVersion = process.versions.express; 

  res.send(`This is back-end application with Node.js version ${nodeVersion} and Express version ${expressVersion}`);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});