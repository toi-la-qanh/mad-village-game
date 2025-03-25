<script setup>
import { errorMessages } from "../store";
</script>

<template>
  <div class="w-full h-screen bg-gray-900/35 z-[100] fixed flex justify-center items-center">
    <div class="w-full max-w-md bg-white rounded-lg h-40 flex flex-col justify-center items-center border border-black">
      <p class="text-red-500 text-center mb-4 text-xl font-bold">{{ errorMessages }}</p>
      <button @click="reloadPage" class="text-white bg-lime-900 w-full max-w-56 hover:bg-lime-800 rounded-md">Tải lại</button>
    </div>
  </div>
</template>

<script>
const reloadPage = () => {
  window.location.reload();
};
</script>
