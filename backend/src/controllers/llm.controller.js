const redis = require("../database/redis");

class LLMController {
  /**
   * Method to summarize the game
   */
  static gameSummary = async (req, res) => {
    const lang = req.language || 'en';
    const key = `llm:game-summary-${lang}`;

    const reply = await redis.get(key);
    if (!reply) {
      return res.status(404).json({ message: req.t("llm.errors.noData") });
    }

    // Parse the reply from Redis and return the result
    const result = JSON.parse(reply);

    // Return the result to the client
    return res.status(200).json(result);
  };
}

module.exports = { LLMController };
