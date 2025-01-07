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
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

RoomSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 10800,
    partialFilterExpression: { owner: null }
  }
);

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
