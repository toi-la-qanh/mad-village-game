<template>
  <div class="w-full h-screen flex justify-center text-center">
    <div class="z-10 absolute md:w-1/2 w-full top-11 text-xl gap-2 flex flex-col justify-center items-center text-yellow-300">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <button @click="goBack" class="w-full p-1 max-w-96 outline-none bg-inherit border border-black rounded-md hover:text-white hover:bg-green-500">Quay lại trang trước</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotFound",
  methods: {
    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>
