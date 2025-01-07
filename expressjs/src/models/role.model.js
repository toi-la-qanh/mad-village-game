const fs = require('fs');

function convertImageToBase64(imagePath) {
  const image = fs.readFileSync(imagePath); // Read the image file
  return Buffer.from(image).toString("base64"); // Convert to Base64 string
}

class Role {
  constructor(name, description, abilities = {}, counts, imagePath) {
    this.name = name;
    this.description = description;
    this.abilities = {
      canSave: false,
      canPoison: false,
      canProtect: false,
      canTrap: false,
      canStalk: false,
      canBully: false,
      ...abilities,
    };
    this.counts = counts; //specify how many times the role can use skill
    this.image = convertImageToBase64(imagePath);
  }

  // Action that checks if the player can perform an action (e.g., kill, protect)
  canPerformAction(action, player) {
    if (!player.status.isAlive()) {
      console.log(`${this.name} is not alive and cannot perform actions.`);
      return false;
    }

    if (this.abilities[action]) {
      return this.counts > 0; // Can only perform the action if the count > 0
    }

    console.log(`${this.name} cannot perform the action: ${action}`);
    return false;
  }

  // Deducts from the ability count when the action is performed
  useAction(action) {
    if (this.canPerformAction(action)) {
      this.counts--;
      console.log(
        `${this.name} performed the action: ${action}. Remaining uses: ${this.counts}`
      );
      return true;
    }
    return false;
  }

  setDescription(description) {
    this.description = description;
  }

  setAbilities(abilities) {
    this.abilities = abilities;
  }

  setCount(counts) {
    this.counts = counts;
  }

  getDescription() {
    return this.description;
  }

  getAbilities() {
    return this.abilities;
  }

  getCount() {
    return this.counts;
  }

  // Method to check if the role can save the other player
  canSave() {
    return this.abilities.canSave;
  }

  // Method to check if the role can poison the other player
  canPoison() {
    return this.abilities.canPoison;
  }

  // Method to check if the role can protect the other player
  canProtect() {
    return this.abilities.canProtect;
  }

  // Method to check if the role can trap the other player
  canTrap() {
    return this.abilities.canTrap;
  }

  // Method to check if the role can stalk the other player
  canStalk() {
    return this.abilities.canStalk;
  }

  // Method to check if the role can bully the other player
  canBully() {
    return this.abilities.canBully;
  }
}

module.exports = Role;
