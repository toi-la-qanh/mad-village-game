const { checkSchema, validationResult } = require("express-validator");
const User = require("../models/user.model");
const createSecretToken = require("../auth/token");
const redis = require("../database/redis");

class UserController {
  /**
   * Method to get the user data and check their account status
   */
  static getLoggedInUser = async (req, res) => {
    const user = await User.findById(req.user);

    // Check if the user is existing
    if (!user) {
      return res.status(404).json({ error: req.t("user.errors.notFound") });
    }

    const { _id: id, name, isAboutToClose } = user;
    const responseData = { id, name };

    const userData = await redis.get(`user:${req.user}`);

    let userDataParsed;
    if (userData) {
      userDataParsed = JSON.parse(userData);
    } else {
      userDataParsed = { roomID: null, gameID: null };
    }
    
    responseData.room = userDataParsed.roomID;
    responseData.game = userDataParsed.gameID;

    // Check if the user's account is about to close
    if (isAboutToClose) {
      responseData.message =
        req.t("user.messages.accountAboutToClose");
    }

    return res.status(200).json(responseData);
  };

  /**
   * Method to create an user
   */
  static signup = [
    checkSchema({
      name: {
        notEmpty: {
          errorMessage: "user.errors.nameEmpty",
        },
        isLength: {
          options: { min: 2, max: 30 },
          errorMessage: "user.errors.nameLength",
        },
        matches: {
          options: /^(?=.*[a-zA-Z].*[a-zA-Z])[a-zA-Z0-9\sà-ỹÀ-Ỵ]*$/u,
          errorMessage: "user.errors.nameInvalid",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Map and translate error messages
        const translatedErrors = errors.array().map(err => ({
          ...err,
          msg: req.t(err.msg) || err.msg
        }));
        return res.status(422).json({ errors: translatedErrors });
      }

      const { name } = req.body;
      const checkIfUserExists = await User.findOne({ name: name });

      if (checkIfUserExists) {
        return res.status(400).json({ errors: req.t("user.errors.nameExists") });
      }

      const user = new User({
        name: name,
      });

      await user.save();

      const token = createSecretToken(user._id, user.name);

      res.cookie("token", token, {
        path: "/", // Cookie is accessible from all paths
        expires: new Date(Date.now() + 86400000), // Cookie expires in 1 day
        secure: process.env.NODE_ENV === "production", // Cookie will only be sent over HTTPS
        httpOnly: true, // Cookie cannot be accessed via client-side scripts
        sameSite: process.env.sameSite, // Set to Lax when run on local
      });

      return res.status(200).json({ message: req.t("user.messages.signupSuccess") });
    },
  ];

  /**
   * Method to delete an user
   */
  static deleteAccount = async (req, res) => {
    const deletedUser = await User.findByIdAndDelete(req.user);

    // Check if the user was found and deleted
    if (!deletedUser) {
      return res.status(404).json({ error: req.t("user.errors.notFound") });
    }

    return res
      .status(200)
      .json({ message: req.t("user.messages.deleteSuccess") });
  };
}

module.exports = { UserController };
