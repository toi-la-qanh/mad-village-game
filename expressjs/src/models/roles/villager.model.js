const Role = require("../role.model");

class Villager extends Role {
  #trait;
  constructor() {
    let name = "Villager";
    let imagePath = "./src/models/roles/assets/villager.png";
    super(name, "", {}, [], 0, 0, imagePath, []);
    super.setDescription("Chọn ngẫu nhiên một vai trò với thuộc tính điên");
    super.setCount(Infinity);
    this.#trait = "mad";
  }
  getTrait() {
    return this.#trait;
  }
}

module.exports = Villager;
