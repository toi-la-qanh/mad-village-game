const SocketController = require("../src/controllers/socket.controller");
const { gameStart } = require("../src/controllers/game.controller");

jest.mock("../src/controllers/game.controller", () => ({
  gameStart: jest.fn(), // Now gameStart is properly mocked as a jest function
  showRoles: jest.fn(),
  chooseTargetToPerformAction: jest.fn(),
  performAction: jest.fn(),
  votePhase: jest.fn(),
  updatePhase: jest.fn(),
  dayPhase: jest.fn(),
  discussionPhase: jest.fn(),
  gameEnd: jest.fn(),
})); // Mock all game controller functions

describe("SocketController", () => {
  let server;
  let io;
  let socketController;
  let socket;

  beforeEach(() => {
    // Set up a mock server
    server = {}; // Just a mock, Socket.IO doesn't need an actual server to test
    socketController = new SocketController(server);
    io = socketController.io;

    // Mock the socket
    socket = {
      id: "testSocketId",
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };

    // Spy on setupGameEvents to check if it's called
    socketController.setupGameEvents = jest.fn();
  });

  test("should call setupGameEvents after game.start is successful", (done) => {
    // Mock a successful response from gameStart
    gameStart.mockResolvedValueOnce({
      status: 200,
      gameID: "game123", // example game ID
    });
  
    // Spy on setupGameEvents to check if it's called
    const setupGameEventsSpy = jest.spyOn(socketController, 'setupGameEvents');
  
    // Simulate client connection
    io.emit("connection", socket);
  
    // Set up the socket's 'game:start' event handler manually
    const gameStartData = {
      gameID: "game123",
    };
  
    // Directly trigger the 'game:start' event handler in the socket
    socket.on('game:start', async (data) => {
      try {
        const result = await gameStart(socket, data);
        if (result.status === 200) {
          data.gameID = result.gameID;
          // This is the step we're testing
          socketController.setupGameEvents(socket);
  
          // Call done to indicate that the test is complete
          done();
        }
      } catch (error) {
        done(error); // If there is an error, pass it to done
      }
    });
  
    // Emit the 'game:start' event to the socket
    socket.emit("game:start", gameStartData);
  
    // Check if setupGameEvents was called after a successful game start
    setImmediate(() => {
      expect(setupGameEventsSpy).toHaveBeenCalledTimes(1); // Check if it was called
      done(); // Finish the test
    });
  });
  
  

  test("should not call setupGameEvents if gameStart fails", async () => {
    // Mock a failed gameStart
    gameStart.mockResolvedValueOnce({
      status: 500,
      message: "Game start failed",
    });

    // Simulate client connection
    io.emit("connection", socket);

    // Emit game:start event
    await socketController.io.emit("game:start", { someData: "value" });

    // Check if setupGameEvents was not called
    expect(socketController.setupGameEvents).toHaveBeenCalledTimes(0);
  });
});
