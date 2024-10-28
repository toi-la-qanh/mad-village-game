const Role = require("../role.model");

class Bullier extends Role {
  constructor() {
    super(
      "Dân anh chị",
      "Có quyền lực bậc nhất trong showbiz. Người tốt: bảo vệ chủ nhà được chỉ định, nếu thành công sẽ chết sau 1 đêm. Người xấu: bạo hành chủ nhà được chỉ định, và lộ thông tin người đó.",
      {
        canProtect: false,
        canBully: false,
      },
      0
    );
  }

  setType(type) {
    super.setType(type);

    if (type === "good") {
      super.setCount(2);
      this.abilities.canProtect = true;
      this.abilities.canBully = false;
    }
    else if (type === "bad") {
      super.setCount(11);
      this.abilities.canProtect = false;
      this.abilities.canBully = true;
    }
  }

  getType() {
    super.getType(type);
  }
}

module.exports = Bullier;