const Role = require("../role.model");

class Villager extends Role {
  #trait;
  constructor() {
    let name = "Villager";
    let description = "Vai trò sẽ được chọn ngẫu nhiên";
    let imagePath = "./src/models/roles/assets/villager.png";
    super(name, description, {}, [], 0, 0, imagePath);
    super.setCount(Infinity);
    this.#trait = "mad";
    this.setTrait(this.#trait);
  }

  setTrait(trait) {
    this.#trait = trait;
  }
}

module.exports = Villager;
