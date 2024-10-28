const Role = require("../role.model");

class Witch extends Role {
  constructor() {
    super(
      "Thầy bà",
      "Yểm bùa người chơi. Người tốt: Nhận 2 lá bùa. Người chơi bị yểm bùa sẽ được cứu rỗi. Người xấu: yểm bùa ngải 1 người chơi, gây ra mầm bệnh. Người chơi bị yểm nếu thăm nhà người khác sẽ lây bệnh. Người bị yểm sẽ chết sau 2 đêm.",
      {
        canSave: false,
        canPoison: false,
      },
      0
    );
  }

  setType(type) {
    super.setType(type);

    if (type === "good") {
      super.setCount(2);
      this.abilities.canSave = true;
      this.abilities.canPoison = false;
    } else if (type === "bad") {
      super.setCount(11);
      this.abilities.canSave = false;
      this.abilities.canPoison = true;
    }
  }

  getType() {
    super.getType(type);
  }
}

module.exports = Witch;
