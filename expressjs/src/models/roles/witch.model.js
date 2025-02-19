const Role = require("../role.model");

class Witch extends Role {
  #trait;
  constructor(trait) {
    let name = "Witch";
    let imagePath = "./src/models/roles/assets/witch.png";
    super(name, "", {}, [], 0, 0, imagePath);
    this.#trait = trait;
    this.setTrait(this.#trait);
  }

  setTrait(trait) {
    switch (trait) {
      case "mad":
        super.setCount(2);
        this.getAbilities().canSave = false;
        this.getAbilities().canPoison = false;
        this.setActionPriorities(3);
        break;
      case "bad":
        super.setCount(Infinity);
        super.setDescription(
          "Yểm bùa người chơi. Khả năng: yểm bùa ngải 1 người chơi, gây ra mầm bệnh. Người chơi bị yểm nếu thăm nhà người khác sẽ lây bệnh. Người bị yểm sẽ chết sau 2 đêm."
        );
        this.getAbilities().canSave = false;
        this.getAbilities().canPoison = true;
        this.setAvailableAction("Poison");
        this.setActionPriorities(3);
        break;
      default:
        super.setCount(2);
        this.getAbilities().canSave = true;
        this.getAbilities().canPoison = false;
        this.setActionPriorities(3);
        break;
    }
  }

  getTrait() {
    return this.#trait;
  }
}

module.exports = Witch;
