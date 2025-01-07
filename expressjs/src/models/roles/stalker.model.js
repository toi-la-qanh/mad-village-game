const Role = require("../role.model");

class Stalker extends Role {
  constructor(trait) {
    let description = 'Thái nhân cách, thích rình mò người khác. Khả năng: núp sau nhà để rình người chơi khác.';
    let imagePath = "./src/models/roles/assets/stalker.png";
    super(
      "Người theo dõi",
      description,
      {},
      0,
      imagePath
    );
    this.trait = trait;
    super.setCount(11);
    this.setAvailableAction("Stalk");
    this.setTrait(trait);
  }

  setAvailableAction(availableAction) {
    this.availableAction = availableAction;
  }

  setTrait(trait) {
    switch (trait) {
      case "mad":
        this.abilities.canStalk = false;
        break;
      case "bad":
        super.setDescription("Thái nhân cách, thích rình mò người khác. Khả năng: núp sau nhà để rình, xem vai trò người chơi khác.");
        this.abilities.canStalk = true;
        break;
      default:
        this.abilities.canStalk = true;
        break;
    }
  }

  getTrait() {
    return this.trait;
  }
}

module.exports = Stalker;
