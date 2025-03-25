const Room = require("../models/room.model");
const Game = require("../models/game.model");
const User = require("../models/user.model");
const { RuleController } = require("./rule.controller");
const { ObjectId } = require("mongodb");
const { checkSchema, validationResult } = require("express-validator");
const { RoleController } = require("./role.controller");

// Choose random roles and traits for new game
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
  }

  async getGameData(id) {
    const game = await Game.findById(id);
    if (!game) {
      this.handleError("Không tìm thấy ván chơi!");
      this.socket.disconnect();
      return;
    }
    return game;
  }

  async updateGamePhase(game, phase) {
    game.phases = phase;
    await game.save();
    this.socket.emit("game:update", game.phases);
  }

  emitTimeOut(timeout = null, message = null) {
    this.socket.emit("game:timeOut", {
      timeout: timeout,
      message: message,
    });
  }

  // Socket event handlers
  listenForEvents() {
    // When the game has started, emit gameID to the client to navigate to the game page
    this.socket.on("game:start", async (gameID) => {
      const game = await this.getGameData(gameID);
      this.io
        .to(game.room.toHexString())
        .emit("game:started", game._id.toHexString());
    });

    this.socket.onAny((eventName, ...args) => {
      console.log(eventName, ...args);
    });

    this.socket.on("game:getAbilityIcons", async (gameID, callback) => {
      const game = await this.getGameData(gameID);
      const data = this.getAbilityIcons(game);
      callback(data);
    });

    // Show roles event
    const showRolesEvent = async (game) => {
      const roleData = this.showRoles(game);

      // Emit to client the time to show roles
      const timeShow = 5000;
      this.emitTimeOut(timeShow, "Trò chơi sẽ bắt đầu trong");

      // Update game phase after 5 seconds
      setTimeout(async () => {
        await this.updateGamePhase(game, "performAction");
      }, timeShow);

      // Return the role data for the callback
      return roleData;
    };

    // Perform action event
    const performActionEvent = async (game) => {
      // Get priority from player
      const playerTurns = game.players.map((p) => p.priority);

      // Get the max value to end the loop
      const maxTurn = Math.max(...playerTurns);
      if (game.currentPriorityLevel > maxTurn) {
        await this.updateGamePhase(game, "day");

        // Reset the game's turn
        game.currentPriorityLevel = 1;
        game.period = "day";
        game.day += 1;
        await game.save();

        return {
          status: "next",
          message: "Chuyển qua giai đoạn tiếp theo",
        };
      }

      // Emit timeout to client
      const actionTimeout = 30000;
      this.emitTimeOut(actionTimeout, "Thời gian hành động");

      // Set a timeout to update turn
      const timeoutId = setTimeout(async () => {
        // After timeout, update the currentPriorityLevel
        game.currentPriorityLevel += 1; // Move to the next priority level
        await game.save(); // Save the updated game state
      }, actionTimeout);

      // Perform the action
      await this.performAction(game);

      // If action completes before timeout, clear the timeout
      clearTimeout(timeoutId);
    };

    // Watch other players event
    this.socket.on("game:watch", async (gameID, targetID, callback) => {
      const game = await this.getGameData(gameID);
      const data = await this.watchOtherPlayers(game, targetID);
      callback(data);
    });

    // Day event
    const dayPhaseEvent = async (game) => {
      const data = await this.dayPhase(game);
      return data;
    };

    // Discussion event
    const discussionPhaseEvent = async (game) => {
      const data = await this.discussionPhase(game);
      this.emitTimeOut(game.discussion_time * 1000, "Thời gian thảo luận");
      setTimeout(async () => {
        await this.updateGamePhase(game, "vote");
      }, game.discussion_time * 1000);

      return data;
    };

    // Vote event
    const votePhaseEvent = async (game) => {
      const data = await this.votePhase(game);

      this.emitTimeOut(game.vote_time * 1000, "Thời gian bỏ phiếu");
      setTimeout(async () => {
        await this.updateGamePhase(game, "handleVotes");
        // Handle the vote event
        const result = await this.afterVoteHandler(game);

        // Emit to client
        this.socket.emit("game:voteResult", result);

        // Update to the next phase
        setTimeout(async () => {
          await this.updateGamePhase(game, "performAction");

          // Update the game's period
          game.period = "night";
          await game.save();
        }, 10000);
      }, game.vote_time * 1000);

      return data;
    };

    // Retrieve the game data to the client
    this.socket.on("game:data", async (gameID, callback) => {
      const game = await this.getGameData(gameID);
      // console.log(game);
      callback(game);
    });

    // Retrieve the game event to the client
    this.socket.on("game:event", async (gameID, callback) => {
      const game = await this.getGameData(gameID);
      let result;

      switch (game.phases) {
        case "showRoles":
          result = await showRolesEvent(game);
          result.phase = "showRoles"; // Add phase info
          break;
        case "performAction":
          result = await performActionEvent(game);
          result.phase = "performAction"; // Add phase info
          break;
        case "day":
          result = await dayPhaseEvent(game);
          result.phase = "day"; // Add phase info
          break;
        case "discussion":
          result = await discussionPhaseEvent(game);
          result.phase = "discussion"; // Add phase info
          break;
        case "vote":
          result = await votePhaseEvent(game);
          result.phase = "vote"; // Add phase info
          break;
        case "end":
          await game.deleteOne();
          result = { message: "Game has been ended!", phase: "end" }; // Add phase info
          break;
        default:
          result = { event: "gameData", game, phase: game.phases || "unknown" }; // Include phase
          break;
      }

      callback(result); // Send the result with phase info back to the client
    });
  }

  // Retrieve any errors occurred during the game
  handleError(error) {
    this.socket.emit("game:error", { errors: error });
  }

  // Get the current player's information
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

  // Start a new game by HTTP request
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

      // Check if room is not found
      const room = await Room.findById(roomID);
      if (!room) {
        return res.status(404).json({ errors: "Phòng không tồn tại!" });
      }

      // Check if game already started
      const gameExists = await Game.findOne({
        room: ObjectId.createFromHexString(roomID),
      });
      if (gameExists) {
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

      // Check if the input data is satisfied with the rule for roles
      const ruleRoles = RuleController.rulesForRoles(player_ids.length, roles);
      if (!ruleRoles.rule) {
        const roleErrors = ruleRoles.errors;
        return res.status(400).json({ errors: roleErrors });
      }

      // Check if the input data is satisfied with the rule for traits
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

      // Replace generic villagers with specific roles
      const processedRoles = roles.map((role) =>
        role === "Villager"
          ? RoleController.chooseRandomRoleForVillager()
          : role
      );

      const shuffledRoles = shuffle(processedRoles);
      const shuffledTraits = shuffle(traits);

      const players = await Promise.all(
        room.players.map(async (playerId, index) => {
          const user = await User.findById(playerId);
          const roleInstance = RoleController.getRoleFromPlayer(
            shuffledRoles[index],
            shuffledTraits[index]
          );

          return {
            _id: playerId,
            name: user.name,
            priority: roleInstance.getActionPriorities(),
            role: shuffledRoles[index],
            trait: shuffledTraits[index],
            count: roleInstance.getCount(),
          };
        })
      );

      // Create game turns structure
      const turnMap = players.reduce((acc, player) => {
        const turn = player.priority;
        if (!acc[turn]) acc[turn] = [];
        acc[turn].push(player._id);
        return acc;
      }, {});

      const gameTurns = Object.entries(turnMap).map(([turn, playerIds]) => ({
        turn: Number(turn),
        playerNotYetAct: playerIds,
        playerActed: [],
      }));

      const game = new Game({
        room: roomID,
        players: players,
        gameTurns: gameTurns,
      });

      await game.save();
      const gameID = game._id;

      return res.status(200).json({ message: "Trò chơi đã bắt đầu!", gameID });
    },
  ];

  // Show roles to the players
  showRoles(game) {
    if (game.phases !== "showRoles") {
      return {
        status: 400,
        message: "Wrong phase!",
      };
    }

    const player = this.getPlayer(game);
    const role = RoleController.getRoleFromPlayer(player.role, player.trait);
    const roleData = {
      trait: role.getTrait(),
      name: role.getName(),
      image: role.getImage(),
      description: role.getDescription(),
    };

    return roleData;
  }

  // Retrieve the ability icons for the client
  getAbilityIcons(game) {
    // if (game.phases !== "showRoles") {
    //   return {
    //     status: 400,
    //     message: "Wrong phase!",
    //   };
    // }

    const player = this.getPlayer(game);
    const role = RoleController.getRoleFromPlayer(player.role, player.trait);
    const data = {
      availableAction: role.getAvailableAction(),
      abilityIcons: role.getAbilityIcons(),
    };

    return data;
  }

  /* In night phase, players can perform actions */

  // Choose target to perform actions
  async performAction(game) {
    if (game.phases !== "performAction") {
      return {
        status: 400,
        message: "Wrong phase!",
      };
    }

    game.period = "night";
    await game.save();

    const player = this.getPlayer(game);

    const waitForTarget = () => {
      return new Promise((resolve) => {
        this.socket.on("game:targetSelected", (data) => {
          if (player.priority !== game.currentPriorityLevel) {
            return this.emitTimeOut(null, "Chờ người khác hành động");
          }
          resolve(data);
        });
      });
    };

    // Wait for the target selection or timeout
    const targetID = await waitForTarget();

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
      return {
        status: "error",
        message: "Không tìm thấy mục tiêu trong ván chơi !",
      };
    }

    const targetName = target.name;

    // Wait for the action selection or timeout
    const waitForAction = () => {
      return new Promise((resolve) => {
        this.socket.on("game:actionSelected", (data) => {
          resolve(data);
        });
      });
    };

    const inputAction = await waitForAction();

    // If no action was selected or timed out
    if (!inputAction) {
      return {
        status: "success",
        message: "Bạn đã không thực hiện hành động nào !",
      };
    }

    // Get the action that player wants to perform
    const action = game.action.find(
      (action) => action.performer.toString() === this.playerID.toString()
    );

    if (action.status !== "pending") {
      return {
        status: "error",
        message: "Bạn đã thực hiện hành động cho đêm nay rồi !",
      };
    }

    if (!RoleController.submitAction(player, inputAction, target)) {
      // Save the state of the action
      action.status = "failed";
      await action.save();
      return {
        status: "error",
        message: "Không thể hành động lên người chơi này !",
      };
    }

    await RoleController.resolveActions(player, inputAction, target);
    // Save the state of the action
    action.status = "successful";
    action.performer.push(socket.user);
    action.target.push(targetID);
    await action.save();

    // Return success message
    return {
      status: "success",
      message: `Bạn đã ${action} ${targetName}`,
      data: action,
    };
  }

  // Only specific role are allowed to watch other players
  watchOtherPlayers(game, targetID) {
    // Only wacth other players in perform action phase
    if (game.phases !== "performAction") {
      return {
        status: 400,
        message: "Wrong phase!",
      };
    }

    const player = this.getPlayer(game);
    // Only stalker can watch other players
    if (player.role !== "Stalker") {
      return {
        status: "error",
        message: "Wrong role!",
      };
    }

    const state = game.states.find(
      (target) => target.toString() === targetID.toString()
    );
    const target = game.players.find(
      (target) => target._id.toString() === state.target.toString()
    );
    if (!target) {
      return {
        status: "error",
        message: "Không tìm thấy mục tiêu !",
      };
    }

    // If the target is not being watched, then the player choose not to do anything
    if (!target.status.isBeing.includes("watched")) {
      return {
        status: "error",
        message: "Mục tiêu không bị dò xét !",
      };
    }

    // Player is mad, so we need to emit random performer name
    if (player.trait === "mad") {
      const playersName = game.players.map((player) => player.name);
      // Create a copy of the array and shuffle it
      const shuffledNames = [...playersName];
      shuffle(shuffledNames);

      // Generate a random length between 1 and the total number of players
      const randomLength = Math.floor(Math.random() * playersName.length) + 1;

      // Return a slice of the shuffled array with random length
      return shuffledNames.slice(0, randomLength);
    }

    const performerName = game.players.find(
      (player) => player._id.toString() === state.performer.toString()
    ).name;

    return performerName;
  }

  // In the day phase, we will report last night's results
  async dayPhase(game) {
    if (game.phases !== "day") {
      return {
        status: 400,
        message: "Wrong phase!",
      };
    }
    const players = game.players;

    //Get dead players
    const deadPlayers = players.filter((player) => !player.status.isAlive);

    // Get the count of alive players
    const alivePlayers = players.filter(
      (player) => player.status.isAlive
    ).length;

    // Get the count of traits
    const traitCount = players.reduce((count, player) => {
      count[player.trait] = (count[player.trait] || 0) + 1;
      return count;
    }, {});

    // Check if the game meets ending conditions
    const gameEnd = RuleController.gameOver(alivePlayers, traitCount);
    if (!gameEnd.errors && gameEnd.isOver) {
      const reason = gameEnd.reason;
      const winner = gameEnd.winner;

      game.phases = "end";
      await game.save();

      const playerDetails = players.map((player) => ({
        name: player.name,
        role: player.role,
        trait: player.trait,
      }));

      return this.socket.emit("game:end", {
        reason: reason,
        winner: winner,
        playerDetails: playerDetails,
      });
    }

    // Update game phase and reset all the states
    game.phases = "discussion";
    game.states.forEach((action) => {
      action.status = "pending";
    });
    await game.save();

    if (deadPlayers.length === 0) {
      return {
        status: "success",
        message: "Đêm qua không có ai chết!",
      };
    }

    const deadPlayerNames = deadPlayers.map((player) => player.name);
    return {
      status: "success",
      message: "Đêm qua có " + deadPlayers.length + " người chết!",
      data: deadPlayerNames,
    };
  }

  // In the discussion phase, players can chat and discuss
  async discussionPhase(game, message) {
    if (game.phases !== "discussion") {
      return {
        status: 400,
        message: "Wrong phase!",
      };
    }

    // Validate data
    if (!message) {
      return {
        status: "error",
        message: "Tin nhắn không được để trống!",
      };
    }

    // Check if player exists and is alive
    const player = this.getPlayer(game);

    if (!player.status.isAlive) {
      return {
        status: "error",
        message: "Bạn không thể nói chuyện!",
      };
    }

    this.socket.broadcast
      .to(game.room.toHexString())
      .emit("game:fetchDayChat", {
        playerName: player.name,
        message: message,
      });

    return {
      status: "success",
      message: "Tin nhắn đã được gửi!",
    };
  }

  // Only specific roles can chat at night's period
  async nightChat(game, message) {
    if (game.period !== "night") {
      return {
        status: 400,
        message: "Wrong phase!",
      };
    }

    // Validate data
    if (!message) {
      return {
        status: "error",
        message: "Tin nhắn không được để trống!",
      };
    }

    // Check if player exists and is alive
    const player = this.getPlayer(game);

    if (!player.status.isAlive) {
      return {
        status: "error",
        message: "Bạn không thể nói chuyện!",
      };
    }

    this.socket.broadcast.to(player1, player2).emit("game:fetchNightChat", {
      playerName: player.name,
      message: message,
    });

    return {
      status: "success",
      message: "Tin nhắn đã được gửi!",
    };
  }

  // In the vote phase, players can vote for the suspect and hang him on
  async votePhase(game) {
    // Check if current phase is "vote"
    if (game.phases !== "vote") {
      return {
        status: 400,
        message: "Wrong phase!",
      };
    }

    const waitForTargetID = () => {
      return new Promise((resolve) => {
        this.socket.on("game:voteTarget", (data) => {
          resolve(data);
        });
      });
    };

    // Wait for the target selection or timeout
    const targetID = await waitForTargetID();

    if (!targetID) {
      return { status: success, message: "Bạn đã không bỏ phiếu ai !" };
    }

    // Get target data
    const target = game.players.find(
      (player) => player._id.toString() === targetID.toString()
    );

    // Check if target exists
    if (!target) {
      return {
        status: "error",
        message: "Không tìm thấy mục tiêu!",
      };
    }

    // Check if target is alive
    if (!target.status.isAlive) {
      return {
        status: "error",
        message: "Chỉ được bỏ phiếu cho người chơi còn sống !",
      };
    }
    const existingVoteIndex = game.vote.find(
      (vote) => vote.target.toString() === targetID.toString()
    );

    if (existingVoteIndex) {
      // If target exists, just increment the count
      game.vote[existingVoteIndex].count += 1;
    } else {
      // If target doesn't exist, add it with count starting at 1
      game.vote.push({
        target: targetID,
        count: 1,
      });
    }
    await game.save();
  }

  // Handle vote result
  async afterVoteHandler(game) {
    if (game.phases !== "handleVotes") {
      return {
        status: 400,
        message: "Wrong phase!",
      };
    }

    // Early return if no votes
    if (!game.vote || !game.vote.length) {
      return { status: "success", message: "Không ai bỏ phiếu!" };
    }

    const maxCount = Math.max(...game.vote.map((vote) => vote.count));
    const alivePlayers = game.players.filter(
      (player) => player.status.isAlive
    ).length;

    // Validate vote rules
    const voteRules = RuleController.voteRule(alivePlayers, maxCount);
    if (voteRules.errors) {
      return { status: "error", message: voteRules.errors };
    }

    // Check for tie
    const tiedVotes = game.vote.filter((vote) => vote.count === maxCount);
    if (tiedVotes.length > 1) {
      return {
        status: "tie",
        tiedTargets: tiedVotes.map((vote) => ({
          target: vote.target,
          count: vote.count,
        })),
        message: `Hoà với số phiếu ${maxCount} nên không ai bị treo cổ!`,
      };
    }

    // Get the voted player
    const targetId = tiedVotes[0].target.toString();
    const player = game.players.find(
      (player) => player._id.toString() === targetId
    );

    if (!player) {
      return { status: "error", message: "Player not found" };
    }

    // Mark player as dead
    player.status.isAlive = false;

    // Count traits for game end check
    const traitCount = game.players.reduce((count, player) => {
      count[player.trait] = (count[player.trait] || 0) + 1;
      return count;
    }, {});

    // Save game state
    await game.save();

    // Check end game conditions
    const gameEnd = RuleController.gameOver(alivePlayers - 1, traitCount);
    if (!gameEnd.errors && gameEnd.isOver) {
      game.phases = "end";
      await game.save();

      const players = game.players;
      const playerDetails = players.map((player) => ({
        name: player.name,
        role: player.role,
        trait: player.trait,
      }));
      const reason = gameEnd.reason;
      const winner = gameEnd.winner;

      return this.socket.emit("game:end", {
        reason: reason,
        winner: winner,
        playerDetails: playerDetails,
      });
    }

    // Create appropriate message based on player role
    const baseMessage = `Kẻ bị tình nghi ${player.name} là (${player.role}), đã bị dân làng treo cổ`;
    const message =
      player.role === "bad"
        ? `${baseMessage}!`
        : `${baseMessage}, nhưng rõ ràng người này không phải kẻ xấu !`;

    return {
      status: "success",
      highestVote: player.name,
      message,
    };
  }
}

module.exports = { GameController };
