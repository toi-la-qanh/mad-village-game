const Role = require("../role.model");

class Bully extends Role {
  #trait;
  #abilityIconsPath = {
    lock: "./src/models/roles/assets/lock-solid.png",
    knife: "./src/models/roles/assets/knife.png",
  };

  constructor(trait = "") {
    const name = "Bully";
    const imagePath = "./src/models/roles/assets/bully.png";
    super(name, "", {}, [], 1, 0, imagePath, []);
    this.#trait = trait;
    this.configureTrait(trait);
  }

  configureTrait(trait) {
    const icons = [];

    // Default configuration
    let abilities = { canBlock: true, canKill: false };
    let description = "Chặn hành động người chơi được chỉ định.";
    const availableAction = ["block"];

    // Trait-specific configurations
    if (trait === "mad") {
      abilities = { canBlock: false, canKill: false };
    } else if (trait === "bad") {
      abilities = { canBlock: true, canKill: true };
      description = "Chặn hành động và giết người chơi được chỉ định.";
      availableAction.push("kill");
    }

    // Add icons based on abilities
    icons.push(super.convertImageToBase64(this.#abilityIconsPath.lock));
    if (abilities.canKill) {
      icons.push(super.convertImageToBase64(this.#abilityIconsPath.knife));
    }

    // Apply configuration
    this.setAbilities(abilities);
    super.setDescription(description);
    super.setCount(Infinity);
    this.setAvailableAction(availableAction);
    this.setActionPriorities(1);
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

module.exports = Bully;
