const mongoose = require("mongoose");
const { PlayerSchema } = require("./player.model");
const { ActionSchema } = require("./action.model");

const GameSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room", // Reference to the Room model
    required: true,
  },
  phases: {
    type: String,
    required: true,
    default: "night",
  },
  day: {
    type: Number,
    required: true,
    default: 0,
  },
  discussion_time: {
    type: Number,
    required: true,
    default: 120,
  },
  vote_time: {
    type: Number,
    required: true,
    default: 30,
  },
  players: [PlayerSchema],
  states: [ActionSchema],
});

const Game = mongoose.model("Game", GameSchema);

module.exports = Game;
