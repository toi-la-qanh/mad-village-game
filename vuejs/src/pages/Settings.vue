<template>
  <div class="min-h-screen w-screen bg-inherit flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Cài đặt</h1>
        <p class="text-gray-600 text-sm">
          Quản lý tài khoản và cài đặt của bạn
        </p>
      </div>

      <!-- Warning Message -->
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              Tài khoản của bạn sẽ bị xoá sau 24 tiếng, trước khi xoá sẽ có một thông báo hiển thị cho bạn biết
            </p>
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="space-y-4">
        <button
          @click="deleteAccount"
          class="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
        >
          <svg class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          Xoá tài khoản
        </button>

        <button 
          @click="goBack"
          class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
        >
          <svg class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
          </svg>
          Quay trở lại trang chủ
        </button>
      </div>
    </div>
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
