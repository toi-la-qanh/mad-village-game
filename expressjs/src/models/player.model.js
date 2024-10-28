class Player {
  constructor(role, status = {}, type) {
    this.role = role;
    this.status = {
      isAlive: true,
      getDebuff: false,
      ...status,
    };
    this.type = type;
  }

  // Method to check if player is alive
  isAlive() {
    return this.status.isAlive;
  }

  // Method to check if player gets debuff
  getDebuff() {
    return this.status.getDebuff;
  }

  setRole(role) {
    this.role = role;
  }

  setStatus(status) {
    this.status = status;
  }

  setType(type) {
    this.type = type;
  }

  getRole() {
    return this.role;
  }

  getStatus() {
    return this.status;
  }

  getType() {
    return this.type;
  }
}

module.exports = Player;
