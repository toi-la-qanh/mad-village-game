<template>
  <div
    class="fixed top-0 left-0 w-full h-full bg-gray-900/30 flex justify-center items-center z-20"
  >
    <div class="bg-white rounded-lg shadow-2xl w-full max-w-96 p-6 text-white border border-gray-700 transform transition-all">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h2 class="text-2xl font-bold text-black">{{ $t("game.dayReport.title") }}</h2>
      </div>

      <!-- Day Event Message -->
      <div class="mb-3">
        <p class="text-lg mb-2 text-black">{{ dayMessage }}</p>
        
        <div v-if="details && details.length > 0" class="mt-4">
          <h3 class="text-xl text-red-400 font-semibold mb-2">{{ $t("game.dayReport.deadPlayers") }}:</h3>
          <ul class="text-red-300">
            <li 
              v-for="(player, index) in details" 
              :key="index"
              class="mb-2 flex items-center"
            >
              <span class="text-red-500 mr-2">✝</span>
              <span>{{ player.name }}</span>
              <span class="ml-2 text-sm text-gray-400">({{ player.role }})</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    day: {
      type: Number,
      required: true,
    },
    dayMessage: {
      type: String,
      default: "Một ngày mới đã bắt đầu trong làng."
    },
    details: {
      type: Array,
      default: () => []
    }
  },
};
</script>
