const mongoose = require("mongoose");

const ActionSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  targetSelector: {
    // Person who makes decision
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
  },
  selectedTarget: {
    // Target who has been chosen
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
  },
});

module.exports = { ActionSchema };
