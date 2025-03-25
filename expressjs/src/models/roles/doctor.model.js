const Role = require("../role.model");

class Doctor extends Role {
  #trait;
  #abilityIcons = {
    cure: "./src/models/roles/assets/syringe.png",
    save: "./src/models/roles/assets/bandage.png",
  };

  constructor(trait = "mad") {
    const name = "Witch";
    const imagePath = "./src/models/roles/assets/witch.png";

    super(name, "", {}, [], 3, 0, imagePath, []);
    this.#trait = trait;
    this.configureTrait(trait);
  }

  configureTrait(trait) {
    const icons = [];

    // Default configuration (normal trait)
    let abilities = { canCure: true, canSave: true };
    let description =
      "Kim tiêm: chữa trị cho người chơi chỉ định. Băng gạc: cầm máu cho người chơi chỉ định.";
    let count = 2;
    let availableAction = ["cure"];
    let actionPriority = 4;

    // Trait-specific configurations
    if (trait === "mad") {
      abilities = { canDetoxify: false, canPoison: false };
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
