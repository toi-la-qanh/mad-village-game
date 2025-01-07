const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const auth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ errors: "Bạn chưa đăng nhập" });
  }

  jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ errors: "Token không hợp lệ" });
    }
    req.user = decoded.id; // Store user id in request for later use
    next();
  });
};

module.exports = auth;