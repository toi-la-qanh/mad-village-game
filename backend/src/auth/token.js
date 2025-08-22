const jwt = require("jsonwebtoken");

function createSecretToken(id) {
  const expiresIn = process.env.TOKEN_EXPIRY || "3d";
  
  return jwt.sign({ id }, process.env.TOKEN_KEY, {
    expiresIn,
  });
}

module.exports = createSecretToken;