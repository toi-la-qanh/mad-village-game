<template>
  <div class="w-full h-screen flex justify-center text-center">
    <div class="z-10 absolute md:w-1/2 w-full top-10 text-xl gap-4 flex flex-col justify-center items-center text-yellow-300">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <button @click="goBack" class="w-full max-w-96 outline-none bg-lime-700 rounded-md hover:text-white hover:bg-lime-600">Về lại trang chủ</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotFound",
  methods: {
    goBack() {
      this.$router.push({ name: "home" });
    },
  },
};
</script>
