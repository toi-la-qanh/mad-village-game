const express = require("express");
const { UserController } = require("../controllers/user.controller.js");
const auth = require("../middleware/auth.middleware.js");
const { rateLimit } = require("express-rate-limit");
const checkForExpiringUsers = require("../cron/user.cron.js");

const router = express.Router();

// Set the rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { errors: 'req.t("rateLimit.errors.tooManyRequests")' },
});

router.get("/", auth, UserController.getLoggedInUser);
router.get("/check", checkForExpiringUsers);
router.post("/signup", limiter, UserController.signup);
router.delete("/", auth, UserController.deleteAccount);

module.exports = router;
