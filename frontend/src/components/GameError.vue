<template>
  <div
    class="w-full h-full fixed top-0 left-0 z-30 flex items-center justify-center"
  >
    <div class="bg-white rounded-lg max-w-96 w-auto relative p-3">
      <button class="absolute right-1 top-1" @click="close">
        <FontAwesomeIcon class="hover:text-gray-500 text-lg" :icon="faXmark" />
      </button>
      <div class="text-red-600 font-bold">
        {{ $t("game.error.title") }}
        <p class="">{{ error.errors }}</p>
      </div>
    </div>
  </div>
</template>
<script>
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
export default {
  props: {
    error: {
      type: Object,
      required: true,
    },
  },
  emits: ["close"],
  setup() {
    return {
      faXmark,
    };
  },
  components: {
    FontAwesomeIcon,
  },
  methods: {
    close() {
      this.$emit("close");
    },
  },
};
</script>
