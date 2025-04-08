import { reactive } from "vue";
import { io } from "socket.io-client";

// SocketHandler class
export const state = reactive({
  connected: false,
  fooEvents: [],
  barEvents: [],
});

const URL = import.meta.env.VITE_BACKEND_URL;

// Initialize socket connection
export const socket = io(URL, {
  withCredentials: true,
  extraHeaders: {
    "Content-Type": "application/json",
  },
  transports: ["websocket"],
});

socket.on("connect", () => {
  state.connected = true;
});

socket.on("disconnect", () => {
  state.connected = false;
});