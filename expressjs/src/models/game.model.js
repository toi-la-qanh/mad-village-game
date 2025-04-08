const mongoose = require("mongoose");
const { PlayerSchema } = require("./player.model");

const GameSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room", // Reference to the Room model
    required: true,
  },

  phases: {
    type: String,
    required: true,
    default: "showRoles",
  },

  day: {
    type: Number,
    required: true,
    default: 0,
  },

  period: {
    type: String,
    required: true,
    default: "day",
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

  currentTurn: {
    type: Number,
    required: true,
    default: 1,
  },

  players: [PlayerSchema],
  
  gameTurns: [
    {
      turn: {
        type: Number,
        required: true,
      },
      playerNotYetAct: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],
      playerActed: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],
    },
  ],
});

const Game = mongoose.model("Game", GameSchema);

module.exports = Game;
