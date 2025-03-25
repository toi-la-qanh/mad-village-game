const Bully = require("../models/roles/bully.model");
const Hunter = require("../models/roles/hunter.model");
const Stalker = require("../models/roles/stalker.model");
const Witch = require("../models/roles/witch.model");
const Villager = require("../models/roles/villager.model");
const { checkSchema, validationResult } = require("express-validator");
const Room = require("../models/room.model");
const User = require("../models/user.model");

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

  /* Endpoint to show all roles of the game */
  static roleIndex = async (req, res) => {
    // Map role classes to their allowed traits
    const roleTraitMap = {
      Bully: ["good", "bad"],
      Hunter: ["good"],
      Stalker: ["good", "bad"],
      Witch: ["good", "bad"],
    };

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
          : null;

      if (RoleClass) {
        // Create role instances for each allowed trait
        allowedTraits.forEach((trait) => {
          roles.push(new RoleClass(trait));
        });
      }
    });

    // Add Villager role
    roles.push(new Villager());

    // Format role details for response
    const rolesDetail = roles.map((role) => ({
      name: role.getName(),
      description: role.getDescription(),
      counts: role.getCount(),
      image: role.getImage(),
      abilityIcons: role.getAbilityIcons(),
      trait: role.getTrait(),
    }));

    return res.status(200).json({ rolesDetail });
  };

  static roleInfo = [
    checkSchema({
      name: {
        notEmpty: {
          errorMessage: "Tên vai trò không được để trống !",
        },
        isString: {
          errorMessage: "Tên vai trò phải là một chuỗi ký tự !",
        },
      },
      trait: {
        notEmpty: {
          errorMessage: "Thuộc tính của vai trò không được để trống !",
        },
        isString: {
          errorMessage: "Thuộc tính của vai trò phải là một chuỗi ký tự !",
        },
        isIn: {
          options: [["good", "bad", "mad"]], // Valid trait values
          errorMessage: "Thuộc tính vai trò không hợp lệ !",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      const { name, trait } = req.query;
      const roleClasses = {
        Bully,
        Hunter,
        Stalker,
        Witch,
        Villager,
      };

      // Check if the requested role class exists
      const RoleClass = roleClasses[name];
      if (!RoleClass) {
        return res
          .status(404)
          .json({ errors: `Role class '${name}' not found.` });
      }

      const role = new RoleClass(trait);

      // Return the details of the requested role
      return res.status(200).json({
        name: role.getName(),
        trait: role.getTrait(),
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

  async chooseAction(action, target, trait) {
    if (trait === "mad") {
      return "no action";
    }
    switch (action) {
      case "save":
        save(target);
        break;
      case "poison":
        poison(target);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }

  //get role of a player
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
      default:
        return null;
    }
  }

  // Method to submit an action
  static submitAction(player, actionType, target) {
    const role = this.getRoleFromPlayer(player.role, player.trait);

    if (!role.canPerformAction(actionType, player, target)) {
      console.log(`${player.name} cannot perform the action: ${actionType}`);
      return false;
    }

    // Deduct action count
    if (!role.useAction(actionType, player)) {
      return false;
    }

    return true;
  }

  // Method to resolve actions at the end of the phase
  static async resolveActions(performer, actionType, target) {
    // Resolve action based on type
    switch (actionType) {
      case "block":
        // Add target to blocked players
        target.status.isBeing.push("blocked");
        await target.save();
        console.log(`${performer.name} blocks player ${target.name}`);
        break;

      case "protect":
        target.status.isBeing.push("protected");
        await target.save();
        console.log(`${performer.name} blocks player ${target.name}`);
        break;

      case "save":
        target.status.isAlive = true;
        await target.save();
        console.log(`${performer.name} saves player ${target.name}`);
        break;

      case "kill":
        if (target.status.isBeing === "protected") {
          console.log(
            `${performer.name} failed to kill player ${target.name} because someone has protected them.`
          );
          break;
        }
        target.status.isAlive = false;
        await target.save();
        break;

      case "stalk":
        target.status.isBeing.push("watched");
        await target.save();
        break;

      default:
        console.log(`Unknown action type: ${actionType}`);
    }
  }
}

module.exports = { RoleController };
