const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { parse } = require("cookie");

class SocketController {
  constructor(server) {
    this.io = this.init(server);
    this.setupSocketHandlers();
  }

  init(server) {
    // Initialize the Socket.IO server
    return new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
      },
    });
  }

  getIO() {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }

  setupSocketHandlers() {
    this.io.use((socket, next) => {
      // Access the cookies sent with the handshake
      const cookies = socket.request.headers.cookie;
      if (!cookies) {
        console.error("No cookies found in the request.");
        return next(new Error("Authentication error: No cookies found"));
      }
    
      const parsedCookies = parse(cookies);  // Parse cookies to get individual cookie values
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
    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      console.log("User connected:", socket.user);
      /*
      frontend call gameStart api if it's successful then emit game:start 
      backend listen to game:start then emit game data to the frontend and call game events
      */
      socket.on("game:start", (data) => {
        io.emit('game:started', data.game);
        this.setupGameEvents(socket, data.game);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  setupGameEvents(socket, data) {
    const { GameController } = require("../controllers/game.controller");
    const game = new GameController(socket, data);

    game.showRoles();
    game.chooseTargetToPerformAction();
    game.performAction();
    game.updatePhase();
    game.dayPhase();
    game.discussionPhase();
    game.votePhase();
  }
}

module.exports = SocketController;
