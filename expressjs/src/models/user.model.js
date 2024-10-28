const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    avatar: { type: String, required: false, default: "default-avatar.png" },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    createdAt: { type: Date, default: Date.now, expires: "24h" },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const User = mongoose.model("User", UserSchema);
module.exports = User;