import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/llm`;
const language = sessionStorage.getItem('language') || 'en';

export default class LlmApi extends BaseApi {
  /**
   * Method to get the instruction for the game
   */
  getInstruction(params) {
    return this.get(`${url}/instruction?lang=${language}`, params);
  }

  // getAIResponse(data) {
  //   return this.post(`${url}/answer`, data);
  // }
};
