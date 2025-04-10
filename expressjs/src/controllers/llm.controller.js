const OpenAI = require("openai");
const redis = require("../database/redis");
const dotenv = require("dotenv");
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.LLM_API_Key,
});

const gameSummary = async (req, res) => {
  const key = "llm:game-summary";

  const reply = await redis.get(key);
  if (!reply) {
    return res.status(404).json({ message: "Có lỗi xảy ra !" });
  }

  // Parse the reply from Redis and return the result
  const result = JSON.parse(reply);

  // Return the result to the client
  return res.status(200).json(result);
};

const botChat = async (req, res) => {
  const { content } = req.body;
  const response = await openai.chat.completions.create({
    messages: [{ role: "user", content: content }],
    model: "openrouter/quasar-alpha",
    max_completion_tokens: 300,
  });

  const result = response.choices[0].message.content;
  if (!result) {
    return res.status(400).json({ message: "Có lỗi xảy ra !" });
  }

  return res.status(200).json(result);
};

module.exports = { gameSummary, botChat };
