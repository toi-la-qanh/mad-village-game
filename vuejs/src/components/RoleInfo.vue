<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
</script>
<template>
  <div
    class="fixed top-0 left-0 w-full h-full bg-gray-900/30 flex justify-center items-center z-20"
  >
    <div
      class="w-full max-w-64 h-auto relative rounded-lg"
      :class="role.trait === 'bad' ? 'bg-red-500' : 'bg-green-500'"
    >
      <div class="px-6 py-5 flex gap-2 flex-col relative">
        <div class="flex flex-wrap justify-between items-center">
          <h3 class="text-2xl">{{ role.name }}</h3>
        </div>
        <img
          class="w-full h-56 border border-black"
          :src="'data:image/png;base64,' + role.image"
          alt="Role Image"
        />
        <p>{{ description }}</p>
      </div>
      <FontAwesomeIcon
        class="top-2 absolute right-2 text-xl hover:text-gray-500 focus:text-gray-500"
        :icon="faXmark"
        @click="closePopup"
      />
    </div>
  </div>
</template>
<script>
import GameApi from "../api/game.api";
export default {
  props: {
    role: {
      type: Object,
      required: true,
    },
  },
  data() {
    return { description: "" };
  },
  async mounted() {
    const game = new GameApi();
    try {
      const response = await game.getSpecifiedRole({
        name: this.role.name,
        trait: this.role.trait,
      });
      this.description = response.description;
    } catch (error) {
      console.log(error);
    }
  },
  methods: {
    closePopup() {
      this.$emit("close");
    },
  },
};
</script>
