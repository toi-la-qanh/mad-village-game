const [checkSchema, validationResult] = require('express-validator');
const User = require('../models/user.model');
const createSecretToken = require('../auth/token');

const signup = [
    checkSchema({
      name: {
        notEmpty: {
          errorMessage: "Tên không được để trống",
        },
        isString: {
          errorMessage: "Tên phải bao gồm chữ cái",
        },
        isLength: {
          options: { min: 2, max: 30 },
          errorMessage: "Tên phải có từ 2-30 ký tự",
        },
        matches: {
          options: /^[\p{L}\sà-ỹÀ-Ỵ]+$/u,
          errorMessage: "Tên không phù hợp",
        },
      },
    }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array(), value: req.query });
      }
  
      const { name } = req.query;
  
      try {
        const newUser = new User({
          name,
        });
        await newUser.save();
        const token = createSecretToken(newUser._id);
  
        res.cookie("token", token, {
          path: "/", // Cookie is accessible from all paths
          expires: new Date(Date.now() + 86400000), // Cookie expires in 1 day
          secure: true, // Cookie will only be sent over HTTPS
          httpOnly: true, // Cookie cannot be accessed via client-side scripts
          sameSite: "None",
        });
  
        console.log("cookie set succesfully");
        return res.status(201).json({ message: "Tạo tài khoản thành công!" });
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Đã xảy ra lỗi", error: error.message });
      }
    },
  ];

module.exports = signup;