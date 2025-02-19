<template>
  <div
    class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 flex justify-center items-center z-20"
  >
    <div
      class="w-full max-w-64 h-auto relative rounded-lg"
      :class="trait === 'bad' ? 'bg-red-500' : 'bg-green-500'"
    >
    <button class="w-full asolute right-0" @click="closePopup">X</button>
      <div class="px-6 py-5 flex gap-2 flex-col relative">
        <div class="flex flex-wrap justify-between items-center">
          <h3 class="text-2xl">{{ name }}</h3>
        </div>
        <img
          class="w-full h-56 border border-black"
          :src="'data:image/png;base64,' + image"
          alt="Role Image"
        />
        <p>{{ description }}</p>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    name: {
      type: String,
      required: true,
    },
    trait: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  methods: {
    closePopup() {
      this.$emit("close");
    },
  },
};
</script>