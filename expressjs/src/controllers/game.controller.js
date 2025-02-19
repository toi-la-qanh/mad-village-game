const Room = require("../models/room.model");
const Game = require("../models/game.model");
const User = require("../models/user.model");
const { RuleController } = require("./rule.controller");
const { ObjectId } = require("mongodb");
const { checkSchema, validationResult } = require("express-validator");
const { RoleController } = require("./role.controller");

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
  constructor(io, socket) {
    this.io = io;
    this.socket = socket;
    this.playerID = this.socket.user;
    this.stalker = null;
    this.stalkerTarget = null;
  }
  async getGameData(id) {
    const game = await Game.findById(id);
    if (!game) {
      this.handleError("Không tìm thấy ván chơi!");
      this.socket.disconnect();
      return null;
    }
    return game;
  }
  listenForEvents() {
    this.socket.on("game:start", async (gameID) => {
      const game = await this.getGameData(gameID);
      this.io
        .to(game.room.toHexString())
        .emit("game:started", game._id.toHexString());
    });

    this.socket.on("game:data", async (gameID, callback) => {
      const game = await this.getGameData(gameID);
      callback(game);
    });

    this.socket.once("game:showRoles", async (gameID, callback) => {
      const game = await this.getGameData(gameID);
      const data = await this.showRoles(game);
      callback(data);
    });

    this.socket.on("game:performAction", async (gameID, callback) => {
      const game = await this.getGameData(gameID);
      const data = await this.performAction(game);
      callback(data);
    });

    this.socket.on("game:watch", async (gameID, callback) => {
      const game = await this.getGameData(gameID);
      const data = await this.watchOtherPlayers(game);
      callback(data);
    });

    // this.socket.on("game:updateTurns", async (callback) => {
    //   const game = await Game.findById(this.gameID);
    //   // Get priority from player
    //   const priorityLevel = this.data.players.map((p) => p.priority);
    //   // Get the max value to end the loop
    //   const maxPriority = Math.max(...priorityLevel);
    //   if (this.data.currentPriorityLevel > maxPriority) {
    //     this.socket.emit("game:updatePhases");
    //     return callback({
    //       status: "next",
    //       message: "Chuyển qua giai đoạn tiếp theo",
    //     });
    //   }
    //   game.currentPriorityLevel += 1;
    //   await game.save();
    //   this.data = game;
    //   return callback({
    //     status: "success",
    //     message: "Cập nhật lượt chơi thành công",
    //   });
    // });
  }
  // Helper function to wait for a selection with a timeout
  waitForSelection(eventName, remainingTime, onTimeSpent) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(null); // Resolve with null if the timeout occurs
      }, remainingTime);

      // Start listening for the selection event
      const startTime = Date.now();
      this.socket.once(eventName, (selection) => {
        const timeSpent = Date.now() - startTime; // Calculate time spent
        clearTimeout(timeoutId); // Clear the timeout if selection is made
        onTimeSpent(timeSpent); // Pass the time spent to the callback
        resolve(selection); // Resolve with the selected data
      });
    });
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

  getPlayer(game) {
    if (!game || !game.players) {
      return null;
    }

    const player = game.players.find(
      (player) => player._id.toString() === this.playerID.toString()
    );

    if (!player) {
      this.handleError("Bạn không phải là người chơi !");
      this.socket.disconnect();
      return null;
    }

    return player;
  }

  // Start a new game by http request
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

      const room = await Room.findById(roomID);

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

      // Only the owner of the room can start the game
      if (!room.owner.equals(ownerID)) {
        return res
          .status(403)
          .json({ errors: "Chỉ chủ phòng mới có thể bắt đầu trò chơi!" });
      }

      // Check the count of the players in the room
      if (room.players.length < 6 || room.players.length > 20) {
        return res
          .status(400)
          .json({ errors: "Số người chơi phải từ 6-20 người!" });
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
        if (roles[i] === "Villager") {
          roles[i] = RoleController.chooseRandomRoleForVillager();
        }
      }

      const shuffledRoles = shuffle(roles);
      const shuffledTraits = shuffle(traits);

      let players = [];
      for (const index in player_ids) {
        const player_id = player_ids[index];
        const user = await User.findById(player_id);
        const roleInstance = RoleController.getRoleFromPlayer(
          shuffledRoles[index],
          shuffledTraits[index]
        );

        players.push({
          // player_id: player_id,
          name: user.name,
          priority: roleInstance.getActionPriorities(),
          role: shuffledRoles[index],
          trait: shuffledTraits[index],
          count: roleInstance.getCount(),
        });
      }

      const game = new Game({
        room: roomID,
        players: players,
      });
      await game.save();
      const gameID = game._id;

      return res.status(200).json({ message: "Trò chơi đã bắt đầu!", gameID });
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
  async showRoles(game) {
    const player = this.getPlayer(game);
    let role, roleName, trait, image, description;
    if (player) {
      role = RoleController.getRoleFromPlayer(player.role, player.trait);
      roleName = role.name;
      trait = role.trait;
      image = role.image;
      description = role.description;
    }

    if (game.phases !== "showRoles") {
      return this.handleError("Không thể hiển thị vai trò vào lúc này !");
    }

    game.phases = "performAction";
    await game.save();

    return {
      trait: trait,
      role: roleName,
      image: image,
      description: description,
    };
  }

  /* In night phase, players can perform actions */

  // Choose target to perform actions
  async performAction(game) {
    if (game.phases !== "performAction") {
      return this.handleError(
        "Không thể chọn mục tiêu để hành động vào lúc này !"
      );
    }
    let elapsedTime = 0; // Keep track of elapsed time

    const player = this.getPlayer(game);
    const totalTimeout = 30000;
    // Function to calculate remaining time
    const getRemainingTime = () => totalTimeout - elapsedTime;

    if (player.priority !== game.currentPriorityLevel) {
      return this.handleError("Chưa tới lượt của bạn, xin hãy đợi tí");
    }

    this.socket.on("game:getTimeOut", () => {
      this.socket.emit("game:timeOut", totalTimeout);
    });

    // Wait for the target selection or timeout
    const targetID = await this.waitForSelection(
      "game:targetSelected",
      getRemainingTime(),
      (timeSpent) => {
        elapsedTime += timeSpent; // Track time spent on target selection
      }
    );

    // If no target was selected or timed out
    if (!targetID) {
      return {
        status: "success",
        message: "Bạn đã chọn không làm gì vào đêm nay !",
      };
    }

    // Find the target player
    const target = game.players.find(
      (target) => target.player_id.toString() === targetID.toString()
    );

    if (!target) {
      data = {
        status: "error",
        message: "Không tìm thấy mục tiêu trong ván chơi !",
      };
      return data;
    }

    // Player can not perform action if they are blocked
    if (player.status.isBeing.includes("blocked")) {
      return {
        status: "success",
        message: "Bạn đang bị chặn và không thể hành động vào đêm nay!",
      };
    }

    const targetName = target.name;

    // Check if the target is alive
    if (!target.status.isAlive) {
      data = {
        status: "error",
        message: `Không thể qua nhà ${targetName} vì người chơi này đã chết !`,
      };
      return data;
    }

    if (player.role === "Stalker") {
      this.stalker = player;
      this.stalkerTarget = targetID;
      data = {
        status: "success",
        message: `Bạn đã chọn ${targetName} làm mục tiêu để thăm dò !`,
      };
      return data;
    }

    if (this.stalker && targetID.toString() === this.stalkerTarget.toString()) {
      if (stalker.trait === "mad") {
        // just want to emit random target
        this.socket
          .to(stalker._id.toString())
          .emit("game:stalk", shuffle(this.data.players.name));
      } else {
        this.socket.to(stalker._id.toString()).emit("game:stalk", targetName);
      }
    }

    // Wait for the action selection or timeout
    const inputAction = await this.waitForSelection(
      "game:actionSelected",
      getRemainingTime(),
      (timeSpent) => {
        elapsedTime += timeSpent; // Track time spent on action selection
      }
    );

    // If no action was selected or timed out
    if (!inputAction) {
      data = {
        status: "success",
        message: "Bạn đã không thực hiện hành động nào !",
      };
      return data;
    }

    // Get the action that player wants to perform
    const action = game.action.find(
      (action) => action.performer.toString() === this.playerID.toString()
    );

    if (action.status !== "pending") {
      data = {
        status: "error",
        message: "Bạn đã thực hiện hành động cho đêm nay rồi !",
      };
      return data;
    }

    // Save the state of the action
    game.states = action;
    await game.save();

    // Return success message
    return {
      status: "success",
      message: `Bạn đã ${action} ${targetName}`,
      data: action,
    };
  }

  watchOtherPlayers(game, targetID) {
    // Only wacth other players in perform action phase
    if (game.phases !== "performAction") {
      return;
    }

    const player = this.getPlayer(game);
    // Only stalker can watch other players
    if (player.role !== "Stalker") {
      return;
    }

    const state = game.states.find(
      (target) => target.toString() === targetID.toString()
    );
    const target = game.players.find(
      (target) => target._id.toString() === state.target.toString()
    );
    if (!target) {
      this.handleError("Không tìm thấy mục tiêu !");
      return;
    }

    // If the target is not being watched, then the player choose not to do anything
    if (!target.status.isBeing.includes("watched")) {
      return;
    }

    // Player is mad, so we need to emit random performer name
    if (player.trait === "mad") {
      const playersName = game.players.map((player) => player.name);
      return shuffle(playersName);
    }

    const performerName = game.players.find(
      (player) => player._id.toString() === state.performer.toString()
    ).name;

    return performerName;
  }

  /* Update game state */

  // Update game phase
  // static async updatePhase(socket, data) {
  //   const { gameID, phase } = data;
  //   const game = await Game.findOne({
  //     _id: ObjectId.createFromHexString(gameID),
  //   });
  //   if (!game) {
  //     throw new Error({ errors: "Không tìm thấy trò chơi !" });
  //   }

  //   game.phases = phase;
  //   await game.save();

  //   socket.emit("game:updatePhase", {
  //     message: "Giai đoạn đã được cập nhật !",
  //   });
  // }

  // In day phase, the game will report last night's results
  // async dayPhase(callback) {
  //   // Find game
  //   const game = this.getGameData();

  //   // Get players who died during the night phase
  //   const deadPlayers = game.players.filter(
  //     (player) => !player.status.isAlive && player.status.diedAt === "night"
  //   );

  //   // Update game phase to discussion
  //   game.phases = "discussion";
  //   await game.save();

  //   if (deadPlayers.length === 0) {
  //     throw new Error("Không có ai chết !");
  //   }

  //   // Broadcast day phase results to all clients
  //   socket.broadcast.emit("game:dayResults", {
  //     messages: [
  //       {
  //         text: "Đêm hôm qua ...",
  //         delay: 0,
  //       },
  //       {
  //         text:
  //           deadPlayers.length === 0
  //             ? "Không có ai chết !"
  //             : `Có ${deadPlayers.length} người chết:`,
  //         delay: 2000,
  //         deadPlayers: deadPlayers.map((player) => ({
  //           name: player.name,
  //           role: player.role,
  //         })),
  //       },
  //     ],
  //   });
  // }

  // In discussion phase, players can chat with each other
  // static async discussionPhase() {
  //   const { gameID, message } = data;
  //   const userID = socket.user; // Assuming user data is attached to socket

  //   // Validate data
  //   if (!gameID || !message) {
  //     throw new Error("Missing required fields");
  //   }

  //   // Find game
  //   const game = await Game.findOne({
  //     _id: ObjectId.createFromHexString(gameID),
  //   });

  //   if (!game) {
  //     throw new Error("Không tìm thấy trò chơi !");
  //   }

  //   // Check if player exists and is alive
  //   const player = game.players.find(
  //     (player) => player.player_id.toString() === userID.toString()
  //   );
  //   if (!player) {
  //     throw new Error("Bạn không phải người chơi trong ván này!");
  //   }
  //   if (!player.status.isAlive) {
  //     throw new Error("Người chết không thể nói chuyện!");
  //   }

  //   switch (game.phases) {
  //     case "night":
  //       if (player.trait === "bad") {
  //         socket.broadcast.emit("game:message", {
  //           message: "Tin nhắn đã được gửi",
  //           sender: player.name,
  //           content: message,
  //         });
  //       }
  //       throw new Error("Không thể trò chuyện vào lúc này !");
  //     case "discussion":
  //       socket.broadcast.emit("game:message", {
  //         message: "Tin nhắn đã được gửi",
  //         sender: player.name,
  //         content: message,
  //       });
  //       break;

  //     default:
  //       throw new Error("Không thể thảo luận vào lúc này !");
  //   }
  // }

  // In vote phase, players can vote for the target to kill
  // static async votePhase(socket, data) {
  //   const { gameID, targetIDs } = data;

  //   // Validate data
  //   if (!gameID || !targetIDs) {
  //     throw new Error("Missing required fields");
  //   }

  //   // Find game
  //   const game = await Game.findOne({
  //     _id: ObjectId.createFromHexString(gameID),
  //   });

  //   if (!game) {
  //     throw new Error("Không tìm thấy trò chơi !");
  //   }

  //   if (game.phases !== "vote") {
  //     throw new Error("Không thể bỏ phiếu vào giai đoạn này !");
  //   }

  //   const players = game.players;
  //   const alivePlayers = players.filter(
  //     (player) => player.status.isAlive
  //   ).length;

  //   // Filter to keep only valid voters (players who are in the game and alive)
  //   const voter = players.find(
  //     (player) => player.player_id.toString() === socket.user.toString()
  //   );
  //   if (!voter) {
  //     throw new Error("Bạn không phải là người chơi trong ván này !");
  //   }
  //   if (!voter.status.isAlive) {
  //     throw new Error("Bạn đã chết nên không thể bỏ phiếu !");
  //   }

  //   // Count votes for each target
  //   const voteCount = targetIDs.reduce((acc, targetID) => {
  //     const target = players.find(
  //       (player) => player.player_id.toString() === targetID.toString()
  //     );
  //     // Only count votes for valid targets
  //     if (target && target.status.isAlive) {
  //       acc[targetID] = (acc[targetID] || 0) + 1;
  //     }
  //     return acc;
  //   }, {});

  //   if (Object.keys(voteCount).length === 0) {
  //     throw new Error("Không có mục tiêu hợp lệ nào để bỏ phiếu!");
  //   }

  //   // Find the target with the most votes
  //   const maxVotes = Math.max(...Object.values(voteCount));

  //   // Check if the vote count meets the required threshold
  //   if (!RuleController.voteRule(alivePlayers, maxVotes)) {
  //     throw new Error("Số phiếu bầu không đủ theo luật chơi !");
  //   }

  //   const mostVotedTargets = Object.entries(voteCount)
  //     .filter(([_, count]) => count === maxVotes)
  //     .map(([targetID]) => targetID);

  //   const selectedTargetID = mostVotedTargets[0];
  //   const selectedTarget = players.find(
  //     (player) => player.player_id.toString() === selectedTargetID
  //   );

  //   selectedTarget.status.isAlive = false;
  //   // Change the phase to night
  //   game.phases = "night";
  //   await game.save();

  //   // Broadcast vote results to all clients
  //   socket.broadcast.emit("game:message", {
  //     message: `Mục tiêu bị bỏ phiếu nhiều nhất: ${selectedTarget.name}`,
  //     maxVotes: maxVotes,
  //   });

  //   this.gamePhases({ phase: game.phases });
  // }

  // need a function to update game priority
}
module.exports = { GameController };
