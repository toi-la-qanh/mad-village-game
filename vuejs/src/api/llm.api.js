import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/llm`;

export default class LlmApi extends BaseApi {

  getInstruction(params) {
    return this.get(`${url}/instruction`, params);
  }

  getChatBot(data) {
    return this.post(`${url}/chat`, data);
  }
};
