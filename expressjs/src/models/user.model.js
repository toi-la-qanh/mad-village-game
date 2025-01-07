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

UserSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 86400,
  }
);

// Middleware to prevent deletion if the user is in an active game
UserSchema.pre('remove', async function(next) {
  // Check if the user is part of any active game
  const activeGame = await Game.findOne({
    'players.player_id': this._id, // Check if this user is part of the players array
    'room': { $ne: null }, // Ensure the game is associated with a valid room
  });

  if (activeGame) {
    // If the user is in an active game, prevent deletion
    return next(new Error("User cannot be deleted because they are part of an active game."));
  }

  await Room.updateMany(
    { owner: this._id }, // Find all rooms where this user is the owner
    { $set: { owner: null } } // Set owner field to null
  );

  next();
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
