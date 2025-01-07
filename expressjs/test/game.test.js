const SocketController = require("../src/socketHandle/socket.controller");
const { init } = require("../src/socketHandle/socket");
const {
  gameEnd,
  showRoles,
  chooseTargetToPerformAction,
  performAction,
  votePhase,
  updatePhase,
  dayPhase,
  discussionPhase,
} = require("../src/controllers/game.controller");

jest.mock("../src/socketHandle/socket", () => ({
  init: jest.fn().mockReturnValue({
    on: jest.fn(),
    emit: jest.fn(),
  }),
}));

jest.mock("../src/controllers/game.controller", () => ({
  gameStart: jest.fn(),
  showRoles: jest.fn(),
  chooseTargetToPerformAction: jest.fn(),
  performAction: jest.fn(),
  votePhase: jest.fn(),
  updatePhase: jest.fn(),
  dayPhase: jest.fn(),
  discussionPhase: jest.fn(),
}));

describe("SocketController", () => {
  let socketController;
  let mockServer;
  let mockSocket;

  beforeEach(() => {
    mockServer = {}; // Mock server object
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      id: "testSocketId",
    };

    // Initialize SocketController instance
    socketController = new SocketController(mockServer);
  });

  it("should initialize socket connection", () => {
    expect(init).toHaveBeenCalledWith(mockServer);
    expect(socketController.io.on).toHaveBeenCalledWith(
      "connection",
      expect.any(Function)
    );
  });

  it("should handle game start event", async () => {
    const gameStartData = { gameID: "12345" };
    const gameStartResult = { status: 200, game: { _id: "12345" } };
    gameController.gameStart.mockResolvedValue(gameStartResult);

    // Simulate the 'game:start' event
    const connectionHandler = socketController.io.on.mock.calls[0][1];
    await connectionHandler(mockSocket);

    mockSocket.on.mock.calls[0][1](gameStartData); // Trigger the game:start handler

    // Wait for the setupGameEvents to complete (after successful game start)
    await gameController.gameStart(mockSocket, gameStartData);

    expect(gameController.gameStart).toHaveBeenCalledWith(
      mockSocket,
      gameStartData
    );
    expect(gameStartResult.status).toBe(200);
    expect(mockSocket.on).toHaveBeenCalledWith(
      "game:showRoles",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "game:chooseTarget",
      expect.any(Function)
    );
  });

  it("should call setupGameEvents after successful game start", async () => {
    const gameStartData = { gameID: "12345" };
    const gameStartResult = { status: 200, game: { _id: "12345" } };
    gameStart.mockResolvedValue(gameStartResult);

    const connectionHandler = socketController.io.on.mock.calls[0][1];
    await connectionHandler(mockSocket);

    // Trigger 'game:start' event
    mockSocket.on.mock.calls[0][1](gameStartData);

    // Wait for the setupGameEvents to complete (after successful game start)
    await gameStart(mockSocket, gameStartData);

    // Test if setupGameEvents is called after game start
    expect(mockSocket.on).toHaveBeenCalledWith(
      "game:showRoles",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "game:chooseTarget",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "game:performAction",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "game:updatePhase",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "game:dayPhase",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "game:discuss",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "game:vote",
      expect.any(Function)
    );
  });

  it("should handle socket disconnection", () => {
    const connectionHandler = socketController.io.on.mock.calls[0][1];
    connectionHandler(mockSocket); // Simulate a connection

    // Check that the disconnect handler is set up
    expect(mockSocket.on).toHaveBeenCalledWith(
      "disconnect",
      expect.any(Function)
    );

    // Now trigger the 'disconnect' event
    const disconnectHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === "disconnect"
    )[1]; // Extract the actual disconnect handler

    // Simulate the disconnect event
    disconnectHandler();

    expect(console.log("Client disconnected:", "testSocketId"));
  });

  it("should mock game controller methods", async () => {
    const gameData = { gameID: "12345" };
    showRoles.mockResolvedValue("Roles displayed");

    const connectionHandler = socketController.io.on.mock.calls[0][1];
    await connectionHandler(mockSocket);

    mockSocket.on.mock.calls[0][1](gameData); // Trigger 'game:showRoles'
    expect(showRoles).toHaveBeenCalledWith(mockSocket, gameData);
    expect(mockSocket.emit).toHaveBeenCalledWith("Roles displayed");
  });
});
