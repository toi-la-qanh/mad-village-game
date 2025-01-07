const Room = require("../models/room.model");
const Game = require("../models/game.model");
const User = require("../models/user.model");
const { RuleController } = require("./rule.controller");
const { ObjectId } = require("mongodb");
const { checkSchema, validationResult } = require("express-validator");
const {
  chooseAction,
  chooseRandomRoleForVillager,
  checkAvailableAction,
  getRoleFromPlayer,
} = require("./role.controller");
const { SocketController } = require("../socketHandle/socket.controller");

// To choose random roles and traits for new game
function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

class GameController {
  constructor(socket, data) {
    this.socket = socket;
    this.data = data;
    this.playerID = this.socket.user;
    this.gameID = this.data._id;
  }

  // Handle any errors occurred during the game
  handleError(error) {
    this.socket.emit("game:error", { errors: error });
  }

  gameMessages(data) {
    this.socket.emit("game:messages", { data });
  }

  gamePhases(data) {
    this.socket.emit("game:phases", { data });
  }

  validateData() {
    checkSchema({
      gameID: {
        notEmpty: {
          errorMessage: "Mã trò chơi không được để trống !",
        },
        isMongoId: {
          errorMessage: "Mã không hợp lệ !",
        },
      },
      playerID: {
        notEmpty: {
          errorMessage: "Mã người chơi không được để trống !",
        },
        isMongoId: {
          errorMessage: "Mã không hợp lệ !",
        },
      },
    });

    const errors = validationResult(this.data);
    if (!errors.isEmpty()) {
      this.handleError(errors);
      return;
    }
  }
  // Start a new game
  static gameStart = [
    checkSchema({
      roomID: {
        notEmpty: {
          errorMessage: "Mã phòng không được để trống !",
        },
        isMongoId: {
          errorMessage: "Mã không hợp lệ !",
        },
      },
      roles: {
        notEmpty: {
          errorMessage: "Vai trò không được để trống !",
        },
      },
      traits: {
        notEmpty: {
          errorMessage: "Thuộc tính không được để trống !",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json(errors);
      }

      const ownerID = req.user;
      const { roomID, roles, traits } = req.body;

      const room = await Room.findOne({
        _id: ObjectId.createFromHexString(roomID),
      });

      // Check if room is not found
      if (!room) {
        return res.status(404).json({ errors: "Phòng không tồn tại!" });
      }

      const checkIfGameHasStarted = await Game.findOne({
        room: ObjectId.createFromHexString(roomID),
      });

      if (checkIfGameHasStarted) {
        return res.status(400).json({
          message: "Không thể bắt đầu trò chơi vì trò chơi đang diễn ra !",
        });
      }

      // Check the count of the players in the room
      if (room.players.length < 6 || room.players.length > 20) {
        return res
          .status(400)
          .json({ errors: "Số người chơi phải từ 6-20 người!" });
      }

      // Only owner of the room can start the game
      if (!room.owner.equals(ownerID)) {
        return res
          .status(403)
          .json({ errors: "Chỉ chủ phòng mới có thể bắt đầu trò chơi!" });
      }

      const player_ids = room.players;

      const ruleRoles = RuleController.rulesForRoles(player_ids.length, roles);
      if (!ruleRoles.rule) {
        const roleErrors = ruleRoles.errors;
        return res.status(400).json({ errors: roleErrors });
      }

      const ruleTraits = RuleController.rulesForTraits(
        player_ids.length,
        traits
      );
      if (!ruleTraits.rule) {
        const traitErrors = ruleTraits.errors;
        return res.status(400).json({
          errors: traitErrors,
        });
      }

      for (let i = 0; i < roles.length; i++) {
        if (roles[i] === "Dân làng") {
          roles[i] = chooseRandomRoleForVillager();
        }
      }

      const shuffledRoles = shuffle(roles);
      const shuffledTraits = shuffle(traits);

      const players = await Promise.all(
        player_ids.map(async (player_id, index) => {
          const user = await User.findById(
            ObjectId.createFromHexString(player_id.toString())
          );
          return {
            player_id: player_id,
            name: user.name,
            role: shuffledRoles[index],
            trait: shuffledTraits[index],
          };
        })
      );

      const game = new Game({
        room: roomID,
        players: players,
      });

      await game.save();

      return res
        .status(200)
        .json({ message: "Trò chơi đã bắt đầu!", game: game });
    },
  ];

  // End a game
  // async gameEnd() {
  //   const { gameID } = this.data;

  //   const game = await Game.findOne({
  //     _id: ObjectId.createFromHexString(gameID),
  //   });
  //   if (!game) {
  //     return res.status(404).json({ errors: "Không tìm thấy ván chơi !" });
  //   }

  //   const players = game.players;
  //   const traits = players.map((player) => player.trait);

  //   if (!gameOver(players.length, traits).isOver) {
  //     return res
  //       .status(200)
  //       .json({ message: "Trò chơi không thể kết thúc vào lúc này !" });
  //   }

  //   // Show roles and traits of all players
  //   const playersInfo = players.map((player) => ({
  //     name: player.name,
  //     role: player.role,
  //     trait: player.trait,
  //   }));

  //   const reason = gameOver(players.length, traits).reason;
  //   const winner = gameOver(players.length, traits).winner;

  //   await Game.deleteOne({ _id: ObjectId.createFromHexString(gameID) });

  //   const io = getIO();
  //   io.emit("game:end", {
  //     message: reason,
  //     winner: winner,
  //     players: playersInfo,
  //   });

  //   return res
  //     .status(200)
  //     .json({ message: reason, winner: winner, players: playersInfo });
  // }

  // Show roles to the players
  async showRoles() {
    const player = this.data.players.find(
      (player) => player.player_id.toString() === this.playerID.toString()
    );

    if (!player) {
      this.handleError("Không tìm thấy người chơi trong ván này!");
      return;
    }

    const role = getRoleFromPlayer(player.role, player.trait);
    const roleName = role.name;
    const trait = role.trait;

    if (trait === "bad") {
      this.gameMessages({
        message: `Bạn là ${roleName}, ác`,
        role: roleName,
        trait: trait,
      });
    }

    this.gameMessages({
      message: `Bạn là ${roleName}`,
      role: roleName,
      trait: trait,
    });
  }

  /* Update game state */

  // Update game phase
  static async updatePhase(socket, data) {
    const { gameID, phase } = data;
    const game = await Game.findOne({
      _id: ObjectId.createFromHexString(gameID),
    });
    if (!game) {
      throw new Error({ errors: "Không tìm thấy trò chơi !" });
    }

    game.phases = phase;
    await game.save();

    socket.emit("game:updatePhase", {
      message: "Giai đoạn đã được cập nhật !",
    });
  }

  // In day phase, the game will report last night's results
  static async dayPhase(socket, data) {
    const { gameID } = data;

    // Validate data
    if (!gameID) {
      throw new Error("Missing required fields");
    }

    // Find game
    const game = await Game.findOne({
      _id: ObjectId.createFromHexString(gameID),
    });
    if (!game) {
      throw new Error("Không tìm thấy trò chơi !");
    }

    // Get players who died during the night phase
    const deadPlayers = game.players.filter(
      (player) => !player.status.isAlive && player.status.diedAt === "night"
    );

    // Update game phase to discussion
    game.phases = "discussion";
    await game.save();

    if (deadPlayers.length === 0) {
      throw new Error("Không có ai chết !");
    }

    // Broadcast day phase results to all clients
    socket.broadcast.emit("game:dayResults", {
      messages: [
        {
          text: "Đêm hôm qua ...",
          delay: 0,
        },
        {
          text:
            deadPlayers.length === 0
              ? "Không có ai chết !"
              : `Có ${deadPlayers.length} người chết:`,
          delay: 2000,
          deadPlayers: deadPlayers.map((player) => ({
            name: player.name,
            role: player.role,
          })),
        },
      ],
    });
  }

  // In discussion phase, players can chat with each other
  static async discussionPhase() {
    const { gameID, message } = data;
    const userID = socket.user; // Assuming user data is attached to socket

    // Validate data
    if (!gameID || !message) {
      throw new Error("Missing required fields");
    }

    // Find game
    const game = await Game.findOne({
      _id: ObjectId.createFromHexString(gameID),
    });

    if (!game) {
      throw new Error("Không tìm thấy trò chơi !");
    }

    // Check if player exists and is alive
    const player = game.players.find(
      (player) => player.player_id.toString() === userID.toString()
    );
    if (!player) {
      throw new Error("Bạn không phải người chơi trong ván này!");
    }
    if (!player.status.isAlive) {
      throw new Error("Người chết không thể nói chuyện!");
    }

    switch (game.phases) {
      case "night":
        if (player.trait === "bad") {
          socket.broadcast.emit("game:message", {
            message: "Tin nhắn đã được gửi",
            sender: player.name,
            content: message,
          });
        }
        throw new Error("Không thể trò chuyện vào lúc này !");
      case "discussion":
        socket.broadcast.emit("game:message", {
          message: "Tin nhắn đã được gửi",
          sender: player.name,
          content: message,
        });
        break;

      default:
        throw new Error("Không thể thảo luận vào lúc này !");
    }
  }

  // In vote phase, players can vote for the target to kill
  static async votePhase(socket, data) {
    const { gameID, targetIDs } = data;

    // Validate data
    if (!gameID || !targetIDs) {
      throw new Error("Missing required fields");
    }

    // Find game
    const game = await Game.findOne({
      _id: ObjectId.createFromHexString(gameID),
    });

    if (!game) {
      throw new Error("Không tìm thấy trò chơi !");
    }

    if (game.phases !== "vote") {
      throw new Error("Không thể bỏ phiếu vào giai đoạn này !");
    }

    const players = game.players;
    const alivePlayers = players.filter(
      (player) => player.status.isAlive
    ).length;

    // Filter to keep only valid voters (players who are in the game and alive)
    const voter = players.find(
      (player) => player.player_id.toString() === socket.user.toString()
    );
    if (!voter) {
      throw new Error("Bạn không phải là người chơi trong ván này !");
    }
    if (!voter.status.isAlive) {
      throw new Error("Bạn đã chết nên không thể bỏ phiếu !");
    }

    // Count votes for each target
    const voteCount = targetIDs.reduce((acc, targetID) => {
      const target = players.find(
        (player) => player.player_id.toString() === targetID.toString()
      );
      // Only count votes for valid targets
      if (target && target.status.isAlive) {
        acc[targetID] = (acc[targetID] || 0) + 1;
      }
      return acc;
    }, {});

    if (Object.keys(voteCount).length === 0) {
      throw new Error("Không có mục tiêu hợp lệ nào để bỏ phiếu!");
    }

    // Find the target with the most votes
    const maxVotes = Math.max(...Object.values(voteCount));

    // Check if the vote count meets the required threshold
    if (!RuleController.voteRule(alivePlayers, maxVotes)) {
      throw new Error("Số phiếu bầu không đủ theo luật chơi !");
    }

    const mostVotedTargets = Object.entries(voteCount)
      .filter(([_, count]) => count === maxVotes)
      .map(([targetID]) => targetID);

    const selectedTargetID = mostVotedTargets[0];
    const selectedTarget = players.find(
      (player) => player.player_id.toString() === selectedTargetID
    );

    selectedTarget.status.isAlive = false;
    // Change the phase to night
    game.phases = "night";
    await game.save();

    // Broadcast vote results to all clients
    socket.broadcast.emit("game:message", {
      message: `Mục tiêu bị bỏ phiếu nhiều nhất: ${selectedTarget.name}`,
      maxVotes: maxVotes,
    });

    this.gamePhases({ phase: game.phases });
  }

  /* In night phase, players can perform actions */

  // Choose target to perform actions
  static async chooseTargetToPerformAction(socket, data) {
    const { gameID, targetID } = data;

    const game = await Game.findOne({
      _id: ObjectId.createFromHexString(gameID),
    });

    if (!game) {
      socket.emit("game:error", { errors: "Không tìm thấy trò chơi !" });
    }

    const player = game.players.find(
      (player) => player.player_id.toString() === req.user.toString()
    );

    if (!player) {
      socket.emit("game:error", {
        errors: "Bạn không phải người chơi trong ván chơi này !",
      });
    }

    if (game.phases !== "night") {
      socket.emit("game:error", {
        errors: "Không thể chọn mục tiêu để hành động vào lúc này !",
      });
    }

    // Find the target player
    const target = game.players.find(
      (target) => target.player_id.toString() === targetID.toString()
    );

    if (!target) {
      socket.emit("game:error", {
        errors: "Không tìm thấy mục tiêu trong ván chơi !",
      });
    }

    const targetName = target.name;

    // Check if the target is alive
    if (!target.status.isAlive) {
      socket.emit("game:error", {
        errors: `Không thể qua nhà ${targetName} vì người chơi này đã chết !`,
      });
    }

    game.states.push({
      targetSelector: player.player_id,
      selectedTarget: targetID,
    });
    await game.save();

    return res.status(200).json({
      message: `Bạn đã chọn qua thăm ${targetName}. Hãy quyết định hành động tiếp theo !`,
      targetID,
    });
  }

  // Perform action
  static async performAction(socket, data) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors);
    }

    if (!action) {
      return res
        .status(200)
        .json({ message: "Bạn đã chọn không thực hiện hành động nào !" });
    }

    const { gameID, targetID, action } = req.query;
    const userID = req.user;
    const game = await Game.findOne({
      _id: ObjectId.createFromHexString(gameID),
    });

    if (!game) {
      return res.status(404).json({ errors: "không tìm thấy ván chơi !" });
    }

    if (game.phases !== "night") {
      return res.status(400).json({
        errors: "Không thể chọn hành động lên mục tiêu vào lúc này !",
      });
    }

    const target = game.states.find(
      (state) => state.selectedTarget.toString() === targetID.toString()
    );
    if (!target) {
      return res.status(404).json({ errors: "Bạn chưa chọn mục tiêu !" });
    }

    const player = game.states.find(
      (state) => state.targetSelector.toString() === userID.toString()
    );

    if (!player) {
      return res
        .status(404)
        .json({ errors: "Bạn không phải là người chọn mục tiêu này !" });
    }

    const targetPlayer = game.players.find(
      (player) =>
        player.player_id.toString() === target.selectedTarget.toString()
    );

    if (!targetPlayer) {
      return res
        .status(404)
        .json({ errors: "Không tìm thấy người chơi mục tiêu !" });
    }

    // Extract the name of the target
    const targetName = targetPlayer.name;

    if (!action) {
      return res
        .status(200)
        .json({ message: "Bạn đã chọn không thực hiện hành động nào !" });
    }

    if (!checkAvailableAction(action, player.role, player.trait)) {
      return res.status(400).json({ errors: "Hành động không phù hợp !" });
    }

    //choose action
    game.states.push({
      action: action,
      targetSelector: userID,
      selectedTarget: targetID,
    });
    await game.save();

    return res.status(200).json({
      message: `Thực hiện hành động ${action} lên mục tiêu ${targetName} !`,
    });
  }
}
module.exports = { GameController };
