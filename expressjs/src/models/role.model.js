const fs = require("fs");

class Role {
  #name;
  #description;
  #abilities;
  #availableAction;
  #actionPriorities;
  #counts;
  #image;
  #abilityIcons;
  #traits;

  constructor(
    name,
    description,
    abilities = {},
    availableAction = [],
    actionPriorities,
    counts,
    imagePath,
    abilityIcons = []
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
      canParalyze: false,
      canDetoxify: false,
      ...abilities,
    };
    this.#availableAction = availableAction;
    this.#actionPriorities = actionPriorities;
    this.#counts = counts;
    this.#image = this.convertImageToBase64(imagePath);
    this.#abilityIcons = abilityIcons;
    this.#traits = [];
  }

  convertImageToBase64(imagePath) {
    const image = fs.readFileSync(imagePath);
    return Buffer.from(image).toString("base64");
  }

  hasTrait(trait) {
    return this.#traits.includes(trait);
  }

  canPerformAction(action, player, target) {
    // Check if player is alive
    if (!player.status.isAlive) {
      console.log(`${player.name} is not alive and cannot perform actions.`);
      return false;
    }

    // Check if player is being blocked
    if (player.status.isBeing === "blocked") {
      console.log(`${player.name} is being blocked and cannot perform action.`);
      return false;
    }

    // Check if the target is alive
    if (!target.status.isAlive) {
      return false;
    }

    // Check if the action is available for the player's role
    if (action !== this.#availableAction) {
      console.log(`${action} is not available`);
      return false;
    }

    // Check if the player has enough counts for this action
    if (player.count < 1) {
      console.log(`${player.name} has no remaining uses for action: ${action}`);
      return false;
    }

    return true;
  }

  async useAction(action, performer) {
    // Check if player can perform this action
    if (!this.canPerformAction(action, performer)) {
      return false;
    }

    // Action is not effective if player has mad trait
    if (this.hasTrait("mad")) {
      return false;
    }

    // Reduce the count of this action
    performer.count--;
    await performer.save();

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

  setAbilitiesIcons(abilityIcons = []) {
    this.#abilityIcons = abilityIcons;
  }

  setActionPriorities(actionPriorities) {
    this.#actionPriorities = actionPriorities;
  }

  setCount(counts) {
    this.#counts = counts;
  }

  getName() {
    return this.#name;
  }

  getTrait() {
    return this.#traits;
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

  getAbilityIcons() {
    return this.#abilityIcons;
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
