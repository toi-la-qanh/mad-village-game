const Role = require("../role.model");

class Witch extends Role {
  constructor(trait) {
    let description =
      "Yểm bùa người chơi. Khả năng: Nhận 2 lá bùa. Người chơi bị yểm bùa sẽ được cứu rỗi.";
      let imagePath = "./src/models/roles/assets/witch.png";
      super("Phù thuỷ", description, {}, 0, imagePath);
    this.trait = trait;
    this.setAvailableAction("Save");
    this.setTrait(trait);
  }

  setAvailableAction(availableAction) {
    this.availableAction = availableAction;
  }

  setTrait(trait) {
    switch (trait) {
      case "mad":
        super.setCount(2);
        this.abilities.canSave = false;
        this.abilities.canPoison = false;
        break;
      case "bad":
        super.setCount(11);
        super.setDescription(
          "Yểm bùa người chơi. Khả năng: yểm bùa ngải 1 người chơi, gây ra mầm bệnh. Người chơi bị yểm nếu thăm nhà người khác sẽ lây bệnh. Người bị yểm sẽ chết sau 2 đêm."
        );
        this.abilities.canSave = false;
        this.abilities.canPoison = true;
        this.setAvailableAction("Poison");
        break;
      default:
        super.setCount(2);
        this.abilities.canSave = true;
        this.abilities.canPoison = false;
        break;
    }
  }

  getTrait() {
    return this.trait;
  }
}

module.exports = Witch;
