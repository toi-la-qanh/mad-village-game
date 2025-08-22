const Role = require("../role.model");
const i18next = require("i18next");

class Stalker extends Role {
  #lang;
  #trait;
  #abilityIconsPath = {
    stalk: "./src/models/roles/assets/person-running-solid.png",
    knife: "./src/models/roles/assets/knife.png",
  };

  constructor(trait = "mad", lang = "en") {
    const name = "Stalker";
    const imagePath = "./src/models/roles/assets/stalker.png";

    super(name, "", {}, [], 2, 0, imagePath, []);
    this.#trait = trait;
    this.#lang = lang;
    this.configureTrait(trait);
  }

  configureTrait(trait) {
    const icons = [];
    const baseDescription = "role.description.Stalker.default";

    // Default configuration
    let abilities = { canStalk: true, canKill: false };
    let description = i18next.t(baseDescription, { lng: this.#lang });
    let availableAction = ["stalk"];

    if (trait === "mad") {
      abilities = { canStalk: false, canKill: false };
    } else if (trait === "bad") {
      abilities = { canStalk: true, canKill: true };
      description = i18next.t("role.description.Stalker.bad", { lng: this.#lang });
      availableAction.push("kill");
    }

    // Add icons based on abilities
    icons.push(super.convertImageToBase64(this.#abilityIconsPath.stalk));
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
