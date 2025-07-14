<script setup>
import { errorMessages } from "../store";
</script>

<template>
  <div class="w-full h-screen bg-gray-800/70 z-[100] fixed flex justify-center items-center">
    <div class="w-full max-w-md bg-gray-100 rounded-lg h-auto p-6 flex flex-col justify-center items-center border border-gray-300 shadow-lg">
      <p class="text-red-600 text-center mb-6 text-xl font-semibold">{{ errorMessages }}</p>
      <button
        @click="reloadPage"
        class="text-gray-600 bg-green-300 w-full max-w-[220px] hover:bg-green-500 rounded-md py-2 font-semibold transition-colors duration-200"
      >
        {{$t("errorPopup.reload")}}
      </button>
    </div>
  </div>
</template>

<script>
const reloadPage = () => {
  window.location.reload();
};
</script>
