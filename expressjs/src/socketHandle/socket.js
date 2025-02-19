const { Server } = require("socket.io");
let io;
module.exports = {
  init: (server) => {
    // Initialize the Socket.IO server
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
