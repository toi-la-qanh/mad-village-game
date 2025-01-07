import axios from "axios";

export default class BaseApi {
  constructor() {
    this._axios = axios;
  }

  async get(url, params = {}) {
    try {
      const { data } = await this._axios.get(url, {
        params,
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }

  async put(url, data) {
    try {
      const { response } = await this._axios.put(
        url,
        {
          data,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async patch(url, data) {
    try {
      const { response } = await this._axios.patch(
        url,
        {
          data,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async post(url, data) {
    try {
      const { data: responseData } = await this._axios.post(url, data, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return responseData;
    } catch (error) {
      throw error;
    }
  }

  async delete(url, data) {
    try {
      const { response } = await this._axios.delete(
        url,
        {
          data,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}
