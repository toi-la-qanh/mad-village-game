const Role = require("../role.model");

class Witch extends Role {
  #trait;
  #abilityIcons = {
    detox: "./src/models/roles/assets/DetoxPotion.png",
    poison: "./src/models/roles/assets/PoisonPotion.png",
    paralyze: "./src/models/roles/assets/ParalysisPotion.png",
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
    let abilities = { canDetoxify: true, canPoison: true };
    let description =
      "Có 2 bình thuốc: thuốc giải độc dùng để hoá giải độc tố cho người chơi, và thuốc hạ độc dùng để hạ độc người chơi.";
    let count = 2;
    let availableAction = ["detoxify", "poison"];
    let actionPriority = 3;

    // Trait-specific configurations
    if (trait === "mad") {
      abilities = { canDetoxify: false, canPoison: false };
      // Keep description from parent class
    } else if (trait === "bad") {
      abilities = { canPoison: true, canParalyze: true };
      description =
        "Có 2 bình thuốc: thuốc độc dùng để hạ độc người chơi, và thuốc tê liệt ngăn chặn người chơi sử dụng kỹ năng.";
      count = Infinity;
      availableAction = ["poison", "paralyzed"];
      actionPriority = 1;
      icons.push(super.convertImageToBase64(this.#abilityIcons.poison));
      icons.push(super.convertImageToBase64(this.#abilityIcons.paralyze));
    }

    icons.push(super.convertImageToBase64(this.#abilityIcons.detox));

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

module.exports = Witch;
