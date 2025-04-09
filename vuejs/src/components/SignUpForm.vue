<script setup>
import { authError, showSignUpForm } from "../store";
</script>

<template>
  <div
    v-if="showSignUpForm"
    class="fixed h-screen flex z-20 w-full justify-center items-center bg-gray-900/20"
  >
    <div
      class="font-mono w-full max-w-md sm:p-8 px-4 py-8 space-y-6 bg-white border border-lime-700 shadow-md rounded-xl"
    >
      <h2 class="text-2xl text-lime-700 font-semibold text-center">
        Tên của bạn là
      </h2>

      <!-- Signup Form -->
      <form @submit.prevent="handleSignup" class="space-y-4">
        <!-- Username Field -->
        <div>
          <input
            v-model="name"
            id="username"
            type="text"
            required
            class="focus:outline-none w-full px-4 py-2 mt-1 text-gray-700 border-2 border-lime-700 rounded-md outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="text-white w-full px-4 py-2 bg-lime-700 rounded-md hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-400"
          >
            Vào chơi thôi
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="error">
          <p v-if="Array.isArray(error)" class="flex flex-col">
            <span
              v-for="(err, index) in error"
              :key="index"
              class="text-red-500 text-center"
            >
              {{ err }}
            </span>
          </p>
          <p v-else class="text-red-500 text-center">{{ error }}</p>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="mt-4 text-center text-green-500">
          <p>{{ successMessage }}</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import UserApi from "../api/user.api"; // Import the UserApi class

export default {
  data() {
    return {
      name: "",
      isSubmitting: false,
      successMessage: "",
      error: authError.value,
    };
  },
  methods: {
    async handleSignup() {
      this.isSubmitting = true;
      this.successMessage = "";
      this.error = null;

      try {
        const user = new UserApi();
        const response = await user.signup({
          name: this.name,
        });
        if (response != null) {
          if (!this.$socket.connected) {
            this.$socket.connect();
          }
          this.isSubmitting = false;
          showSignUpForm.value = false;
        }
      } catch (error) {
        if (error.response?.status === 422) {
          this.error = error.response?.data?.errors?.map((err) => err.msg);
        } else {
          this.error = error.response?.data?.errors;
        }
      }
    },
  },
};
</script>

<style scoped>
/* Custom styles can go here */
</style>
