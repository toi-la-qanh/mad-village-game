const express = require("express");
const app = express();

// Load environment variables
require('@dotenvx/dotenvx').config()

/* Start the server */
const server = require("http").createServer(app);
const PORT = process.env.PORT || 3000;

// Bind to 0.0.0.0 (necessary for Render)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

/* Language Translation Setup */
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const i18nextMiddleware = require("i18next-http-middleware");
const path = require("path");

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    preload: ["en", "vi"],
    backend: {
      loadPath: path.join(__dirname, "locales/{{lng}}.json"),
    },
    detection: {
      order: ["querystring", "cookie", "header"],
      lookupQuerystring: "lang",
      caches: ["cookie"],
      cookieOptions: {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.sameSite,
        cookieDomain: process.env.cookieDomain, // for production
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    },
  });

app.use(i18nextMiddleware.handle(i18next));

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
const cors = require("cors");
const corsOptions = {
  origin: process.env.Frontend_URL,
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Handle preflight requests (OPTIONS)
app.options("*", cors(corsOptions));

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

app.set("trust proxy", 3 /* number of proxies between user and server */);

module.exports = app;
