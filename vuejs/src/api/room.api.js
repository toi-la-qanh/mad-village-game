import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/rooms`;

export default class RoomApi extends BaseApi {

  getAllRooms() {
    return this.get(`${url}`);
  }

  getRoom(id) {
    return this.get(`${url}/${id}`);
  }

  joinRoom(id, data) {
    return this.post(`${url}/${id}/join`, data);
  }

  createRoom(data) {
    return this.post(`${url}/`, data);
  }

  updateRoom(id, data) {
    return this.patch(`${url}/${id}`, data);
  }

  leaveRoom(id) {
    return this.delete(`${url}/${id}/leave`);
  }

  kickPlayer(id, data) {
    return this.patch(`${url}/${id}/kick`, data);
  }
};
