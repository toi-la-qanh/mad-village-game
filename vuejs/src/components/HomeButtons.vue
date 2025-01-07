<template>
  <div
    class="absolute w-full text-center justify-center items-center h-full flex flex-col gap-5 text-yellow-300 text-xl bg-inherit font-bold"
  >
    <button
      @click="toggleSignUpForm"
      class="sm:w-40 w-32 sm:h-16 h-14 outline-none border border-black bg-lime-600 hover:bg-lime-500"
    >
      Chơi
    </button>
    <button
      class="sm:w-40 w-32 sm:h-16 h-14 outline-none border border-black bg-lime-600 hover:bg-lime-500"
    >
      Hướng dẫn
    </button>
  </div>
</template>

<script>
import { showSignUpForm, authError } from "../store";

export default {
  methods: {
    toggleSignUpForm() {
      if (authError.value !== null) {
        showSignUpForm.value = true;
      } else {
        this.$router.push({ name: "rooms" });
      }
    },
  },
};
</script>
