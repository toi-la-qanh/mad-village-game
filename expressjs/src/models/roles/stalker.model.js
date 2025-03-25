const Role = require("../role.model");

class Stalker extends Role {
  #trait;
  #abilityIconsPath = {
    stalk: "./src/models/roles/assets/person-running-solid.svg",
    knife: "./src/models/roles/assets/knife.png"
  };

  constructor(trait = "mad") {
    const name = "Stalker";
    const imagePath = "./src/models/roles/assets/stalker.png";
    
    super(name, "", {}, [], 2, 0, imagePath, []);
    this.#trait = trait;
    this.configureTrait(trait);
  }

  configureTrait(trait) {
    const icons = [];
    const baseDescription = "Biết được những người có cùng mục tiêu với bản thân";
    
    // Default configuration
    let abilities = { canStalk: true, canKill: false };
    let description = baseDescription + ".";
    let availableAction = "stalk";
    
    if (trait === "mad") {
      abilities = { canStalk: false, canKill: false };
    } else if (trait === "bad") {
      abilities = { canStalk: true, canKill: true };
      description = baseDescription + ". Có thể giết mục tiêu.";
      availableAction = ["stalk", "kill"];
    }
    
    // Add icons based on abilities
    if (abilities.canStalk) {
      icons.push(super.convertImageToBase64(this.#abilityIconsPath.stalk));
    }
    if (abilities.canKill) {
      icons.push(super.convertImageToBase64(this.#abilityIconsPath.knife));
    }
    
    // Apply configuration
    this.setAbilities(abilities);
    super.setDescription(description);
    super.setCount(Infinity);
    this.setAvailableAction(availableAction);
    this.setActionPriorities(2);
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

module.exports = Stalker;