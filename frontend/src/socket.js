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
  autoConnect: true,
  reconnection: true, // Enable reconnection
  reconnectionAttempts: Infinity, // Keep trying to reconnect
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  state.connected = true;
});

socket.on("reconnect_attempt", (attempt) => {
  console.log(`Reconnection attempt #${attempt}`);
});

socket.on("disconnect", () => {
  state.connected = false;
});