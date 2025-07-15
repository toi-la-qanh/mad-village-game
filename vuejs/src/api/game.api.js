import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/game`;
const language = sessionStorage.getItem('language') || 'en';

export default class GameApi extends BaseApi {
  /**
   * Method to get all roles in the game
   */
  getRoles(params) {
    return this.get(`${url}/roles?lang=${language}`, params);
  }

  /**
   * Method to get a specified role in the game
   */
  getSpecifiedRole(params) {
    return this.get(`${url}/roles/info?lang=${language}`, params);
  }

  /**
   * Method to start a new game
   */
  start(data) {
    return this.post(`${url}/start?lang=${language}`, data);
  }

  /**
   * Method to let user exit a game
   */
  exit() {
    return this.delete(`${url}/exit?lang=${language}`);
  }
};
