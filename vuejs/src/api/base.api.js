import axios from "axios";
import { authError, errorMessages, showSignUpForm } from "../store";
import i18n from "../translation";

/**
 * Default base api implementation
 */
export default class BaseApi {
  constructor() {
    this._axios = axios.create({
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      withCredentials: true
    });
  }

  handleError(error) {
    const t = i18n.global.t;
    if (error.message === "Network Error") {
      errorMessages.value = t("errors.network");
      return;
    }
    
    if (error.response?.status === 401) {
      authError.value = error.response.data.errors;
      errorMessages.value = null;
      showSignUpForm.value = true;
      return;
    }

    throw error;
  }

  async request(method, url, data = null, params = null) {
    try {
      const response = await this._axios({ method, url, data, params });
      return JSON.parse(JSON.stringify(response.data));
    } catch (error) {
      this.handleError(error);
    }
  }

  get(url, params) {
    return this.request('get', url, null, params);
  }

  post(url, data) {
    return this.request('post', url, data);
  }

  put(url, data) {
    return this.request('put', url, data);
  }

  patch(url, data) {
    return this.request('patch', url, data);
  }

  delete(url) {
    return this.request('delete', url);
  }
}