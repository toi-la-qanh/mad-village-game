const Role = require("../role.model");

class Hunter extends Role {
  constructor(trait) {
    let description =
      "Đặt bẫy, úm ba la alaba trap. Khả năng: đặt bẫy vào 1 nhà, khoá chức năng trong 1 đêm.";
    let imagePath = "./src/models/roles/assets/hunter.png";
    super("Thợ săn", description, {}, 0, imagePath);
    this.trait = trait;
    this.setAvailableAction("Trap");
    this.setTrait(trait);
  }

  setAvailableAction(availableAction) {
    this.availableAction = availableAction;
  }

  setTrait(trait) {
    switch (trait) {
      case "mad":
        super.setCount(2);
        this.abilities.canTrap = false;
        break;
      case "bad":
        super.setCount(11);
        super.setDescription(
          "Đặt bẫy, úm ba la alaba trap. Khả năng: đặt bẫy vào 1 nhà, làm chết 1 người chơi."
        );
        this.abilities.canTrap = false;
        break;
      default:
        super.setCount(2);
        this.abilities.canTrap = true;
        break;
    }
  }

  getTrait() {
    return this.trait;
  }
}

module.exports = Hunter;
