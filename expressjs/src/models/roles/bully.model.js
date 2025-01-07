const Role = require("../role.model");

class Bully extends Role {
  constructor(trait) {
    let description =
      "Có quyền lực bậc nhất trong showbiz. Khả năng: bảo vệ chủ nhà được chỉ định, nếu thành công sẽ chết sau 1 đêm.";
    let imagePath = "./src/models/roles/assets/bully.png";
    super("Dân anh chị", description, {}, 0, imagePath);
    this.trait = trait;
    this.setAvailableAction("Protect");
    this.setTrait(trait);
  }

  setAvailableAction(availableAction) {
    this.availableAction = availableAction;
  }

  setTrait(trait) {
    switch (trait) {
      case "mad":
        this.abilities.canProtect = false;
        break;
      case "bad":
        super.setDescription(
          "Có quyền lực bậc nhất trong showbiz. Khả năng: bạo hành chủ nhà được chỉ định, và lộ thông tin người đó."
        );
        super.setCount(11);
        this.abilities.canProtect = false;
        this.abilities.canBully = true;
        this.setAvailableAction("Bully");
        break;
      default:
        super.setCount(2);
        this.abilities.canProtect = true;
        break;
    }
  }

  getTrait() {
    return this.trait;
  }
}

module.exports = Bully;
