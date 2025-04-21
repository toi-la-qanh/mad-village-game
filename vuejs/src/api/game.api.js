import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/game`;

export default class GameApi extends BaseApi {
  getRoles(params) {
    return this.get(`${url}/roles`, params);
  }

  getSpecifiedRole(params) {
    return this.get(`${url}/roles/info`, params);
  }

  /**
   * Method to start a new game
   */
  start(data) {
    return this.post(`${url}/start`, data);
  }

  exit() {
    return this.delete(`${url}/exit`);
  }
};
