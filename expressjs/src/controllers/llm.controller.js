const redis = require("../database/redis");
require("dotenv").config();
// const tf = require("@tensorflow/tfjs-node");
// const { checkSchema, validationResult } = require("express-validator");
// const use = require("@tensorflow-models/universal-sentence-encoder");

// let model = null;

// async function loadUSEModel() {
//   console.log("Loading USE-QA model...");
//   if (!model) {
//     model = await use.load();
//     console.log("Model loaded and cached.");
//   }
//   return model;
// }

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

  /**
   * Method to let the AI to answer the question based on the conversation
   */
  // static answerQuestion = [
  //   checkSchema({
  //     conversation: {
  //       notEmpty: {
  //         errorMessage: "llm.errors.conversationEmpty",
  //       },
  //     },
  //     question: {
  //       notEmpty: {
  //         errorMessage: "Câu hỏi không được để trống !",
  //       },
  //       isString: {
  //         errorMessage: "Câu hỏi phải là một chuỗi !",
  //       },
  //     },
  //   }),
  //   async (req, res) => {
  //     const errors = validationResult(req);
  //     if (!errors.isEmpty()) {
  //       return res.status(422).json({ errors: errors.array() });
  //     }

  //     const { conversation, question } = req.body;

  //     // Flatten all content into one array of strings
  //     const inputTexts = [];
  //     const nameMapping = []; // To keep track of names

  //     for (const round of conversation) {
  //       if (round.chat && Array.isArray(round.chat)) {
  //         round.chat.forEach(({ name, message }) => {
  //           inputTexts.push(`${name}: ${message}`);
  //           nameMapping.push(name); // Store name in same order as inputTexts
  //         });
  //       }
  //     }

  //     if (inputTexts.length === 0) {
  //       return res.json({
  //         message: "Không đủ dữ liệu để phân tích. Hãy tham gia thảo luận nhiều hơn.",
  //       });
  //     }

  //     const allInputs = [question, ...inputTexts];

  //     const model = await loadUSEModel();
  //     // Embed the input
  //     const embeddings = await model.embed(allInputs);

  //     // Extract query and response embeddings
  //     const queryEmbedding = embeddings.slice([0, 0], [1]);
  //     const responseEmbedding = embeddings.slice([1]);

  //     // Calculate cosine similarities
  //     const similarities = tf
  //       .matMul(responseEmbedding, queryEmbedding, false, true)
  //       .arraySync();

  //     // Make sure we have the same number of similarities as nameMapping entries
  //     if (similarities.length !== nameMapping.length) {
  //       console.error("Mismatch between similarities and nameMapping lengths");
  //       return res.status(500).json({ message: "Lỗi xử lý dữ liệu" });
  //     }

  //     const results = similarities.map((scoreArr, i) => ({
  //       name: nameMapping[i],
  //       message: inputTexts[i],
  //       score: scoreArr[0],
  //     }));

  //     // Sort and return top 3 relevant results
  //     const topResults = results.sort((a, b) => b.score - a.score).slice(0, 3);

  //     // Extract just the names for the response
  //     const suspectNames = topResults.map((result) => result.name);

  //     // Make sure we have names
  //     if (suspectNames.length === 0) {
  //       return res.json({
  //         message: "Không thể xác định ai đáng nghi. Hãy tham gia thảo luận nhiều hơn.",
  //       });
  //     }

  //     return res.json({
  //       message: `Đây là ${suspectNames.length} người đáng nghi nhất: ${suspectNames.join(", ")}`,
  //     });
  //   },
  // ];
}

module.exports = { LLMController };
