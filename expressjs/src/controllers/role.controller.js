const Bully = require("../models/roles/bully.model");
const Hunter = require("../models/roles/hunter.model");
const Stalker = require("../models/roles/stalker.model");
const Witch = require("../models/roles/witch.model");
const Villager = require("../models/roles/villager.model");

/* Endpoint to show all roles of the game */
const roleIndex = async (req, res) => {
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
    image: role.image
  }));

  return res.status(200).json({ rolesDetail });
};

const chooseRandomRoleForVillager = () => {
  const roleClasses = [
    new Bully(),
    new Hunter(),
    new Stalker(),
    new Witch(),
    new Villager(),
  ];

  // Generate a random index
  const randomIndex = Math.floor(Math.random() * roleClasses.length);

  // Select the random class
  const RandomRole = roleClasses[randomIndex];

  return RandomRole.name;
};

const save = async (target) => {
  if (!target.status.isAlive) {
    target.status.isAlive = true;
    await target.save();
    return `${target.name} was almost dead but someone has saved them`;
  }
  return `${target.name} is already alive, no save needed.`;
};

const poison = async (target) => {
  if (!target.status.isAlive) {
    target.status.isAlive = true;
    await target.save();
    return `${target.name} was almost dead but someone has saved them`;
  }
  return `${target.name} is already alive, no save needed.`;
};

const chooseAction = async (action, target, trait) => {
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
};

//get role of a player
const getRoleFromPlayer = (role, trait) => {
  switch (role) {
    case "Bullier":
      role = new Bully(trait);
      break;
    case "Hunter":
      role = new Hunter(trait);
      break;
    case "Stalker":
      role = new Stalker(trait);
      break;
    case "Witch":
      role = new Witch(trait);
      break;
    default:
      break;
  }
  return role;
};

//front end
// const chooseRoles = async (role, trait) => {
//   const roles = [];
//   const traits = [];
//   if (!["Bullier", "Hunter", "Witch"].includes(role)) {
//     return ;
//   }

//   if (role === "Villager") {
//     const randomRoles = ["Bullier", "Hunter", "Witch"];
//     const randomRole = randomRoles[Math.floor(Math.random() * randomRoles.length)];
//     roles.push(randomRole);
//     traits.push("mad");
//   } else {
//     // For other roles, push the role and its trait
//     roles.push(role);
//     traits.push(trait);
//   }

//   return { roles, traits };
// };

const checkAvailableAction = (action, role, trait) => {
  const roles = getRoleFromPlayer(role, trait);
  if (action !== roles.availableAction) {
    return false;
  }
  return true;
};

module.exports = {
  getRoleFromPlayer,
  roleIndex,
  chooseRandomRoleForVillager,
  checkAvailableAction,
  chooseAction,
};
