<script setup>
import { ref, onMounted } from "vue";
import { socket } from "../socket"; // Import socket connection
import Map from "../components/Map.vue"; // Import the Map component

// Reactive variables for the data
const gameData = ref(null);
const playerCount = ref(10); // Default player count

// Listen for the 'game:started' event to get the game data
onMounted(() => {
  socket.on("game:started", (data) => {
    console.log("Game started with data:", data);
    gameData.value = data.game; // Store the game data from the socket
    playerCount.value = data.game?.players?.length;
  });

  socket.on("game:messages", data);
  socket.on("game:phases", data);

  // Cleanup the socket listener when the component is destroyed
  return () => {
    socket.off("game:started");
  };
});
</script>

<template>
  <div>
    <!-- Pass gameData and playerCount as props to Map.vue -->
    <Map :gameData="gameData" :playerCount="playerCount" />
  </div>
</template>
