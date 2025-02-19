<template>
  <div
    class="w-full h-full fixed top-0 left-0 z-30 flex items-center justify-center"
  >
    <div
      class="p-4 w-full h-auto max-w-96 bg-black bg-opacity-50 relative text-white"
    >
      <button class="absolute right-1 top-1" @click="close">
        <FontAwesomeIcon class="hover:text-gray-300 text-lg" :icon="faXmark" />
      </button>
      <div class="flex flex-row justify-between">
        <h3 class="w-auto">Tốc độ di chuyển của nhân vật:</h3>
        <input type="number" class="text-white outline-none bg-inherit w-10" />
      </div>
      <button class="w-full hover:bg-gray-400">Thay đổi</button>
    </div>
  </div>
</template>
<script>
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
export default {
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
