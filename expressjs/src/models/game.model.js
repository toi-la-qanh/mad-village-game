const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
    player_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    role: {
      type: String, 
      required: true,
    },
    type: {
      type: String, 
      required: true,
    },
    status: {
      isAlive: {
        type: Boolean,
        default: true,
      },
      getDebuff: {
        type: Boolean,
        default: false,
      },
    },
  });

const GameSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room", // Reference to the Room model
    required: true,
  },
  players: [PlayerSchema],
});

const Game = mongoose.model("Game", GameSchema);
module.exports = Game;
