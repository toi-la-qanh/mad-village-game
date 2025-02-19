import axios from "axios";
import { authError, errorMessages, showSignUpForm } from "../store";

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
    if (error.message === "Network Error") {
      errorMessages.value = "Lỗi kết nối với máy chủ !";
      return;
    }
    
    if (error.response?.status === 401) {
      authError.value = error.response.data.errors;
      errorMessages.value = null;
      showSignUpForm.value = true;
      throw error;
    }

    throw error;
  }

  async request(method, url, data = null, params = null) {
    try {
      const response = await this._axios({ method, url, data, params });
      return response;
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