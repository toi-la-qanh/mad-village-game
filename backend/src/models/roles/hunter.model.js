const Role = require("../role.model");
const i18next = require("i18next");

class Hunter extends Role {
  #lang;
  #trait;
  #abilityIcons = {
    trap: "./src/models/roles/assets/trap.png",
  };

  constructor(trait = "mad", lang = "en") {
    const name = "Hunter";
    const imagePath = "./src/models/roles/assets/hunter.png";

    super(name, "", {}, [], 2, 0, imagePath, []);
    this.#trait = trait;
    this.#lang = lang;
    this.configureTrait(trait);
  }

  configureTrait(trait) {
    const defaultDescription = "role.description.Hunter.default";
    const icons = [super.convertImageToBase64(this.#abilityIcons.trap)];

    // Default configuration
    let abilities = { canTrap: true };
    let description = i18next.t(defaultDescription, { lng: this.#lang });
    let count = 2;
    let actionPriority = 2;
    let availableAction = ["trap"];

    // Trait-specific configurations
    if (trait === "mad") {
      abilities = { canTrap: false };
    }

    // Apply configuration
    this.setAbilities(abilities);
    super.setDescription(description);
    super.setCount(count);
    this.setActionPriorities(actionPriority);
    this.setAvailableAction(availableAction);
    super.setAbilitiesIcons(icons);
  }

  setTrait(trait) {
    this.#trait = trait;
    this.configureTrait(trait);
  }

  getTrait() {
    return this.#trait;
  }
}

module.exports = Hunter;
