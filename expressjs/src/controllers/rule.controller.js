const Bully = require("../models/roles/bully.model");
const Hunter = require("../models/roles/hunter.model");
const Stalker = require("../models/roles/stalker.model");
const Villager = require("../models/roles/villager.model");
const Witch = require("../models/roles/witch.model");

class RuleController {
  /* Rules for roles */
  static rulesForRoles(numPlayers, roles) {
    // Check if roles is an array and not empty
    if (!Array.isArray(roles) || roles.length === 0) {
      return { rule: false, errors: "Vai trò không được để trống!" };
    }

    // Check that every element in roles is a string
    if (!roles.every((role) => typeof role === "string")) {
      return { rule: false, errors: "Mỗi vai trò phải là một chuỗi!" };
    }

    // Check if numPlayers is a positive number
    if (typeof numPlayers !== "number" || numPlayers <= 0) {
      return { rule: false, errors: "Số người chơi phải là số dương!" };
    }

    // Check if the number of the roles is equal to the number of players
    if (roles.length !== numPlayers) {
      return {
        rule: false,
        errors: "Số lượng vai trò phải bằng với số người chơi !",
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
        return { rule: false, errors: "Vai trò không hợp lệ !" };
      }
    }

    return { rule: true, errors: null };
  }

  /* Rules for traits */
  static rulesForTraits(numPlayers, traits) {
    // Check if traits is an array and not empty
    if (!Array.isArray(traits) || traits.length === 0) {
      return { rule: false, errors: "Thuộc tính không được để trống!" };
    }

    // Check that every element in traits is a string
    if (!traits.every((trait) => typeof trait === "string")) {
      return { rule: false, errors: "Mỗi thuộc tính phải là một chuỗi!" };
    }

    // Check if numPlayers is a positive number
    if (typeof numPlayers !== "number" || numPlayers <= 0) {
      return { rule: false, errors: "Số người chơi phải là số dương!" };
    }

    // Check if the number of the traits is equal to the number of players
    if (traits.length !== numPlayers) {
      return {
        rule: false,
        errors: "Số lượng thuộc tính phải bằng với số người chơi !",
      };
    }

    // Get the number of good and bad traits
    const goodCount = traits.filter((trait) => trait === "good").length;
    const badCount = traits.filter((trait) => trait === "bad").length;

    // Check if there is at least one good trait
    if (goodCount < 1) {
      return {
        rule: false,
        errors: "Thiếu vai trò với thuộc tính tốt !",
      };
    }

    // Check if the number of good traits is less than half the number of players
    if (goodCount >= Math.ceil(numPlayers / 2)) {
      return {
        rule: false,
        errors: "Thuộc tính tốt không được vượt quá một nửa số người chơi !",
      };
    }

    // Check if there is at least one bad trait
    if (badCount < 1) {
      return {
        rule: false,
        errors: "Thiếu vai trò với thuộc tính xấu !",
      };
    }

    // Check if the number of bad traits is less than half the number of players
    if (badCount >= Math.ceil(numPlayers / 2)) {
      return {
        rule: false,
        errors: "Thuộc tính xấu không được vượt quá một nửa số người chơi !",
      };
    }

    return { rule: true, errors: null };
  }

  /* Vote rule */
  static voteRule(alivePlayers, voteCount) {
    // Check if alivePlayers is a positive number
    if (typeof alivePlayers !== "number" || alivePlayers <= 0) {
      return {
        status: "error",
        errors: "Số người chơi còn sống phải là một số dương !",
      };
    }

    // Check if voteCount is a positive number
    if (typeof voteCount !== "number" || voteCount <= 0) {
      return { status: "error", errors: "Số phiếu bầu phải là một số dương !" };
    }

    // voteCount can not be less than half the number of alive players
    const requiredVotes = Math.ceil(alivePlayers / 2);
    if (voteCount < requiredVotes) {
      return false;
    }
    
    return true;
  }

  /* Rules for game end */
  static gameOver(alivePlayers, traits) {
    // Check if alivePlayers is a positive number
    if (typeof alivePlayers !== "number" || alivePlayers <= 0) {
      return {
        errors: "Số người chơi còn sống phải là một số dương !",
      };
    }

    // Check if traits is an array and not empty
    if (!Array.isArray(traits) || traits.length === 0) {
      return { errors: "Traits must be a non-empty array!" };
    }

    // Check that every element in traits is a string
    if (!traits.every((trait) => typeof trait === "string")) {
      return { errors: "Each trait must be a string!" };
    }

    // Get the number of bad traits
    const badCount = traits.filter((trait) => trait === "bad").length;

    // The game will be ended if there is no bad trait
    if (badCount < 1) {
      return {
        isOver: true,
        reason: "Trò chơi đã kết thúc vì không còn kẻ xấu !",
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
        reason: "Trò chơi đã kết thúc vì số lượng kẻ xấu đã chiếm đa số !",
        winner: "bad",
      };
    }

    return { isOver: false, reason: null, winner: null };
  }
}

module.exports = { RuleController };
