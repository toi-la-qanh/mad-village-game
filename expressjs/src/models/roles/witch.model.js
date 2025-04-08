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
    // Define trait configurations in a lookup object
    const traitConfigs = {
      mad: {
        abilities: { canDetoxify: false, canPoison: false },
        description: "Có 2 bình thuốc: thuốc giải độc dùng để hoá giải độc tố cho người chơi, và thuốc hạ độc dùng để hạ độc người chơi.",
        count: 2,
        availableAction: ["detoxify", "poison"],
        actionPriority: 3,
        icons: ["poison", "detox"]
      },
      bad: {
        abilities: { canPoison: true, canParalyze: true },
        description: "Có 2 bình thuốc: thuốc độc dùng để hạ độc người chơi, và thuốc tê liệt ngăn chặn người chơi sử dụng kỹ năng.",
        count: Infinity,
        availableAction: ["poison", "paralyzed"],
        actionPriority: 1,
        icons: ["poison", "paralyze"]
      },
      good: {
        abilities: { canDetoxify: true, canPoison: true },
        description: "Có 2 bình thuốc: thuốc giải độc dùng để hoá giải độc tố cho người chơi, và thuốc hạ độc dùng để hạ độc người chơi.",
        count: 2,
        availableAction: ["detoxify", "poison"],
        actionPriority: 3,
        icons: ["poison", "detox"]
      }
    };
  
    // Default configuration when trait not found
    const defaultConfig = traitConfigs.good;
    
    // Get configuration for the specified trait or use default
    const config = traitConfigs[trait] || defaultConfig;
    
    // Apply configuration
    this.setAbilities(config.abilities);
    super.setDescription(config.description);
    super.setCount(config.count);
    this.setAvailableAction(config.availableAction);
    this.setActionPriorities(config.actionPriority);
    
    // Convert icons to base64
    const iconImages = config.icons.map(iconName => 
      super.convertImageToBase64(this.#abilityIcons[iconName])
    );
    
    super.setAbilitiesIcons(iconImages);
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
