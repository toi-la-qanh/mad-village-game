import BaseApi from './base.api';

let url = `${import.meta.env.VITE_BACKEND_URL}/api/rooms`;
const language = sessionStorage.getItem('language') || 'en';

export default class RoomApi extends BaseApi {
  /**
   * Method to get all rooms
   */
  getAllRooms() {
    return this.get(`${url}?lang=${language}`);
  }

  /**
   * Method to get a specified room
   */
  getRoom(id) {
    return this.get(`${url}/${id}?lang=${language}`);
  }

  /**
   * Method to let user join a room
   */
  joinRoom(id, data) {
    return this.post(`${url}/${id}/join?lang=${language}`, data);
  }

  /**
   * Method to create a new room
   */
  createRoom(data) {
    return this.post(`${url}?lang=${language}`, data);
  }

  /**
   * Method to update a room
   */
  updateRoom(id, data) {
    return this.patch(`${url}/${id}?lang=${language}`, data);
  }

  /**
   * Method to let user leave a room
   */
  leaveRoom(id) {
    return this.delete(`${url}/${id}/leave?lang=${language}`);
  }

  /**
   * Method to kick a player from a room
   */
  kickPlayer(id, data) {
    return this.patch(`${url}/${id}/kick?lang=${language}`, data);
  }
};
