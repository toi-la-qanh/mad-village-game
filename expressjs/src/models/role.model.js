const fs = require("fs");

function convertImageToBase64(imagePath) {
  const image = fs.readFileSync(imagePath);
  return Buffer.from(image).toString("base64");
}

class Role {
  #name;
  #description;
  #abilities;
  #availableAction;
  #actionPriorities;
  #counts;
  #image;
  #traits;

  constructor(
    name,
    description,
    abilities = {},
    availableAction = [],
    actionPriorities,
    counts,
    imagePath
  ) {
    this.#name = name;
    this.#description = description;
    this.#abilities = {
      canSave: false,
      canPoison: false,
      canProtect: false,
      canTrap: false,
      canStalk: false,
      canBlock: false,
      canKill: false,
      ...abilities,
    };
    this.#availableAction = availableAction;
    this.#actionPriorities = actionPriorities;
    this.#counts = counts;
    this.#image = convertImageToBase64(imagePath);
    this.#traits = [];
  }

  hasTrait(trait) {
    return this.#traits.includes(trait);
  }

  canPerformAction(action, player) {
    if (!player.status.isAlive()) {
      console.log(`${player.name} is not alive and cannot perform actions.`);
      return false;
    }
    if (player.status.isBeing === "blocked") {
      console.log(`${player.name} is being blocked and cannot perform action.`);
      return false;
    }
    if (!this.#abilities[action]) {
      console.log(`${action} does not exist`);
      return false;
    }
    if (action !== this.#availableAction) {
      console.log(`${action} is not available`);
      return false;
    }
    if (this.#counts < 1) {
      console.log(`${this.#name} has no remaining uses for action: ${action}`);
      return false;
    }
    return true;
  }

  useAction(action, performer) {
    if (!this.canPerformAction(action, performer)) {
      return false;
    }
    if (this.hasTrait("mad")) {
      console.log(`${this.#name} is mad; the action ${action} has no effect.`);
      return false;
    }
    this.#counts--;
    console.log(
      `${this.#name} performed the action: ${action}. Remaining uses: ${this.#counts}`
    );
    return true;
  }

  setName(name) {
    this.#name = name;
  }

  setDescription(description) {
    this.#description = description;
  }

  setImage(imagePath) {
    this.#image = imagePath;
  }

  setAbilities(abilities) {
    this.#abilities = abilities;
  }

  setAvailableAction(availableAction = []) {
    this.#availableAction = availableAction;
  }

  setActionPriorities(actionPriorities) {
    this.#actionPriorities = actionPriorities;
  }

  setCount(counts) {
    this.#counts = counts;
  }

  getDescription() {
    return this.#description;
  }

  getAbilities() {
    return this.#abilities;
  }

  getActionPriorities() {
    return this.#actionPriorities;
  }

  getCount() {
    return this.#counts;
  }

  getImage() {
    return this.#image;
  }

  getAvailableAction() {
    return this.#availableAction;
  }

  canSave() {
    return this.#abilities.canSave;
  }

  canPoison() {
    return this.#abilities.canPoison;
  }

  canProtect() {
    return this.#abilities.canProtect;
  }

  canTrap() {
    return this.#abilities.canTrap;
  }

  canStalk() {
    return this.#abilities.canStalk;
  }

  canBully() {
    return this.#abilities.canBully;
  }
}

module.exports = Role;