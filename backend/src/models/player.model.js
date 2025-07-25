const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User" 
  },
  name: {
    type: String,
    required: true,
  },
  priority: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  trait: {
    type: String,
    required: true,
  },
  count: {
    //Specify how many times a player can use skill
    type: Number,
    required: true,
    default: 2,
  },
  status: {
    isAlive: {
      type: Boolean,
      default: true,
    },
    isBeing: [
      {
        type: String,
      },
    ],
    poisonDaysRemaining: {
      type: Number,
      default: 0, // Days remaining for poisoned players to survive
    },
  },
});

module.exports = { PlayerSchema };
