<script setup>
import { showSignUpForm } from "../store";
</script>

<template>
  <div
    v-if="showSignUpForm"
    class="fixed h-screen flex z-20 w-full justify-center items-center bg-inherit opacity-100"
  >
    <div
      class="text-yellow-300 font-mono w-full max-w-md p-8 space-y-6 bg-lime-700 shadow-md rounded-lg"
    >
      <h2 class="text-2xl font-semibold text-center">Tên của bạn là</h2>

      <!-- Signup Form -->
      <form @submit.prevent="handleSignup" class="space-y-4">
        <!-- Username Field -->
        <div>
          <input
            v-model="name"
            id="username"
            type="text"
            required
            class="w-full px-4 py-2 mt-1 text-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full px-4 py-2 bg-lime-900 rounded-md hover:bg-lime-800 focus:outline-none focus:ring-2 focus:ring-lime-800 disabled:bg-gray-400"
          >
            Vào chơi thôi
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mt-4 text-center text-red-500">
          {{ error }}
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
      error: null,
    };
  },
  methods: {
    async handleSignup() {
      this.isSubmitting = true;
      this.successMessage = "";
      this.error = null;

      const user = new UserApi();

      this.isSubmitting = false;
      try {
        await user.signup({
          name: this.name,
        });
        showSignUpForm.value = false;
      } catch (error) {
        if (error.status === 422) {
          this.error = error.response.data.errors.msg;
        } else {
          this.error = error.response.data?.errors;
        }
      }
    },
  },
};
</script>

<style scoped>
/* Custom styles can go here */
</style>
