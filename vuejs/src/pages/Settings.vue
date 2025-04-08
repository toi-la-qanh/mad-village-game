<template>
  <div class="w-full h-full absolute flex justify-center">
    <p class="absolute bottom-0">
      Tài khoản của bạn sẽ bị xoá sau 24 tiếng, trước khi xoá sẽ có một thông
      báo hiển thị cho bạn biết
    </p>
    <button
      class="bg-white p-2 rounded-lg absolute top-15"
      @click="deleteAccount"
    >
      Xoá cookie
    </button>
    <button class="top-30 bg-white p-1 rounded-lg absolute" @click="goBack">
      Quay trở lại trang chủ
    </button>
  </div>
</template>
<script>
import UserApi from "../api/user.api";
export default {
  name: "Settings",
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    async deleteAccount() {
      // Show a confirmation dialog
      const userConfirmed = window.confirm(
        "Bạn sẽ mất dữ liệu nếu xoá tài khoản?"
      );

      // If the user clicks "OK", delete the cookie
      if (userConfirmed) {
        try {
          const user = new UserApi();
          const response = await user.deleteAccount();
          if (response) {
            this.$router.push({ name: "home" });
          }
        } catch (error) {
          console.log(error);
        }
      }
    },
  },
};
</script>
