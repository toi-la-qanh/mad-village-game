import UserApi from "../api/user.api";
import { socket } from "../socket";
import {
  authError,
  errorMessages,
  isLoading,
  showSignUpForm,
  user,
} from "../store";

const userApi = new UserApi();

export default async function authMiddleware(to, from, next) {
  isLoading.value = true;
  try {
    const response = await userApi.getUser();

    if (response) {
      // Reset auth state
      authError.value = null;
      showSignUpForm.value = false;

      // Set user data
      user.value = {
        name: response.name,
        id: response.id,
      };

      // Connect socket if needed
      if (!socket.connected) {
        socket.connect();
      }
    }
    isLoading.value = false;
    next();
  } catch (error) {
    // This catch block will only run for errors not handled by BaseApi
    console.log(error);
    isLoading.value = false;
    errorMessages.value = error.message;
    authError.value = error.response?.data?.errors;
    showSignUpForm.value = true;

    if (socket.connected) {
      socket.disconnect();
    }

    next("/home");
  }
}
