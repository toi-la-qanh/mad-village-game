const express = require("express");
const { UserController } = require("../controllers/user.controller.js");
const auth = require("../middleware/auth.middleware.js");
const { rateLimit } = require("express-rate-limit");

const router = express.Router();

// Set the rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { errors: 'Quá nhiều lần thử, xin vui lòng thử lại trong ít phút nữa !' },
});

router.get("/", auth, UserController.getLoggedInUser);
router.post("/signup", limiter, UserController.signup);

module.exports = router;
