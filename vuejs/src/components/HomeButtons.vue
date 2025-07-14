<template>
  <div
    class="absolute w-full text-center justify-center items-center h-full flex flex-col gap-5 text-yellow-200 text-xl bg-inherit font-bold"
  >
    <button
      @click="toggleSignUpForm"
      class="w-44 p-5 outline-none border-2 border-yellow-600 bg-green-600 hover:bg-lime-500"
    >
      {{ $t("buttons.play") }}
    </button>
    <button
      class="w-44 p-5 outline-none border-2 border-yellow-600 bg-green-600 hover:bg-lime-500"
      @click="switchToInstructionPage"
    >
      {{ $t("buttons.instruction") }}
    </button>
    <button
      class="w-44 p-5 outline-none border-2 border-yellow-600 bg-green-600 hover:bg-lime-500"
      @click="goToSettingsPage"
    >
      {{ $t("buttons.settings") }}
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    toggleSignUpForm() {
      this.$router.push({ name: "rooms" });
    },
    switchToInstructionPage() {
      this.$router.push({ name: "instruction" });
    },
    goToSettingsPage() {
      this.$router.push({ name: "settings" });
    },
  },
};
</script>
