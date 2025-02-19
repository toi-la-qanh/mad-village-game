const mongoose = require("mongoose");
const Game = require("./game.model");
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
