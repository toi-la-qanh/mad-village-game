const jwt = require('jsonwebtoken');
const auth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ errors: req.t("auth.errors.notCreatedAccountYet") });
  }

  jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ errors: req.t("auth.errors.tokenInvalid") });
    }
    req.user = decoded.id; // Store user id in request for later use
    next();
  });
};

module.exports = auth;