// const cron = require("node-cron");
const OpenAI = require("openai");
const redis = require("../database/redis");
require("dotenv").config();

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
            text: "Bạn là một quản trị viên của trò chơi trực tuyến có tên là `Làng điên`, hãy giải thích cách chơi và mẹo chơi (dành cho cả 2 bên dân làng và ma sói) của trò chơi này cho người chơi. Đây là mô tả của trò chơi: Trò chơi sẽ giữ nguyên cấu trúc cơ bản của trò chơi `Ma sói` cổ điển nhưng có sự thay đổi quan trọng trong các đặc điểm của dân làng. Thay vì chỉ có một nhóm dân làng, tôi chia thành hai loại: dân làng tốt và dân làng điên. Dân làng tốt, là phe chính diện, có thể thực hiện các kỹ năng đặc biệt. Dân làng xấu, là ma sói đại diện cho phe phản diện, sẽ có khả năng thực hiện nhiều kỹ năng hơn dân làng. Dân làng điên, cũng là phe chính diện nhưng kỹ năng của họ sẽ không có tác dụng. Cấu trúc trò chơi sẽ được chia thành các giai đoạn như sau: Giai đoạn ban đêm: Trong giai đoạn này, người chơi sẽ chọn mục tiêu để thực hiện hành động của mình. Giai đoạn ban ngày: Kết quả của các hành động trong đêm sẽ được báo cáo cho tất cả người chơi. Giai đoạn thảo luận: Người chơi sẽ được phép trò chuyện và thảo luận về các sự kiện đã xảy ra trong đêm, tìm ra ai là dân làng xấu. Giai đoạn bỏ phiếu: Người chơi sẽ bỏ phiếu cho người mà họ nghĩ là người xấu, và người có số phiếu cao nhất sẽ bị treo cổ. Trò chơi kết thúc khi một trong các điều kiện sau được đáp ứng: Số dân làng ít hơn hoặc bằng số ma sói; Không còn ma sói trong trò chơi.",
          },
        ],
      },
    ],
    model: "meta-llama/llama-3.3-8b-instruct:free",
    temperature: 0.2
  });

  const result = response.choices[0].message.content;
  if (!result) {
    return res.status(400).json({ message: "Có lỗi xảy ra !" });
  }

  const key = `llm:game-summary`;
  await redis.set(key, JSON.stringify(result));

  return res
    .status(200)
    .json({ message: "Cập nhật hướng dẫn game thành công !" });
};

// Run every 1 hour
// cron.schedule("0 * * * *", updateLLMResponse);

module.exports = updateLLMResponse;
