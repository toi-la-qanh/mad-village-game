<script setup>
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
</script>

<template>
  <LanguageSwitcher />
  <div class="w-full h-screen fixed">
    <div
      class="absolute text-with-border border border-gray-500 text-center w-full text-yellow-300 font-mono text-4xl"
    >
      Làng Điên
    </div>
    <img
      class="lg:object-fill object-cover w-full h-full"
      src="../assets/background.png"
      alt=""
    />
  </div>
</template>

<style scoped>
/* Text border effect using text-shadow (cross-browser) */
.text-with-border {
  text-shadow: 1px 1px 0px black,
    /* Shadow to the right and down */ -1px -1px 0px black,
    /* Shadow to the left and up */ 1px -1px 0px black,
    /* Shadow to the right and up */ -1px 1px 0px black; /* Shadow to the left and down */
}
</style>
