const express = require("express");
const { GameController } = require("../controllers/game.controller.js");
const { RoleController } = require("../controllers/role.controller.js");
const auth = require("../middleware/auth.middleware.js");
const { rateLimit } = require("express-rate-limit");

const router = express.Router();

// Set the rate limit
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 30, // Limit each IP to 50 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    errors: "req.t('rateLimit.errors.tooManyRequests')",
  },
});

router.get("/roles", RoleController.roleIndex);
router.get("/roles/info", RoleController.roleInfo);
router.post("/start", auth, limiter, GameController.gameStart);
router.delete("/exit", auth, limiter, GameController.gameOut);

module.exports = router;
