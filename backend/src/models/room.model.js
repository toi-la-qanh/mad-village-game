const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    capacity: {
      type: Number,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
      },
    ],
    password: {
      type: String,
      default: "",
    },
    createdAt: { type: Date, default: Date.now, expires: "24h" },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
