const OpenAI = require("openai");
const redis = require("../database/redis");

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.LLM_API_Key,
});

/**
 * Call LLM API for updating
 */
const updateLLMResponse = async (req, res) => {
  console.log("run llm api");
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: req.t("llm.messages.gameSummaryPrompt"),
          },
        ],
      },
    ], 
    model: process.env.LLM_API_Model,
    temperature: 0.2
  });

  const result = response.choices[0].message.content;
  if (!result) {
    return res.status(400).json({ message: req.t("llm.errors.noData") });
  }

  const lang = req.language || 'en';
  const key = `llm:game-summary-${lang}`;
  await redis.set(key, JSON.stringify(result));

  return res
    .status(200)
    .json({ message: req.t("llm.messages.successfulUpdate") });
};

module.exports = updateLLMResponse;
