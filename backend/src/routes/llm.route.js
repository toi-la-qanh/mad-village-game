const express = require("express");
const { LLMController } = require("../controllers/llm.controller.js");
const updateLLMResponse = require("../cron/llm.cron.js");
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

router.get("/instruction", LLMController.gameSummary);
router.get("/update", limiter, updateLLMResponse);
// router.post("/answer", auth, limiter, LLMController.answerQuestion);

module.exports = router;
 