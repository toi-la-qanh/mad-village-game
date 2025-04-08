const { checkSchema, validationResult } = require("express-validator");
const User = require("../models/user.model");
const Room = require("../models/room.model");
const createSecretToken = require("../auth/token");

class UserController {
  /**
   * Method to get the user data and check their account status
   */
  static getLoggedInUser = async (req, res) => {
    const user = await User.findById(req.user);

    // Check if the user is existing
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng!" });
    }

    const { _id: id, name, isAboutToClose } = user;
    const responseData = { id, name };

    const room = await Room.findOne({ players: user._id });
    if (room) {
      responseData.room = room._id;
    }

    // Check if the user's account is about to close
    if (isAboutToClose) {
      responseData.message =
        "Tài khoản của bạn sắp bị xoá! Hãy vào cài đặt xoá cookie và tạo tài khoản mới";
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
          errorMessage: "Tên không được để trống !",
        },
        isLength: {
          options: { min: 2, max: 30 },
          errorMessage: "Tên phải có từ 2-30 ký tự !",
        },
        matches: {
          options: /^(?=.*[a-zA-Z].*[a-zA-Z])[a-zA-Z0-9\sà-ỹÀ-Ỵ]*$/u,
          errorMessage: "Tên không phù hợp !",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json(errors);
      }

      const { name } = req.body;
      const checkIfUserExists = await User.findOne({ name: name });

      if (checkIfUserExists) {
        return res.status(400).json({ errors: "Tên người dùng đã tồn tại!" });
      }

      const user = new User({
        name: name,
      });

      await user.save();

      const token = createSecretToken(user._id);
      res.cookie("token", token, {
        path: "/", // Cookie is accessible from all paths
        expires: new Date(Date.now() + 86400000), // Cookie expires in 1 day
        secure: false, // Cookie will only be sent over HTTPS
        httpOnly: true, // Cookie cannot be accessed via client-side scripts
        sameSite: "Lax",
      });

      return res
        .status(200)
        .json({ message: "Tạo tài khoản thành công!", token: token });
    },
  ];
}

module.exports = { UserController };
