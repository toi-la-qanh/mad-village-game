const Role = require("../role.model");

class Hunter extends Role {
  #trait;
  constructor(trait) {
    let name = "Hunter";
    let imagePath = "./src/models/roles/assets/hunter.png";
    super(name, "", {}, [], 0, 0, imagePath);
    this.#trait = trait;
    this.setTrait(this.#trait);
  }

  setTrait(trait) {
    switch (trait) {
      case "mad":
        super.setCount(2);
        this.getAbilities().canTrap = false;
        this.setActionPriorities(2);
        break;
      case "bad":
        super.setCount(Infinity);
        super.setDescription(
          "Đặt bẫy người chơi được chỉ định"
        );
        this.getAbilities().canTrap = true;
        this.setActionPriorities(2);
        break;
      default:
        super.setDescription(
          "Đặt bẫy người chơi được chỉ định"
        );
        super.setCount(2);
        this.setActionPriorities(1);
        this.getAbilities().canTrap = true;
        break;
    }
  }

  getTrait() {
    return this.#trait;
  }
}

module.exports = Hunter;
