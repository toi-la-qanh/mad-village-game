const Player = require("./player.model");

class Role extends Player {
    constructor(name, description, abilities = {}, counts, status, type) {
        super(name, status, type);
        this.description = description;
        this.abilities = {
            canSave: false,
            canPoison: false,
            canProtect: false,
            canTrap: false,
            canStalk: false,
            canBully: false,
            ...abilities
        };
        this.counts = counts; //specify how many times the role can use skill
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