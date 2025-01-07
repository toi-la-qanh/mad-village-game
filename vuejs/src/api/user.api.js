import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/user`;

export default class UserApi extends BaseApi {
  getUser(params) {
    return this.get(`${url}/`, params);
  }

  signup(data) {
    return this.post(`${url}/signup`, data);
  }
};
