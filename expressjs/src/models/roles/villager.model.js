const Role = require("../role.model");

class Villager extends Role {
  constructor() {
    let name = "Dân làng";
    let description = "Bị điên";
    let imagePath = "./src/models/roles/assets/villager.png";
    super(name, description, {}, 0, imagePath);
    super.setCount(11);
    this.setTrait("mad");
  }

  setTrait(trait) {
    this.trait = trait;
  }
}

module.exports = Villager;
