<template>
  <div
    class="absolute w-full text-center justify-center items-center h-full flex flex-col gap-5 text-yellow-300 text-xl bg-inherit font-bold"
  >
    <button
      @click="toggleSignUpForm"
      class="w-44 p-5 outline-none border-2 border-yellow-600 bg-lime-600 hover:bg-lime-500"
    >
      Chơi
    </button>
    <button
      class="w-44 p-5 outline-none border-2 border-yellow-600 bg-lime-600 hover:bg-lime-500"
    >
      Hướng dẫn
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    toggleSignUpForm() {
      this.$router.push({ name: "rooms" });
    },
  },
};
</script>
