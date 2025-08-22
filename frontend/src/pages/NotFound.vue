<template>
  <div class="w-full h-screen flex justify-center text-center">
    <div class="z-10 absolute md:w-1/2 w-full top-11 text-xl gap-2 flex flex-col justify-center items-center text-yellow-300">
      <h1>{{ $t("notFound.title") }}</h1>
      <p>{{ $t("notFound.description") }}</p>
      <button @click="goBack" class="w-full p-1 max-w-96 outline-none bg-inherit border border-black rounded-md hover:text-white hover:bg-green-500">{{ $t("notFound.goBack") }}</button>
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
