const { RuleController } = require("../../src/controllers/rule.controller");

describe("RuleController", () => {
  describe("rulesForRoles", () => {
    it("should return invalid when roles is not an array and empty", () => {
      expect(RuleController.rulesForRoles(2, "Witch")).toEqual({
        rule: false,
        errors: "rules.errors.rolesEmpty",
      });
    });

    it("should return invalid when roles is empty", () => {
      expect(RuleController.rulesForRoles(2, [])).toEqual({
        rule: false,
        errors: "rules.errors.rolesEmpty",
      });
    });

    it("should return invalid when roles is not a string", () => {
      expect(RuleController.rulesForRoles(2, [1, 2])).toEqual({
        rule: false,
        errors: "rules.errors.rolesInvalid",
      });
    });

    it("should return invalid when numPlayers is not a number", () => {
      expect(RuleController.rulesForRoles("a", ["Witch"])).toEqual({
        rule: false,
        errors: "rules.errors.playerCountInvalid",
      });
    });

    it("should return invalid when numPlayers is less than 0", () => {
      expect(RuleController.rulesForRoles(-1, ["Witch"])).toEqual({
        rule: false,
        errors: "rules.errors.playerCountInvalid",
      });
    });

    it("should return invalid when numPlayers is different from roles length", () => {
      expect(
        RuleController.rulesForRoles(2, ["Witch", "Witch", "Witch"])
      ).toEqual({
        rule: false,
        errors: "rules.errors.rolesCountInvalid",
      });
    });

    it("should return invalid when roles are not matching with roleClasses", () => {
      expect(RuleController.rulesForRoles(2, ["Witch", "Witches"])).toEqual({
        rule: false,
        errors: "rules.errors.roleInvalid",
      });
    });

    it("should return valid when input is correct", () => {
      expect(RuleController.rulesForRoles(2, ["Witch", "Witch"])).toEqual({
        rule: true,
        errors: null,
      });
    });
  });

  describe("rulesForTraits", () => {
    it("should return invalid when traits is not an array", () => {
      expect(RuleController.rulesForTraits(2, "good")).toEqual({
        rule: false,
        errors: "rules.errors.traitsEmpty",
      });
    });

    it("should return invalid when traits is empty", () => {
      expect(RuleController.rulesForTraits(2, [])).toEqual({
        rule: false,
        errors: "rules.errors.traitsEmpty",
      });
    });

    it("should return invalid when every element in traits are not a string", () => {
      expect(RuleController.rulesForTraits(2, [1, 2])).toEqual({
        rule: false,
        errors: "rules.errors.traitsInvalid",
      });
    });

    it("should return invalid when numPlayers is not a number", () => {
      expect(RuleController.rulesForTraits("a", ["good"])).toEqual({
        rule: false,
        errors: "rules.errors.playerCountInvalid",
      });
    });

    it("should return invalid when numPlayers is less than 0", () => {
      expect(RuleController.rulesForTraits(-1, ["good"])).toEqual({
        rule: false,
        errors: "rules.errors.playerCountInvalid",
      });
    });

    it("should return invalid when numPlayers is different from traits length", () => {
      expect(
        RuleController.rulesForTraits(2, ["good", "good", "good"])
      ).toEqual({
        rule: false,
        errors: "rules.errors.traitsCountInvalid",
      });
    });

    it("should return invalid when there is no good trait", () => {
      expect(RuleController.rulesForTraits(2, ["bad", "bad"])).toEqual({
        rule: false,
        errors: "rules.errors.traitsGoodCountMissing",
      });
    });

    it("should return invalid when good traits are more than half of the players", () => {
      expect(RuleController.rulesForTraits(3, ["good", "good", "bad"])).toEqual(
        {
          rule: false,
          errors: "rules.errors.traitsGoodCountNotHalf",
        }
      );
    });

    it("should return invalid when there is no bad trait", () => {
      expect(
        RuleController.rulesForTraits(4, ["good", "mad", "mad", "mad"])
      ).toEqual({
        rule: false,
        errors: "rules.errors.traitsBadCountMissing",
      });
    });

    it("should return invalid when bad traits are more than half of the players", () => {
      expect(RuleController.rulesForTraits(3, ["bad", "bad", "good"])).toEqual({
        rule: false,
        errors: "rules.errors.traitsBadCountNotHalf",
      });
    });

    it("should return valid when traits input is correct", () => {
      expect(
        RuleController.rulesForTraits(4, ["good", "bad", "mad", "mad"])
      ).toEqual({
        rule: true,
        errors: null,
      });
    });
  });

  describe("voteRule", () => {
    it("should return invalid when alivePlayers is not a number", () => {
      expect(RuleController.voteRule("a", 2)).toEqual({
        status: "error",
        errors: "rules.errors.alivePlayersInvalid",
      });
    });

    it("should return invalid when alivePlayers is less than 0", () => {
      expect(RuleController.voteRule(-1, 2)).toEqual({
        status: "error",
        errors: "rules.errors.alivePlayersInvalid",
      });
    });

    it("should return invalid when voteCount is not a number", () => {
      expect(RuleController.voteRule(2, "a")).toEqual({
        status: "error",
        errors: "rules.errors.voteCountInvalid",
      });
    });

    it("should return invalid when voteCount is less than 0", () => {
      expect(RuleController.voteRule(2, -1)).toEqual({
        status: "error",
        errors: "rules.errors.voteCountInvalid",
      });
    });

    it("should return false when voteCount is less than half of the alivePlayers", () => {
      expect(RuleController.voteRule(6, 2)).toBe(false);
    });

    it("should return true when voteCount is greater than half of the alivePlayers", () => {
      expect(RuleController.voteRule(6, 4)).toBe(true);
    });

    it("should return true when voteCount is equal to half of the alivePlayers", () => {
      expect(RuleController.voteRule(6, 3)).toBe(true);
    });
  });

  describe("gameOver", () => {
    it("should return game over when no bad players are left", () => {
      expect(RuleController.gameOver(2, ["good", "good"])).toEqual({
        isOver: true,
        reason: "rules.messages.gameOverBadTraitsMissing",
        winner: "villager",
      });
    });

    it("should return game over when bad players are majority", () => {
      expect(RuleController.gameOver(2, ["bad", "bad"])).toEqual({
        isOver: true,
        reason: "rules.messages.gameOverBadTraitsDominant",
        winner: "bad",
      });
    });

    it("should continue the game when multiple players are alive and bad players exist", () => {
      expect(RuleController.gameOver(3, ["bad", "good"])).toEqual({
        isOver: false,
        reason: null,
        winner: null,
      });
    });

    it("should return invalid when alivePlayers less than 0", () => {
      expect(RuleController.gameOver(-1, [])).toEqual({
        errors: "rules.errors.alivePlayersInvalid",
      });
    });

    it("should return invalid when alivePlayers is not a number", () => {
      expect(RuleController.gameOver("a", [])).toEqual({
        errors: "rules.errors.alivePlayersInvalid",
      });
    });
  });
});
