const { google } = require("googleapis");
require("dotenv").config();

class GoogleSheetService {
  constructor(sheetId = process.env.GOOGLE_SPREADSHEET_ID) {
    this.sheetId = sheetId;
    this.auth = null;
    this.sheets = null;
  }

  async init() {
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    this.auth = auth;
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  async getSheetData(range = "Sheet1!A2:E2") {
    if (!this.sheets) {
      await this.init();
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: range,
    });

    return response.data.values || [];
  }

  async getUserData() {
    const data = await this.getSheetData("Sheet1!A2:E2");
    return data;
  }

  async getRoomData() {
    const data = await this.getSheetData("Sheet1!G2:I2");
    return data;
  }

  async getGameData() {
    const data = await this.getSheetData("Sheet1!K2:M2");
    return data;
  }
}

module.exports = GoogleSheetService;
