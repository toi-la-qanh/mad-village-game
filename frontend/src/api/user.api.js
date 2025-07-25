import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/user`;
const language = sessionStorage.getItem('language') || 'en';

export default class UserApi extends BaseApi {
  /**
   * Method to get the user's information
   */
  getUser() {
    return this.get(`${url}?lang=${language}`);
  }

  /**
   * Method to let user sign up
   */
  signup(data) {
    return this.post(`${url}/signup?lang=${language}`, data);
  }

  /**
   * Method to let user delete their account
   */
  deleteAccount() {
    return this.delete(`${url}?lang=${language}`);
  }
};
