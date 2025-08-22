const Role = require("../role.model");
const i18next = require("i18next");

class Villager extends Role {
  #trait;
  #lang;
  constructor(trait = "mad", lang = "en") {
    let name = "Villager";
    let imagePath = "./src/models/roles/assets/villager.png";
    super(name, "", {}, [], 0, 0, imagePath, []);
    this.#trait = "mad";
    this.#lang = lang;
    super.setDescription(i18next.t("role.description.Villager.default", { lng: this.#lang }));
    super.setCount(Infinity);
  }
  getTrait() {
    return this.#trait;
  }
}

module.exports = Villager;
