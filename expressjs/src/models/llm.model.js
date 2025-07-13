require("@tensorflow/tfjs-node");
const use = require("@tensorflow-models/universal-sentence-encoder");
const googleSheetsService = require("../services/googleSheets.service");

class LLM {
  constructor() {
    this.model = null;
    this.trainingData = null;
  }

  async loadUSEModel() {
    console.log("Loading USE-QA model...");
    if (!this.model) {
      this.model = await use.load();
      console.log("Model loaded and cached.");
    }
    return this.model;
  }

  async loadTrainingData() {
    console.log("Loading training data from Google Sheets...");
    if (!this.trainingData) {
      const rawData = await googleSheetsService.getUserData();
      // Transform data into training format
      this.trainingData = rawData.map((col) => ({
        username: col[0],
        ip: col[1],
        date: col[2],
        isSpam: col[3],
      }));
      console.log("Training data loaded and cached.");
    }
    return this.trainingData;
  }

  async predictSpam(userInput) {
    const model = await this.loadUSEModel();
    const trainingData = await this.loadTrainingData();

    const { username, ip, date } = userInput;

    // Encode new input
    const inputEmbedding = await model.embed([`${username} ${ip} ${date}`]);
    const inputTensor = inputEmbedding.arraySync()[0];

    // Prepare training embeddings
    const spamTexts = trainingData
      .filter((d) => d.isSpam === "TRUE" || d.isSpam === "FALSE")
      .map((d) => `${d.username} ${d.ip} ${d.date}`);

    const spamEmbeddings = await model.embed(spamTexts);
    const spamVectors = spamEmbeddings.arraySync();

    // Compute cosine similarity to each spam vector
    const similarities = spamVectors.map((vec) =>
      cosineSimilarity(vec, inputTensor)
    );
    const avgSimilarity =
      similarities.reduce((a, b) => a + b, 0) / similarities.length;

    // Return true if similarity > threshold (e.g., 0.8)
    return avgSimilarity > 0.8;
  }

  // Utility: Cosine similarity
  cosineSimilarity(a, b) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  }
}

module.exports = { LLM };
