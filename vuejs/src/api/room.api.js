import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/rooms`;

export default class RoomApi extends BaseApi {

  getAllRooms() {
    return this.get(`${url}`);
  }

  getRoom(id) {
    return this.get(`${url}/${id}`);
  }

  joinRoom(id) {
    return this.get(`${url}/${id}/join`);
  }

  createRoom(data) {
    return this.post(`${url}/`, data);
  }

  leaveRoom(id) {
    return this.delete(`${url}/${id}`);
  }
};
