const jwt = require("jsonwebtoken");
const { parse } = require("cookie");
const socket = require("./socket");

class SocketController {
  constructor(server) {
    if (!server) {
      throw new Error(
        "Server instance is required to initialize SocketController"
      );
    }
    this.io = socket.init(server);
    this.gameData = null;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use((socket, next) => {
      // Access the cookies sent with the handshake
      const cookies = socket.request.headers.cookie;
      if (!cookies) {
        console.error("No cookies found in the request.");
        return next(new Error("Authentication error: No cookies found"));
      }

      const parsedCookies = parse(cookies); // Parse cookies to get individual cookie values
      const token = parsedCookies.token;

      if (!token) {
        // Reject the connection if there is no token in the cookies
        return next(new Error("Authentication error: No token found"));
      }

      // Optionally, verify the token if necessary
      jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
        if (err) {
          return next(new Error("Authentication error: Invalid token"));
        }

        // Store the decoded token (e.g., user ID) on the socket for later use
        socket.user = decoded.id; // Add user info to socket object

        // Proceed with the connection
        next();
      });
    });

    this.io.on("connection", async (socket) => {
      console.log("User connected:", socket.user);
      /*
      frontend call gameStart api, then emit game:start 
      backend listen to 'game:start' event then emit game data to the frontend and call game events
      */
      this.setupRoomEvents(socket);
      this.setupRoles(socket);
      this.setupGameEvents(socket);

      socket.on("disconnect", (reason) => {
        console.log(`User ${socket.user} has disconnected because ${reason}`);
        delete socket.user;
      });
    });
  }

  setupRoomEvents(socket) {
    const { RoomController } = require("../controllers/room.controller");
    RoomController.listenForEvents(this.io, socket);
  }

  setupRoles(socket) {
    const { RoleController } = require("../controllers/role.controller");
    RoleController.listenForEvents(this.io, socket);
  }
  setupGameEvents(socket) {
    const { GameController } = require("../controllers/game.controller");
    const gameController = new GameController(this.io, socket);
    gameController.listenForEvents();
  }
}

module.exports = SocketController;
