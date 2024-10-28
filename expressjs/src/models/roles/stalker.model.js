const Role = require("../role.model");

class Stalker extends Role {
  constructor() {
    super(
      "Người theo dõi",
      "Thái nhân cách, thích rình mò người khác. Người tốt: núp sau nhà để rình người chơi khác. Người xấu: chưa có.",
      {
        canStalk: false,
      },
      0
    );
  }

  setType(type) {
    super.setType(type);

    if (type === "good") {
      super.setCount(11);
      this.abilities.canStalk = true;
    }
  }

  getType() {
    super.getType(type);
  }
}

module.exports = Stalker;
