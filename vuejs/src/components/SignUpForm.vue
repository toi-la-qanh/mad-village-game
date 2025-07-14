<template>
  <div
    class="fixed h-screen flex z-20 w-full justify-center items-center bg-gray-900/20"
  >
    <div
      class="font-mono w-full max-w-md sm:p-8 px-4 py-8 space-y-6 bg-white border border-lime-700 shadow-md rounded-xl"
    >
      <h2 class="text-2xl text-lime-700 font-semibold text-center">
        {{ $t("signup.title") }}
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
            {{ $t("signup.submit") }}
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
      </form>
    </div>
  </div>
</template>

<script>
import UserApi from "../api/user.api"; // Import the UserApi class
import { authError } from "../store";

export default {
  data() {
    return {
      name: "",
      isSubmitting: false,
      error: null,
    };
  },
  methods: {
    async handleSignup() {
      this.isSubmitting = true;
      this.error = null;

      try {
        const user = new UserApi();
        await user.signup({
          name: this.name,
        });
        this.isSubmitting = false;
        window.location.reload();
      } catch (error) {
        this.isSubmitting = false;
        if (authError.value) this.error = authError.value;
        else {
          if (error.response?.status === 422) {
            this.error = error.response?.data?.errors?.map((err) => err.msg);
          } else {
            this.error = error.response?.data?.errors;
          }
        }
      }
    },
  },
};
</script>

<style scoped>
/* Custom styles can go here */
</style>
