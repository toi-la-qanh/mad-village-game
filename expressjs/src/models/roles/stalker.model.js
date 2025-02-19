const Role = require("../role.model");

class Stalker extends Role {
  #trait;
  constructor(trait) {
    let name = "Stalker";
    let imagePath = "./src/models/roles/assets/stalker.png";
    super(name, "", {}, [], 0, 0, imagePath);
    this.#trait = trait;
    super.setCount(Infinity);
    this.setTrait(this.#trait);
  }

  setTrait(trait) {
    switch (trait) {
      case "mad":
        this.setAvailableAction("stalk");
        this.getAbilities().canStalk = false;
        this.getAbilities().canKill = false;
        this.setActionPriorities(2);
        break;
      case "bad":
        super.setDescription(
          "Biết được những người có cùng mục tiêu với bản thân. Có thể giết mục tiêu."
        );
        this.getAbilities().canStalk = true;
        this.getAbilities().canKill = true;
        this.setAvailableAction("stalk", "kill");
        this.setActionPriorities(2);
        break;
      default:
        super.setDescription(
          "Biết được những người có cùng mục tiêu với bản thân."
        );
        this.getAbilities().canStalk = true;
        this.getAbilities().canKill = false;
        this.setAvailableAction("stalk");
        this.setActionPriorities(2);
        break;
    }
  }

  getTrait() {
    return this.#trait;
  }
}

module.exports = Stalker;
