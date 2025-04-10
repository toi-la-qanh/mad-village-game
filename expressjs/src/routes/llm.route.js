const express = require("express");
const { gameSummary, botChat } = require("../controllers/llm.controller.js");
const updateLLMResponse = require("../cron/llm.cron.js");
const auth = require("../middleware/auth.middleware.js");
const { rateLimit } = require("express-rate-limit");

const router = express.Router();

// Set the rate limit
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    errors: "Quá nhiều lần thử, xin vui lòng thử lại trong ít phút nữa !",
  },
});

router.get("/instruction", gameSummary);
router.get("/update", updateLLMResponse);
router.post("/chat", auth, limiter, botChat);

module.exports = router;
