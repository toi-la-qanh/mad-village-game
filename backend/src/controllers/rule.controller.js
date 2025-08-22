const Bully = require("../models/roles/bully.model");
const Hunter = require("../models/roles/hunter.model");
const Stalker = require("../models/roles/stalker.model");
const Villager = require("../models/roles/villager.model");
const Witch = require("../models/roles/witch.model");

class RuleController {
  /**
   * Rules for roles in the game
   */
  static rulesForRoles(numPlayers, roles) {
    // Check if roles is an array and not empty
    if (!Array.isArray(roles) || roles.length === 0) {
      return { rule: false, errors: "rules.errors.rolesEmpty" };
    }

    // Check that every element in roles is a string
    if (!roles.every((role) => typeof role === "string")) {
      return { rule: false, errors: "rules.errors.rolesInvalid" };
    }

    // Check if numPlayers is a positive number
    if (typeof numPlayers !== "number" || numPlayers <= 0) {
      return { rule: false, errors: "rules.errors.playerCountInvalid" };
    }

    // Check if the number of the roles is equal to the number of players
    if (roles.length !== numPlayers) {
      return {
        rule: false,
        errors: "rules.errors.rolesCountInvalid",
      };
    }

    const roleClasses = [
      new Bully(),
      new Hunter(),
      new Stalker(),
      new Witch(),
      new Villager(),
    ];

    const roleNames = roleClasses.map((role) => role.getName());

    for (const role of roles) {
      if (!roleNames.includes(role)) {
        return { rule: false, errors: "rules.errors.roleInvalid" };
      }
    }

    return { rule: true, errors: null };
  }

  /**
   * Rules for traits in the game
   */
  static rulesForTraits(numPlayers, traits) {
    // Check if traits is an array and not empty
    if (!Array.isArray(traits) || traits.length === 0) {
      return { rule: false, errors: "rules.errors.traitsEmpty" };
    }

    // Check that every element in traits is a string
    if (!traits.every((trait) => typeof trait === "string")) {
      return { rule: false, errors: "rules.errors.traitsInvalid" };
    }

    // Check if numPlayers is a positive number
    if (typeof numPlayers !== "number" || numPlayers <= 0) {
      return { rule: false, errors: "rules.errors.playerCountInvalid" };
    }

    // Check if the number of the traits is equal to the number of players
    if (traits.length !== numPlayers) {
      return {
        rule: false,
        errors: "rules.errors.traitsCountInvalid",
      };
    }

    // Get the number of good and bad traits
    const goodCount = traits.filter((trait) => trait === "good").length;
    const badCount = traits.filter((trait) => trait === "bad").length;

    // Check if there is at least one good trait
    if (goodCount < 1) {
      return {
        rule: false,
        errors: "rules.errors.traitsGoodCountMissing",
      };
    }

    // Check if the number of good traits is less than half the number of players
    if (goodCount >= Math.ceil(numPlayers / 2)) {
      return {
        rule: false,
        errors: "rules.errors.traitsGoodCountNotHalf",
      };
    }

    // Check if there is at least one bad trait
    if (badCount < 1) {
      return {
        rule: false,
        errors: "rules.errors.traitsBadCountMissing",
      };
    }

    // Check if the number of bad traits is less than half the number of players
    if (badCount >= Math.ceil(numPlayers / 2)) {
      return {
        rule: false,
        errors: "rules.errors.traitsBadCountNotHalf",
      };
    }

    return { rule: true, errors: null };
  }

  /**
   * Vote rule in the game
   */
  static voteRule(alivePlayers, voteCount) {
    // Check if alivePlayers is a positive number
    if (typeof alivePlayers !== "number" || alivePlayers <= 0) {
      return {
        status: "error",
        errors: "rules.errors.alivePlayersInvalid",
      };
    }

    // Check if voteCount is a positive number
    if (typeof voteCount !== "number" || voteCount <= 0) {
      return { status: "error", errors: "rules.errors.voteCountInvalid" };
    }

    // voteCount can not be less than half the number of alive players
    const requiredVotes = Math.ceil(alivePlayers / 2);
    if (voteCount < requiredVotes) {
      return false;
    }

    return true;
  }

  /**
   * Condition to end the game
   */
  static gameOver(alivePlayers, traits) {
    // Check if alivePlayers is a positive number
    if (typeof alivePlayers !== "number" || alivePlayers <= 0) {
      return {
        errors: "rules.errors.alivePlayersInvalid",
      };
    }

    // Check if traits is an array and not empty
    if (!Array.isArray(traits) || traits.length === 0) {
      return { errors: "rules.errors.traitsEmpty" };
    }

    // Check that every element in traits is a string
    if (!traits.every((trait) => typeof trait === "string")) {
      return { errors: "rules.errors.traitsMustBeString" };
    }

    // Get the number of bad traits
    const badCount = traits.filter((trait) => trait === "bad").length;

    // The game will be ended if there is no bad trait
    if (badCount < 1) {
      return {
        isOver: true,
        reason: "rules.messages.gameOverBadTraitsMissing",
        winner: "villager",
      };
    }

    /* 
    The game will be ended if the number of bad traits is 
    greater than or equal to the number of alive players 
    */
    if (badCount >= alivePlayers) {
      return {
        isOver: true,
        reason: "rules.messages.gameOverBadTraitsDominant",
        winner: "bad",
      };
    }

    return { isOver: false, reason: null, winner: null };
  }
}

module.exports = { RuleController };
