import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/rooms`;

export default class RoomApi extends BaseApi {

  getAllRooms(params) {
    return this.get(`${url}/`, params);
  }

  getRoom(id, params) {
    return this.get(`${url}/${id}`, params);
  }

  joinRoom(id, data) {
    return this.post(`${url}/${id}/join`, data);
  }

  createRoom(data) {
    return this.post(`${url}/`, data);
  }

  leaveRoom(id, data) {
    return this.post(`${url}/${id}/leave`, data);
  }
};
