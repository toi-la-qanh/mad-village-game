const Bully = require("../models/roles/bully.model");
const Hunter = require("../models/roles/hunter.model");
const Stalker = require("../models/roles/stalker.model");
const Witch = require("../models/roles/witch.model");
const Villager = require("../models/roles/villager.model");
const { checkSchema,validationResult } = require("express-validator");

class RoleController {
  constructor(game) {
    this.game = game; // The game instance
    this.pendingActions = []; // Collect actions during the phase
  }

  static listenForEvents(io, socket) {
    socket.on("role:select", (data) => {
      io.to(data.roomID).emit("role:update", data.role);
    });
    socket.on("role:remove", (data) => {
      io.to(data.roomID).emit("role:update", data.role);
    });
  }

  /* Endpoint to show all roles of the game */
  static roleIndex = async (req, res) => {
    // Define available traits and roles
    const traits = ["good", "bad"];
    const roleClasses = [Bully, Hunter, Stalker, Witch];

    // Function to create both "good" and "bad" roles for each role class
    const createRolesForTrait = (RoleClass) => {
      return traits.map((trait) => new RoleClass(trait));
    };

    // Create all roles (each role will have both "good" and "bad" variants)
    const roles = roleClasses.flatMap(createRolesForTrait);
    roles.push(new Villager());

    const rolesDetail = roles.map((role) => ({
      name: role.name,
      trait: role.trait,
      image: role.image,
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
          options: [["good", "bad", "mad"]],  // Valid trait values
          errorMessage: "Thuộc tính vai trò không hợp lệ !",
        }
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
    const roleClasses = [
      new Bully(),
      new Hunter(),
      new Stalker(),
      new Witch(),
    ];

    // Generate a random index
    const randomIndex = Math.floor(Math.random() * roleClasses.length);

    // Select the random class
    const RandomRole = roleClasses[randomIndex];

    return RandomRole.name;
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
    let roleInstance;
    switch (role) {
      case "Bully":
        roleInstance = new Bully(trait);
        break;
      case "Hunter":
        roleInstance = new Hunter(trait);
        break;
      case "Stalker":
        roleInstance = new Stalker(trait);
        break;
      case "Witch":
        roleInstance = new Witch(trait);
        break;
      default:
        break;
    }
    return roleInstance;
  }

  // Method to submit an action
  submitAction(player, actionType, target) {
    const role = getRoleFromPlayer(player.role, player.trait);

    if (!role.canPerformAction(actionType, player)) {
      console.log(`${player.name} cannot perform the action: ${actionType}`);
      return false;
    }

    // Deduct action count
    if (!role.useAction(actionType, player)) {
      return false;
    }

    // Add to pending actions
    this.pendingActions.push({
      performer: player,
      actionType: actionType,
      target: target,
      priority: role.getActionPriority(actionType),
    });

    return true;
  }

  // Method to resolve actions at the end of the phase
  resolveActions() {
    for (const action of this.pendingActions) {
      const { performer, actionType, target } = action;

      // Resolve action based on type
      switch (actionType) {
        case "block":
          // Add target to blocked players
          target.status.isBeing.push("blocked");
          console.log(`${performer.name} blocks player ${target.name}`);
          break;

        case "protect":
          target.status.isBeing.push("protected");
          console.log(`${performer.name} blocks player ${target.name}`);
          break;

        case "save":
          target.status.isAlive = true;
          console.log(`${performer.name} saves player ${target.name}`);
          break;

        case "kill":
          if(target.status.isBeing === "protected") {
            console.log(`${performer.name} failed to kill player ${target.name} because someone has protected them.`);
            break;
          }
          target.status.isAlive = false;
          break;

        case "stalk":
          target.status.isBeing.push("watched");
          break;

        default:
          console.log(`Unknown action type: ${actionType}`);
      }
    }

    // Clear pending actions for the next phase
    this.pendingActions = [];
  }
}

module.exports = { RoleController };
