import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/user`;

export default class UserApi extends BaseApi {
  getUser() {
    return this.get(`${url}`);
  }

  signup(data) {
    return this.post(`${url}/signup`, data);
  }

  deleteAccount() {
    return this.delete(`${url}`);
  }
};
