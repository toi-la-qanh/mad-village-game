const Role = require("../role.model");

class Bully extends Role {
  #trait;
  constructor(trait) {
    let name = "Bully";
    let imagePath = "./src/models/roles/assets/bully.png";
    super(name, "", {}, [], 0, 0, imagePath);
    this.#trait = trait;
    this.setTrait(this.#trait);
  }

  setTrait(trait) {
    switch (trait) {
      case "mad":
        this.getAbilities().canBlock = false;
        this.getAbilities().canKill = false;
        super.setDescription("Chặn hành động người chơi được chỉ định.");
        this.setAvailableAction("block");
        this.setActionPriorities(1);
        break;
      case "bad":
        super.setDescription(
          "Chặn hành động và giết người chơi được chỉ định."
        );
        super.setCount(Infinity);
        this.getAbilities().canBlock = true;
        this.getAbilities().canKill = true;
        this.setAvailableAction(["block", "kill"]);
        this.setActionPriorities(1);
        break;
      default:
        super.setDescription("Chặn hành động người chơi được chỉ định.");
        super.setCount(Infinity);
        this.getAbilities().canBlock = true;
        this.getAbilities().canKill = false;
        this.setAvailableAction("block");
        this.setActionPriorities(1);
        break;
    }
  }

  getTrait() {
    return this.#trait;
  }
}

module.exports = Bully;
