const Role = require("../role.model");
const i18next = require("i18next");

class Doctor extends Role {
  #lang;
  #trait;
  #abilityIcons = {
    cure: "./src/models/roles/assets/syringe.png",
    save: "./src/models/roles/assets/bandage.png",
  };

  constructor(trait = "mad", lang = "en") {
    const name = "Doctor";
    const imagePath = "./src/models/roles/assets/doctor.png";
    super(name, "", {}, [], 3, 0, imagePath, []);
    this.#trait = trait;
    this.#lang = lang;
    this.configureTrait(trait);
  }

  configureTrait(trait) {
    const icons = [];

    // Default configuration (normal trait)
    let abilities = { canCure: true, canSave: true };
    let description = i18next.t("role.description.Doctor.default", { lng: this.#lang });
    let count = 2;
    let availableAction = ["cure", "save"];
    let actionPriority = 4;

    // Trait-specific configurations
    if (trait === "mad") {
      abilities = { canCure: false, canSave: false };
      count = Infinity;
    }

    icons.push(super.convertImageToBase64(this.#abilityIcons.cure));
    icons.push(super.convertImageToBase64(this.#abilityIcons.save));

    // Apply configuration
    this.setAbilities(abilities);
    super.setDescription(description);
    super.setCount(count);
    this.setAvailableAction(availableAction);
    this.setActionPriorities(actionPriority);
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

module.exports = Doctor;
