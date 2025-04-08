const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    isAboutToClose: {
      type: Boolean,
      default: false,
      required: true,
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
