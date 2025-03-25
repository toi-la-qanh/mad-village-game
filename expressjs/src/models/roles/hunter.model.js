const Role = require("../role.model");

class Hunter extends Role {
  #trait;
  #abilityIcons = {
    trap: "./src/models/roles/assets/trap.png",
  };

  constructor(trait = "mad") {
    const name = "Hunter";
    const imagePath = "./src/models/roles/assets/hunter.png";

    super(name, "", {}, [], 2, 0, imagePath, []);
    this.#trait = trait;
    this.configureTrait(trait);
  }

  configureTrait(trait) {
    const defaultDescription = "Đặt bẫy người chơi được chỉ định";
    const icons = [super.convertImageToBase64(this.#abilityIcons.trap)];

    // Default configuration
    let abilities = { canTrap: true };
    let description = defaultDescription;
    let count = 2;
    let actionPriority = 2;
    let availableAction = "trap";

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
