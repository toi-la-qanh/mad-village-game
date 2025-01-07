<script setup>
import { defineProps, watchEffect } from 'vue';

// Define the props that will be passed from the parent (game.vue)
const props = defineProps({
  gameData: Object,
  playerCount: Number
});

const radius = ref(0);  // Dynamic radius calculation
const map = new URL("../assets/map.png", import.meta.url);
const house = new URL("../assets/house.png", import.meta.url);

// Function to load the map and draw houses
const loadMapImage = () => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas width and height to match window size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const Ox = canvas.width / 2;
  const Oy = canvas.height / 2;

  // Update the radius based on the canvas size
  radius.value = Math.min(canvas.width, canvas.height) / 3;

  const mapImg = new Image();
  mapImg.src = map.toString();

  mapImg.onload = () => {
    ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
    placeHouses(ctx, Ox, Oy, radius.value, props.playerCount, 10);
  };
};

// Function to place houses based on player count and other data
const placeHouses = (ctx, Ox, Oy, radius, playerCount, padding) => {
  const houseImg = new Image();
  houseImg.src = house.toString();

  const anglePerPlayer = 360 / playerCount;

  houseImg.onload = () => {
    for (let i = 0; i < playerCount; i++) {
      const angle = i * anglePerPlayer * (Math.PI / 180); // Convert to radians
      const x = Ox + radius * Math.cos(angle) - houseImg.width / 2;
      const y = Oy + radius * Math.sin(angle) - houseImg.height / 2;
      ctx.drawImage(houseImg, x, y);
    }
  };
};

// Watch for changes in gameData or playerCount to re-render map
watchEffect(() => {
  if (props.gameData && props.playerCount) {
    loadMapImage(); // Re-render the map when data changes
  }
});
</script>

<template>
  <div>
    <canvas ref="canvas" class="w-full h-full brightness-75"></canvas>
  </div>
</template>
