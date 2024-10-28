const Role = require("../role.model");

class Hunter extends Role {
  constructor() {
    super(
      "Thợ săn",
      "Đặt bẫy, úm ba la alaba trap. Người tốt: đặt bẫy vào 1 nhà, khoá chức năng và lộ thông tin kẻ xấu. Người xấu: đặt bẫy vào 1 nhà, làm chết 1 người chơi",
      {
        canTrap: false,
      },
      0
    );
  }

  setType(type) {
    super.setType(type);

    if (type === "good") {
      super.setCount(2);
      this.abilities.canTrap = true;
    } else if (type === "bad") {
      super.setCount(11);
      this.abilities.canTrap = false;
    }
  }

  getType() {
    super.getType(type);
  }
}

module.exports = Hunter;
