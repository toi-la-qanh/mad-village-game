import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/game`;

export default class GameApi extends BaseApi {

  getRoles(params) {
    return this.get(`${url}/roles`, params);
  }

  getSpecifiedRole(params) {
    return this.get(`${url}/roles/info`, params);
  }

  start(data) {
    return this.post(`${url}/start`, data);
  }
};
