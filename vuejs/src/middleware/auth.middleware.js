import UserApi from "../api/user.api";
import { socket } from "../socket";
import { authError, showSignUpForm, user } from "../store";

const userApi = new UserApi();

export default async function authMiddleware(to, from, next) {
  try {
    const response = await userApi.getUser();
    authError.value = null;
    showSignUpForm.value = false;
    user.value = { name: response.name, id: response.id };
    socket.connect();
    next();
  } catch (error) {
    authError.value =
      "Bạn chưa tạo tài khoản hoặc tài khoản của bạn đã bị xóa !";
    showSignUpForm.value = true;
    socket.disconnect();
    next();
  }
}
