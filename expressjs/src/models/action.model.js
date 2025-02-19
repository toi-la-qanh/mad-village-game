const mongoose = require("mongoose");

const ActionSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  performer: {
    // The player performing the action
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    required: true,
  },
  target: {
    // Target who has been selected
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    required: false,
  },
  status: {
    // Status of the action after resolution
    type: String,
    enum: ['pending', 'successful', 'failed'],
    default: 'pending',
  },
});

module.exports = { ActionSchema };
