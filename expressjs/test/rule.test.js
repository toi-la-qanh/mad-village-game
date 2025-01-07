const { gameOver } = require("../src/controllers/rule.controller");

describe("gameOver function", () => {
  it("should return game over when only 1 player is alive", () => {
    expect(gameOver(1)).toEqual({
      isOver: true,
      reason: "Trò chơi đã kết thúc vì chỉ còn 1 người sống !",
      winner: null,
    });
  });

  it("should return game over when no bad players are left", () => {
    expect(gameOver(2, [])).toEqual({
      isOver: true,
      reason: "Trò chơi đã kết thúc vì không còn kẻ xấu !",
      winner: "villager",
    });
  });

  it("should return game over when bad players are majority", () => {
    expect(gameOver(2, ["bad", "bad"])).toEqual({
      isOver: true,
      reason: "Trò chơi đã kết thúc vì số lượng kẻ xấu đã chiếm đa số !",
      winner: "bad",
    });
  });

  it("should continue the game when multiple players are alive and bad players exist", () => {
    expect(gameOver(3, ["bad", "good"])).toEqual({
      isOver: false,
      reason: null,
      winner: null,
    });
  });

  it("should handle edge case with zero alive players", () => {
    expect(gameOver(0)).toEqual({
      isOver: true,
      reason: "Trò chơi đã kết thúc vì chỉ còn 1 người sống !",
      winner: null,
    });
  });
});
