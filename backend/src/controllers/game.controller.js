const Room = require("../models/room.model");
const Game = require("../models/game.model");
const User = require("../models/user.model");
const { RuleController } = require("./rule.controller");
const { ObjectId } = require("mongodb");
const { checkSchema, validationResult } = require("express-validator");
const { RoleController } = require("./role.controller");
const redis = require("../database/redis");

/**
 * Choose random roles and traits for a new game
 */
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
    this.updateTimeout = null; // Add debounce timeout
  }

  /**
   * Retrieve the game data from the database
   */
  async getGameData(id) {
    if (!id) {
      console.log("No id provided");
    }
    const game = await Game.findById(id);
    if (!game) {
      this.handleError(req.t("game.errors.notFound"));
      this.socket.disconnect();
      return null;
    }
    return game;
  }

  emitGameUpdate(game) {
    this.io.to(game.room.toHexString()).emit("game:update", {
      phase: game.phases,
      day: game.day,
      period: game.period,
    });
  }

  /**
   * Method to update the game for each phase depending on the timeout
   */
  async updateGamePhase(gameID) {
    let phaseInProgress = false;

    const intervalId = setInterval(async () => {
      if (phaseInProgress) return;

      const game = await this.getGameData(gameID);
      phaseInProgress = true;

      switch (game.phases) {
        case "showRoles":
          await showRolesEvent(game);
          break;
        case "performAction":
          await performActionEvent(game);
          break;
        case "day":
          await dayPhaseEvent(game);
          break;
        case "discussion":
          await discussionPhaseEvent(game);
          break;
        case "vote":
          await votePhaseEvent(game);
          break;
        case "handleVotes":
          await handleVotesEvent(game);
          break;
        default:
          console.log("Unknown phase!");
          phaseInProgress = false; // avoid deadlock.
          break;
      }
    }, 1000); // Check every second to progress the game

    // Show roles event
    const showRolesEvent = async (game) => {
      // Emit to client the time to show roles
      const timeShow = 10000;
      let countdown = timeShow / 1000;

      // Update game phase after 5 seconds
      const interval = setInterval(async () => {
        this.emitTimeOut(
          countdown,
          req.t("game.messages.startingIn"),
          game.room.toHexString()
        );

        countdown--;

        if (countdown < 1) {
          clearInterval(interval);
          this.socket.removeAllListeners("game:timeOut");

          // Proceed to next game phase
          game.phases = "performAction";
          game.period = "night";
          await game.save();

          this.emitGameUpdate(game);

          phaseInProgress = false;
        }
      }, 1000);
    };

    // Perform action event
    const performActionEvent = async (game) => {
      // Get priority from player
      const playerTurns = game.players.map((p) => p.priority);

      // Get the max value to end the loop
      const maxTurn = Math.max(...playerTurns);

      // Move to the next phase
      if (game.currentTurn > maxTurn) {
        this.socket.removeAllListeners("game:watch");
        this.socket.removeAllListeners("game:timeOut");

        // Delete action key from redis
        const actionKey = `game:${game._id}:action:${this.playerID.toString()}`;

        await redis.del(actionKey);

        // Reset the game's turn
        game.currentTurn = 1;
        game.phases = "day";
        game.period = "day";
        game.day += 1;
        await game.save();

        this.emitGameUpdate(game);

        phaseInProgress = false;
        return;
      }

      const player = this.getPlayer(game);

      // Turn check
      if (player.priority !== game.currentTurn) {
        phaseInProgress = false;
      }

      this.socket.emit("game:yourTurn", true);

      // Emit timeout to client
      const actionTimeout = 30000;
      let countdown = actionTimeout / 1000;

      // Update game phase after 5 seconds
      const interval = setInterval(async () => {
        this.emitTimeOut(
          countdown,
          req.t("game.messages.turn", { turn: game.currentTurn }),
          game.room.toHexString()
        );

        countdown--;

        if (countdown < 1) {
          clearInterval(interval);
          this.socket.removeAllListeners("game:timeOut");

          game.currentTurn += 1;
          await game.save();

          phaseInProgress = false;
        }
      }, 1000);
    };

    // Day event
    const dayPhaseEvent = async (game) => {
      // Emit to client the time to show roles
      const timeShow = 5000;
      let countdown = timeShow / 1000;

      const data = await this.dayPhase(game);
      if (data.gameEnded) {
        this.emitTimeOut(null, req.t("game.messages.gameEnded"));

        const playerKeys = game.players.map((p) => `user:${p._id}`);

        for (const key of playerKeys) {
          await redis.hSet(key, "gameID", null);
          await redis.expire(key, 86400);
        }

        await game.deleteOne();

        phaseInProgress = false;
        clearInterval(intervalId);
      }
      this.io.to(game.room.toString()).emit("game:dayReport", data);

      // Update game phase after 5 seconds
      const interval = setInterval(async () => {
        this.emitTimeOut(
          countdown,
          req.t("game.messages.nextPhase"),
          game.room.toHexString()
        );

        countdown--;

        if (countdown < 1) {
          clearInterval(interval);
          this.socket.removeAllListeners("game:timeOut");

          // Proceed to next game phase
          game.phases = "discussion";
          await game.save();

          this.emitGameUpdate(game);

          phaseInProgress = false;
        }
      }, 1000);
    };

    // Discussion event
    const discussionPhaseEvent = async (game) => {
      let countdown = game.discussion_time;

      // Update game phase after 5 seconds
      const interval = setInterval(async () => {
        this.emitTimeOut(
          countdown,
          req.t("game.messages.discussionTime"),
          game.room.toHexString()
        );

        countdown--;

        if (countdown < 1) {
          clearInterval(interval);
          this.socket.removeAllListeners("game:timeOut");

          // Proceed to next game phase
          game.phases = "vote";
          await game.save();

          this.emitGameUpdate(game);

          phaseInProgress = false;
        }
      }, 1000);
    };

    // Vote event
    const votePhaseEvent = async (game) => {
      this.socket.removeAllListeners("game:discussion");

      let countdown = game.vote_time;

      // Update game phase after 5 seconds
      const interval = setInterval(async () => {
        this.emitTimeOut(
          countdown,
          req.t("game.messages.voteTime"),
          game.room.toHexString()
        );

        countdown--;

        if (countdown < 1) {
          clearInterval(interval);
          this.socket.removeAllListeners("game:timeOut");

          // Proceed to next game phase
          game.phases = "handleVotes";
          await game.save();

          this.emitGameUpdate(game);

          phaseInProgress = false;
        }
      }, 1000);
    };

    // Handle votes
    const handleVotesEvent = async (game) => {
      console.log("handle votes phase");
      this.emitTimeOut(null, req.t("game.messages.handleVotes"), game.room.toHexString());
      this.socket.removeAllListeners("game:voteTarget");

      // Handle the vote event
      const result = await this.afterVoteHandler(game);
      if (result.gameEnded) {
        this.emitTimeOut(null, req.t("game.messages.gameEnded"));

        const playerKeys = game.players.map((p) => `user:${p._id}`);

        for (const key of playerKeys) {
          await redis.hDel(key, "gameID");
          await redis.expire(key, 86400);
        }

        await game.deleteOne();

        phaseInProgress = false;
        clearInterval(intervalId);
      }

      // Emit to client
      this.io.to(game.room.toHexString()).emit("game:voteResult", result);

      let countdown = 5;
      // Update game phase after 5 seconds
      const interval = setInterval(async () => {
        this.emitTimeOut(
          countdown,
          req.t("game.messages.nextPhase"),
          game.room.toHexString()
        );

        countdown--;

        if (countdown < 1) {
          clearInterval(interval);
          this.socket.removeAllListeners("game:timeOut");

          // Get current votes from Redis
          const gameVoteKey = `game:${game._id}:votes`;
          await redis.del(gameVoteKey);

          // Proceed to next game phase
          game.phases = "performAction";
          game.period = "night";
          await game.save();

          this.emitGameUpdate(game);

          phaseInProgress = false;
        }
      }, 1000);
    };
  }

  /**
   * Retrieve the timeout and message to the client
   */
  emitTimeOut(timeout = null, message = null, roomID = null) {
    if (roomID) {
      this.io.to(roomID).emit("game:timeOut", { timeout, message });
    } else {
      this.socket.emit("game:timeOut", { timeout, message });
    }
  }

  /**
   * Socket event handlers for game api
   */
  listenForEvents() {
    // When the game has started, emit gameID to the client to navigate to the game page
    this.socket.on("game:start", async (gameID) => {
      const game = await this.getGameData(gameID);
      this.socket
        .to(game.room.toHexString())
        .emit("game:started", game._id.toHexString());

      // Remove the listener right after it's fired
      this.socket.removeAllListeners("game:start");

      this.updateGamePhase(gameID);
    });

    this.socket.on("game:getAbilityIcons", async (gameID, callback) => {
      const game = await this.getGameData(gameID);
      const data = this.getAbilityIcons(game);
      callback(data);
    });

    // Retrieve the game data to the client
    this.socket.on("game:data", async (gameID, callback) => {
      const game = await this.getGameData(gameID);

      const data = {
        _id: game._id,
        room: game.room,
        period: game.period,
        players: game.players.map((player) => ({
          _id: player._id,
          name: player.name,
          alive: player.status.isAlive,
        })),
        day: game.day,
      };
      // console.log(game);
      callback(data);
    });

    // Retrieve the game event to the client
    this.socket.on("game:event", async (gameID, callback) => {
      const game = await this.getGameData(gameID);
      console.log(`The game is at ${game.phases} phase`);

      let result = {};

      this.socket.removeAllListeners("game:voteTarget");
      this.socket.removeAllListeners("game:discussion");

      switch (game.phases) {
        case "showRoles":
          result = this.showRoles(game);
          result.phase = "showRoles"; // Add phase info
          break;

        case "performAction":
          // Watch other players event
          this.socket.on("game:watch", async (targetID, callback) => {
            const data = await this.watchOtherPlayers(game, targetID);
            callback(data);
          });

          result = await this.performAction(game);
          result.phase = "performAction"; // Add phase info
          break;

        case "day":
          result.phase = "day"; // Add phase info
          break;

        case "discussion":
          this.socket.removeAllListeners("game:discussion"); // prevent duplicates
          this.socket.on("game:discussion", async (message, callback) => {
            const data = await this.discussionPhase(game, message);
            callback(data);
          });

          result = { phase: "discussion" }; // Add phase info
          break;

        case "vote":
          this.socket.removeAllListeners("game:voteTarget"); // prevent duplicates
          // Set up the socket handler for vote target
          this.socket.on("game:voteTarget", async (targetID, callback) => {
            const data = await this.votePhase(game, targetID);
            callback(data);
          });

          result = { phase: "vote" }; // Add phase info
          break;

        case "end":
          this.socket.removeAllListeners("game:data");
          this.socket.removeAllListeners("game:event");
          this.socket.removeAllListeners("game:getAbilityIcons");
          this.socket.removeAllListeners("game:timeOut");

          console.log("the game is deleted !");

          result = { phase: "end" };
          break;

        default:
          result = { phase: game.phases || "unknown" }; // Include phase
          break;
      }

      callback(result); // Send the result with phase info back to the client
    });
  }

  /**
   * Retrieve any errors occurred during the game
   */
  handleError(error) {
    this.socket.emit("game:error", { errors: error });
  }

  /**
   * Get the current player's information
   */
  getPlayer(game) {
    if (!game || !game.players) {
      return null;
    }

    const player = game.players.find(
      (player) => player._id.toString() === this.playerID.toString()
    );

    if (!player) {
      this.handleError(req.t("game.errors.notPlayer"));
      this.socket.disconnect();
      return null;
    }

    return player;
  }

  /**
   * Start a new game by HTTP request
   */
  static gameStart = [
    checkSchema({
      roomID: {
        notEmpty: {
          errorMessage: "game.errors.roomIdEmpty",
        },
        isMongoId: {
          errorMessage: "game.errors.roomIdInvalid",
        },
      },
      roles: {
        notEmpty: {
          errorMessage: "game.errors.rolesEmpty",
        },
      },
      traits: {
        notEmpty: {
          errorMessage: "game.errors.traitsEmpty",
        },
      },
      vote_time: {
        optional: true,
        isInt: {
          options: { min: 30, max: 300 },
          errorMessage: "game.errors.voteTimeInvalid",
          bail: true,
        },
      },
      discussion: {
        optional: true,
        isInt: {
          options: { min: 60, max: 600 },
          errorMessage: "game.errors.discussionTimeInvalid",
          bail: true,
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json(errors);
      }

      const ownerID = req.user;
      const { roomID, roles, traits, vote_time, discussion_time } = req.body;

      // Check if room is not found
      const room = await Room.findById(roomID);
      if (!room) {
        return res.status(404).json({ errors: req.t("game.errors.roomNotFound") });
      }

      // Check if game already started
      const gameExists = await Game.findOne({
        room: ObjectId.createFromHexString(roomID),
      });

      if (gameExists) {
        return res.status(400).json({
          message: req.t("game.errors.gameInProgress"),
        });
      }

      // Only the owner of the room can start the game
      if (!room.owner.equals(ownerID)) {
        return res
          .status(403)
          .json({ errors: req.t("game.errors.onlyOwnerCanStart") });
      }

      // Check the count of the players in the room
      if (room.players.length < 6 || room.players.length > 20) {
        return res
          .status(400)
          .json({ errors: req.t("game.errors.playerCountInvalid") });
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

      // Create game object with optional time settings
      const gameData = {
        room: ObjectId.createFromHexString(roomID),
        players: players,
        gameTurns: gameTurns,
      };

      // Add optional time settings if provided
      if (vote_time) gameData.vote_time = vote_time;
      if (discussion_time) gameData.discussion_time = discussion_time;

      const game = new Game(gameData);
      await game.save();

      // Get player IDs from the game object
      const playerIds = game.players.map((player) => player._id.toString());

      // Set each player in Redis
      for (const playerId of playerIds) {
        const redisKey = `user:${playerId}`;

        await redis.set(
          redisKey,
          JSON.stringify({
            roomID: game.room.toString(),
            gameID: game._id.toString(),
          }),
          "EX",
          86400
        );
      }

      return res
        .status(200)
        .json({ message: req.t("game.messages.gameStarted"), gameID: game._id });
    },
  ];

  /**
   * Method to exit the game
   */
  static gameOut = [
    checkSchema({
      gameID: {
        notEmpty: {
          errorMessage: "game.errors.roomIdEmpty",
        },
        isMongoId: {
          errorMessage: "game.errors.roomIdInvalid",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { gameID } = req.params;
      const userID = req.user;

      const game = await Game.findById(gameID);
      if (!game) {
        return res.status(404).json({ message: req.t("game.errors.notFound") });
      }

      // Remove player from game
      game.players = game.players.filter(
        (p) => p._id.toString() !== userID.toString()
      );

      // Save game state if anyone is left
      if (game.players.length > 0) {
        await game.save();
      } else {
        await game.deleteOne();
      }

      // Clear user's Redis entry
      const redisKey = `user:${userID}`;
      await redis.hDel(redisKey, "gameID");

      return res.status(200).json({
        message: req.t("game.messages.leftGame"),
      });
    },
  ];

  /**
   * Method to show role of a player
   */
  showRoles(game) {
    if (game.phases !== "showRoles") {
      return {
        status: 400,
      };
    }

    const player = this.getPlayer(game);
    const role = RoleController.getRoleFromPlayer(player.role, player.trait);
    const roleData = {
      trait: role.getTrait(),
      name: role.getName(),
      image: role.getImage(),
      description: role.getDescription(),
      message: req.t("game.messages.yourRole", {
        role: req.t(`role.name.${role.getName()}`),
        trait: req.t(`role.trait.${role.getTrait()}`),
      }),
    };

    return roleData;
  }

  /**
   * Retrieve the ability icons for the client
   */
  getAbilityIcons(game) {
    const player = this.getPlayer(game);

    const role = RoleController.getRoleFromPlayer(player.role, player.trait);

    const data = {
      availableActions: role.getAvailableAction(),
      abilityIcons: role.getAbilityIcons(),
    };

    return data;
  }

  /**
   * Method to choose target and perform actions
   */
  async performAction(game) {
    if (game.phases !== "performAction") {
      return {
        status: 400,
      };
    }

    // Get the player's action from Redis
    const actionKey = `game:${game._id}:action:${this.playerID.toString()}`;
    let action = await redis.get(actionKey);

    if (action) {
      action = JSON.parse(action);
      if (action.status !== "pending") {
        return {
          status: "error",
          message: req.t("game.errors.alreadyPerformedAction"),
        };
      }
    } else {
      action = {
        status: "pending",
        name: "",
        performer: [],
        target: [],
      };
      await redis.set(actionKey, JSON.stringify(action), "EX", 86400);
    }

    const waitForTarget = () => {
      return new Promise((resolve) => {
        const handler = (data) => {
          this.socket.off("game:targetSelected", handler);
          resolve(data);
        };
        this.socket.on("game:targetSelected", handler);
      });
    };

    // Wait for the target selection or timeout
    const targetID = await waitForTarget();

    // If no target was selected or timed out
    if (!targetID) {
      return {
        status: "success",
        message: req.t("game.errors.noAction"),
      };
    }

    // Find the target player
    const target = game.players.find(
      (target) => target._id.toString() === targetID.toString()
    );

    if (!target) {
      return {
        status: "error",
        message: req.t("game.errors.targetNotFound"),
      };
    }

    // Wait for the action selection or timeout
    const waitForAction = () => {
      return new Promise((resolve) => {
        const handler = (data) => {
          this.socket.off("game:actionSelected", handler);
          resolve(data);
        };
        this.socket.on("game:actionSelected", handler);
      });
    };

    const inputAction = await waitForAction();

    const targetName = target.name;

    // If timed out and no action was selected
    if (!inputAction) {
      return {
        status: "success",
        message: req.t("game.errors.noAction", { targetName }),
      };
    }

    const player = this.getPlayer(game);
    if (
      !(await RoleController.submitAction(
        player,
        inputAction,
        target,
        game._id
      ))
    ) {
      // Save the state of the action
      action.status = "failed";
      action.name = inputAction;
      action.performer.push(this.playerID);
      action.target.push(targetID);

      // Store the state of the action in Redis
      await redis.set(actionKey, JSON.stringify(action), "EX", 86400);

      return {
        status: "error",
        message: req.t("game.errors.cannotPerformAction"),
      };
    }

    await RoleController.resolveActions(player, inputAction, target, game._id);

    // Save successful action
    action.status = "successful";
    action.name = inputAction;
    action.performer.push(this.playerID);
    action.target.push(targetID);

    await redis.set(actionKey, JSON.stringify(action), "EX", 86400);

    // Return success message
    return {
      status: "success",
      message: req.t("game.messages.performedAction", { action: action.name, targetName }),
    };
  }

  /**
   * Method to watch other players performing
   */
  async watchOtherPlayers(game, targetID) {
    // Only wacth other players in perform action phase
    if (game.phases !== "performAction") {
      return {
        status: 400,
      };
    }

    const player = this.getPlayer(game);

    // Only stalker can watch other players
    if (player.role !== "Stalker") {
      return {
        status: "error",
      };
    }

    // Find state and target
    const actionKey = `game:${game._id}:action:${targetID.toString()}`;
    const actionData = await redis.get(actionKey);

    const action = actionData ? JSON.parse(actionData) : null;

    if (!action) {
      return { message: req.t("game.errors.actionError") };
    }

    const target = game.players.find(
      (target) => target._id.toString() === action.target.toString()
    );

    if (!target) {
      return {
        status: "error",
        message: req.t("game.errors.targetNotFound"),
      };
    }

    // If the target is not being watched, then the player choose not to watch the target
    if (!target.status.isBeing.includes("watched")) {
      return {
        status: "error",
        message: req.t("game.errors.targetNotBeingWatched"),
      };
    }

    let performerNames;
    const targetName = target.name;

    // Player is mad, so we need to emit some random performer names
    if (player.trait === "mad") {
      const playersName = game.players.map((player) => player.name);

      // Create a copy of the array and shuffle it
      const shuffledNames = [...playersName];
      shuffle(shuffledNames);

      // Generate a random length between 1 and the total number of players
      const randomLength = Math.floor(Math.random() * playersName.length) + 1;
      performerNames = shuffledNames.slice(0, randomLength);

      // Return a slice of the shuffled array with random length
      return {
        performers: performerNames,
        message: req.t("game.messages.watchedOtherPlayers", { performerNames, targetName }),
      };
    }

    // Emit the real performer name
    performerNames = game.players
      .filter((player) => action.performer.includes(player._id.toString()))
      .map((player) => player.name);

    return {
      performers: performerNames,
      message: req.t("game.messages.watchedOtherPlayers", { performerNames, targetName }),
    };
  }

  /**
   * Method to report last night's results
   */
  async dayPhase(game) {
    if (game.phases !== "day") {
      return {
        status: 400,
      };
    }

    // Get all players
    const players = game.players;

    //Get the dead players
    const deadPlayers = players.filter((player) => !player.status.isAlive);

    // Get the count of alive players
    const alivePlayers = players.filter(
      (player) => player.status.isAlive
    ).length;

    let poisonMessage = "";

    const poisonedPlayers = players.filter(
      (player) =>
        player.status.isAlive &&
        player.status.isBeing &&
        player.status.isBeing.includes("poisoned") &&
        player.status.poisonDaysRemaining > 0
    );

    // Reduce poisonDaysRemaining and handle death if poisonedDaysRemaining <= 0
    poisonedPlayers.forEach((player) => {
      player.status.poisonDaysRemaining -= 1; // Decrease the poison days

      if (player.status.poisonDaysRemaining < 1) {
        player.status.isAlive = false; // If poison days are 0 or less, the player dies
      }
    });

    if (poisonedPlayers.length > 0) {
      poisonMessage = req.t("game.messages.poisonedPlayers", { poisonedPlayers });
    }

    if (deadPlayers.length === 0) {
      return {
        status: "success",
        message: req.t("game.messages.noDeath"),
      };
    }

    // Now, poisoned players who died should be added to the deadPlayers array
    const poisonedDeadPlayers = poisonedPlayers.filter(
      (player) => !player.status.isAlive
    );

    // Add poisoned dead players to the deadPlayers list
    deadPlayers.push(...poisonedDeadPlayers);

    // Include name and trait of dead players in the response
    const deadPlayerDetails = deadPlayers.map((player) => ({
      name: player.name,
      role: player.role,
      trait: player.trait,
    }));

    await game.save();

    const allTraits = players
      .filter((player) => player.status.isAlive)
      .map((player) => player.trait);

    // Check end game conditions
    const isGameOver = await this.gameEnd(game, alivePlayers, allTraits);
    if (isGameOver) {
      return {
        status: "success",
        message: req.t("game.messages.gameOver"),
        gameEnded: true,
      };
    }

    const message = req.t("game.messages.deadPlayers", { deadPlayerDetails });

    return {
      status: "success",
      message: message + (poisonMessage ? ". " + poisonMessage : ""),
      details: deadPlayerDetails,
    };
  }

  /**
   * Method to allow players to chat and discuss in the morning
   */
  async discussionPhase(game, message) {
    if (game.phases !== "discussion") {
      return {
        status: 400,
      };
    }

    // Validate data
    if (!message) {
      return {
        status: "error",
        message: req.t("game.errors.messageEmpty"),
      };
    }

    // Check if player exists and is alive
    const player = this.getPlayer(game);

    if (!player || !player.status.isAlive) {
      return {
        status: "error",
        message: req.t("game.errors.cannotChat"),
      };
    }

    // Broadcast the message to all players in the room
    this.io.to(game.room.toHexString()).emit("game:fetchDayChat", {
      playerName: player.name,
      message: message,
    });

    return {
      status: "success",
    };
  }

  /**
   * Method to allow players to chat and discuss at night
   */
  // async nightChat(game, message) {
  //   if (game.period !== "night") {
  //     return {
  //       status: 400,
  //     };
  //   }

  //   // Validate data
  //   if (!message) {
  //     return {
  //       status: "error",
  //       message: "Tin nhắn không được để trống!",
  //     };
  //   }

  //   // Check if player exists and is alive
  //   const player = this.getPlayer(game);

  //   if (!player.status.isAlive) {
  //     return {
  //       status: "error",
  //       message: "Bạn không thể nói chuyện!",
  //     };
  //   }

  //   this.socket.broadcast.to(player1, player2).emit("game:fetchNightChat", {
  //     playerName: player.name,
  //     message: message,
  //   });

  //   return {
  //     status: "success",
  //     message: "Tin nhắn đã được gửi!",
  //   };
  // }

  /**
   * Method to vote for the suspect and hang him on
   */
  async votePhase(game, targetID) {
    // Check if current phase is "vote"
    if (game.phases !== "vote") {
      return { status: 400 };
    }

    // Handle no vote case
    if (!targetID) {
      return {
        status: "success",
        message: req.t("game.errors.noVote"),
      };
    }

    // Get target data
    const target = game.players.find(
      (player) => player._id.toString() === targetID.toString()
    );

    // Check if target exists
    if (!target) {
      return {
        status: "error",
        message: req.t("game.errors.targetNotFound"),
      };
    }

    // Check if target is alive
    if (!target.status.isAlive) {
      return {
        status: "error",
        message: req.t("game.errors.canOnlyVoteForAlivePlayers"),
      };
    }

    // Get current votes from Redis
    const gameVoteKey = `game:${game._id}:votes`;
    let currentVotes = [];

    const votesData = await redis.get(gameVoteKey);
    if (votesData) {
      currentVotes = JSON.parse(votesData);
    } else {
      currentVotes = [
        {
          target: "",
          count: 0,
          voters: [],
        },
      ];
    }

    // Check if user already voted (using voters array consistently)
    const userPreviousVote = currentVotes.find(
      (vote) => vote.voters && vote.voters.includes(this.playerID.toString())
    );

    // Remove previous vote if exists
    if (userPreviousVote) {
      userPreviousVote.count -= 1;
      userPreviousVote.voters = userPreviousVote.voters.filter(
        (id) => id !== this.playerID.toString()
      );

      // Remove vote entry if count becomes 0
      if (userPreviousVote.count <= 0) {
        currentVotes = currentVotes.filter((vote) => vote.count > 0);
      }
    }

    // Find if target already has votes
    const existingVoteIndex = currentVotes.findIndex(
      (vote) => vote.target.toString() === targetID.toString()
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote count
      currentVotes[existingVoteIndex].count += 1;
      currentVotes[existingVoteIndex].voters =
        currentVotes[existingVoteIndex].voters || [];
      currentVotes[existingVoteIndex].voters.push(this.playerID);
    } else {
      // Create new vote entry
      currentVotes.push({
        target: targetID,
        count: 1,
        voters: [this.playerID],
      });
    }

    this.io.to(game.room.toHexString()).emit("fetchVotes", currentVotes);

    // Save updated votes back to Redis
    await redis.set(gameVoteKey, JSON.stringify(currentVotes), "EX", 86400);
    const targetName = target.name;

    return {
      status: "success",
      message: req.t("game.messages.votedFor", { targetName }),
    };
  }

  /**
   * Method to handle vote result
   */
  async afterVoteHandler(game) {
    if (game.phases !== "handleVotes") {
      return {
        status: 400,
      };
    }

    // Get current votes from Redis
    const gameVoteKey = `game:${game._id}:votes`;

    // Retrieve the vote data
    const votes = await redis.get(gameVoteKey);
    // Early return if no votes
    if (!votes) {
      return { status: "success", message: req.t("game.errors.noVotes") };
    }

    const voteData = JSON.parse(votes);

    const maxCount = Math.max(...voteData.map((vote) => vote.count));
    const alivePlayers = game.players.filter(
      (player) => player.status.isAlive
    ).length;

    // Validate vote rules
    const voteRules = RuleController.voteRule(alivePlayers, maxCount);
    if (voteRules.errors) {
      return { status: "error", message: voteRules.errors };
    }

    // Check for tie
    const tiedVotes = voteData.filter((vote) => vote.count === maxCount);
    if (tiedVotes.length > 1) {
      return {
        status: "tie",
        message: req.t("game.errors.tie", { maxCount }),
      };
    }

    // Get the voted player
    const targetId = tiedVotes[0].target.toString();
    const player = game.players.find(
      (player) => player._id.toString() === targetId
    );

    if (!player) {
      return { status: "error", message: req.t("game.errors.playerNotFound") };
    }

    // Mark player as dead
    player.status.isAlive = false;

    // Save game state
    await game.save();

    const allTraits = game.players
      .filter((player) => player.status.isAlive)
      .map((player) => player.trait);

    // Check end game conditions
    const isGameOver = await this.gameEnd(game, alivePlayers - 1, allTraits);
    if (isGameOver) {
      return {
        status: "success",
        message: req.t("game.messages.gameOver"),
        gameEnded: true,
      };
    }

    // Create appropriate message based on player role
    const baseMessage = req.t("game.messages.suspect", { playerName: player.name, role: player.role });
    const message =
      player.trait === "bad"
        ? `${baseMessage}!`
        : `${baseMessage}, ${req.t("game.messages.suspectNotBad")}`;

    return {
      status: "success",
      message: message,
    };
  }

  /**
   * Method to handle game end
   */
  async gameEnd(game, alivePlayers, traitCount) {
    const endConditions = RuleController.gameOver(alivePlayers, traitCount);
    if (!endConditions.errors && endConditions.isOver) {
      const reason = endConditions.reason;
      const winner = endConditions.winner;

      game.phases = "end";
      await game.save();

      const playerDetails = game.players.map((player) => ({
        name: player.name,
        role: player.role,
        trait: player.trait,
      }));

      this.io.to(game.room.toString()).emit("game:end", {
        reason: reason,
        winner: winner,
        playerDetails: playerDetails,
      });

      return true;
    }

    return false;
  }
}

module.exports = { GameController };
