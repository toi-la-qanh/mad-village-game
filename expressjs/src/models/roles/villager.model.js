const Role = require("../role.model");

class Villager extends Role {
  #trait;
  constructor() {
    let name = "Villager";
    let imagePath = "./src/models/roles/assets/villager.png";
    super(name, "", {}, [], 0, 0, imagePath, []);
    super.setDescription("Vai trò sẽ được chọn ngẫu nhiên");
    super.setCount(Infinity);
    this.#trait = "mad";
  }
  getTrait() {
    return this.#trait;
  }
}

module.exports = Villager;
