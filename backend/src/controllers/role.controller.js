const Bully = require("../models/roles/bully.model");
const Hunter = require("../models/roles/hunter.model");
const Stalker = require("../models/roles/stalker.model");
const Witch = require("../models/roles/witch.model");
const Doctor = require("../models/roles/doctor.model");
const Villager = require("../models/roles/villager.model");
const { checkSchema, validationResult } = require("express-validator");
const Game = require("../models/game.model");

class RoleController {
  constructor(game) {
    this.game = game; // The game instance
    this.pendingActions = []; // Collect actions during the phase
  }

  static listenForEvents(io, socket) {
    // Listen for role selection events from clients
    socket.on("role:select", async (data) => {
      // Only allow the owner of the room to select a role.
      // const room = await Room.findById(data.roomID);
      // if (!room.owner.toString().includes(socket.user)) {
      //   return;
      // }

      // Broadcast the selected role to other clients in the same room.
      io.to(data.roomID).emit("role:update", data.role);
    });

    // Listen for role removal events from clients
    socket.on("role:remove", async (data) => {
      // Only allow the owner of the room to remove a role.
      // const room = await Room.findById(data.roomID);
      // if (!room.owner.includes(socket.user)) {
      //   return;
      // }

      // Broadcast the removed role to other clients in the same room.
      io.to(data.roomID).emit("role:update", data.role);
    });
  }

  /**
   * Show all of the roles in the game
   */
  static roleIndex = async (req, res) => {
    // Map role classes to their allowed traits
    const roleTraitMap = {
      Bully: ["good", "bad"],
      Hunter: ["good"],
      Stalker: ["good", "bad"],
      Witch: ["good", "bad"],
      Doctor: ["good"],
    };

    const lang = req.query.lang || "en";

    // Create all roles based on allowed traits
    const roles = [];

    Object.entries(roleTraitMap).forEach(([roleClassName, allowedTraits]) => {
      // Get the class constructor based on the name
      const RoleClass =
        roleClassName === "Bully"
          ? Bully
          : roleClassName === "Hunter"
          ? Hunter
          : roleClassName === "Stalker"
          ? Stalker
          : roleClassName === "Witch"
          ? Witch
          : roleClassName === "Doctor"
          ? Doctor
          : null;

      if (RoleClass) {
        // Create role instances for each allowed trait
        allowedTraits.forEach((trait) => {
          roles.push(new RoleClass(trait, lang));
        });
      }
    });

    // Add Villager role
    roles.push(new Villager("mad", lang));

    // Format role details for response
    const rolesDetail = roles.map((role) => ({
      name: req.t(`role.name.${role.getName()}`),
      description: role.getDescription(),
      counts:
        role.getCount() === Infinity ? req.t("role.counts.infinite") : role.getCount() + " " + req.t("role.counts.times"),
      image: role.getImage(),
      abilityIcons: role.getAbilityIcons(),
      trait: req.t(`role.trait.${role.getTrait()}`),
    }));

    return res.status(200).json({ rolesDetail });
  };

  static roleInfo = [
    checkSchema({
      name: {
        notEmpty: {
          errorMessage: "role.errors.roleEmpty",
        },
        isString: {
          errorMessage: "role.errors.roleInvalid",
        },
      },
      trait: {
        notEmpty: {
          errorMessage: "role.errors.traitEmpty",
        },
        isString: {
          errorMessage: "role.errors.traitInvalid",
        },
        isIn: {
          options: [["good", "bad", "mad"]], // Valid trait values
          errorMessage: "role.errors.traitInvalid",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        // Map and translate error messages
        const translatedErrors = errors.array().map(err => ({
          ...err,
          msg: req.t(err.msg) || err.msg
        }));
        return res.status(422).json({ errors: translatedErrors });
      }
      const { name, trait, lang } = req.query;
      const roleClasses = {
        Bully: Bully(lang),
        Hunter: Hunter(lang),
        Stalker: Stalker(lang),
        Witch: Witch(lang),
        Villager: Villager(lang),
      };

      // Check if the requested role class exists
      const RoleClass = roleClasses[name];
      if (!RoleClass) {
        return res
          .status(404)
          .json({ errors: req.t("role.error.notFound", { name }) });
      }

      const role = new RoleClass(trait);

      // Return the details of the requested role
      return res.status(200).json({
        name: req.t(`role.name.${role.getName()}`),
        trait: req.t(`role.trait.${role.getTrait()}`),
        description: role.getDescription(),
        image: role.getImage(),
        action: role.getAvailableAction(),
      });
    },
  ];

  static chooseRandomRoleForVillager() {
    const roleClasses = [Bully, Hunter, Stalker, Witch];

    // Generate a random index
    const randomIndex = Math.floor(Math.random() * roleClasses.length);

    // Select the random class
    const RandomRole = new roleClasses[randomIndex]();

    // Retrieve the name of the role
    return RandomRole.getName();
  }

  /**
   * Get the details in role class of a player
   */
  static getRoleFromPlayer(role, trait) {
    switch (role) {
      case "Bully":
        return new Bully(trait);
      case "Hunter":
        return new Hunter(trait);
      case "Stalker":
        return new Stalker(trait);
      case "Witch":
        return new Witch(trait);
      case "Doctor":
        return new Doctor(trait);
      default:
        return null;
    }
  }

  /**
   * Method to submit an action
   */
  static async submitAction(player, actionType, target, gameID) {
    const role = this.getRoleFromPlayer(player.role, player.trait);

    // Deduct action count
    if (!(await role.useAction(actionType, player, target, gameID))) {
      return false;
    }

    return true;
  }

  /**
   * Method to resolve actions at the end of the phase
   */
  static async resolveActions(performer, actionType, target, gameID) {
    switch (actionType) {
      case "block":
        await Game.findOneAndUpdate(
          { _id: gameID, "players._id": target._id },
          { $push: { "players.$.status.isBeing": "blocked" } }
        );
        console.log(`${performer.name} blocks player ${target.name}`);
        break;
  
      case "protect":
        await Game.findOneAndUpdate(
          { _id: gameID, "players._id": target._id },
          { $push: { "players.$.status.isBeing": "protected" } }
        );
        console.log(`${performer.name} protects player ${target.name}`);
        break;
  
      case "save":
        await Game.findOneAndUpdate(
          { _id: gameID, "players._id": target._id },
          { $set: { "players.$.status.isAlive": true } }
        );
        console.log(`${performer.name} saves player ${target.name}`);
        break;
  
      case "kill":
        if (target.status.isBeing.includes("protected")) {
          console.log(
            `${performer.name} failed to kill ${target.name} because they are protected.`
          );
          break;
        }
        await Game.findOneAndUpdate(
          { _id: gameID, "players._id": target._id },
          { $set: { "players.$.status.isAlive": false } }
        );
        console.log(`${performer.name} kills player ${target.name}`);
        break;
  
      case "stalk":
        await Game.findOneAndUpdate(
          { _id: gameID, "players._id": target._id },
          { $push: { "players.$.status.isBeing": "watched" } }
        );
        console.log(`${performer.name} stalks player ${target.name}`);
        break;
  
      case "poison":
        await Game.findOneAndUpdate(
          { _id: gameID, "players._id": target._id },
          {
            $push: { "players.$.status.isBeing": "poisoned" },
            $set: { "players.$.status.poisonDaysRemaining": 2 },
          }
        );
        console.log(`${performer.name} poisons player ${target.name}`);
        break;
  
      case "paralyze":
        await Game.findOneAndUpdate(
          { _id: gameID, "players._id": target._id },
          { $push: { "players.$.status.isBeing": "paralyzed" } }
        );
        console.log(`${performer.name} paralyzes player ${target.name}`);
        break;
  
      case "detox":
        await Game.findOneAndUpdate(
          { _id: gameID, "players._id": target._id },
          {
            $pull: {
              "players.$.status.isBeing": { $in: ["poisoned", "paralyzed"] },
            },
          }
        );
        console.log(`${performer.name} detoxes player ${target.name}`);
        break;
  
      case "cure":
        await Game.findOneAndUpdate(
          { _id: gameID, "players._id": target._id },
          { $pull: { "players.$.status.isBeing": "poisoned" } }
        );
        console.log(`${performer.name} cures player ${target.name}`);
        break;
  
      default:
        console.log(`Unknown action type: ${actionType}`);
    }
  }
}

module.exports = { RoleController };
