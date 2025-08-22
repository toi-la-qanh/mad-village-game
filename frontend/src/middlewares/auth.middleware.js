import UserApi from "../api/user.api";
import {
  authError,
  errorMessages,
  isLoading,
  roomID,
  gameID,
  showSignUpForm,
  user,
} from "../store";
import { socket } from "../socket";

// Create singleton instance outside function to avoid recreating on each route change
const userApi = new UserApi();

export default async function authMiddleware(to, from, next) {
  isLoading.value = true;

  try {
    const response = await userApi.getUser();

    if (response) {
      resetAuthState();

      // Set user data
      user.value = {
        name: response.name,
        id: response.id,
      };

      roomID.value = response.room;

      if (roomID.value) {
        socket.emit("room:join", response.room);
      }
      
      gameID.value = response.game;

      if (response.message) {
        alert(response.message);
      }

      ensureSocketConnection();
      isLoading.value = false;
      return next();
    }
  } catch (error) {
    handleAuthError(error);
    return next("/home");
  }

  // Safety fallback - should not reach here but just in case
  isLoading.value = false;
  next();
}

// Helper functions for cleaner main function
function resetAuthState() {
  authError.value = null;
  showSignUpForm.value = false;
  isLoading.value = false;
  errorMessages.value = null;
}

function ensureSocketConnection() {
  if (!socket.connected) {
    socket.connect();
  }
}

function handleAuthError(error) {
  console.error("Authentication error:", error);
  isLoading.value = false;
  errorMessages.value = error.message || "Authentication failed";
  authError.value = error.response?.data?.errors;
  showSignUpForm.value = true;

  if (socket.connected) {
    socket.disconnect();
  }
}
