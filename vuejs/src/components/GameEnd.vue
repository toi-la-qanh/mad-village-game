<template>
  <div
    class="fixed top-0 w-full h-full z-20 bg-inherit flex justify-center items-center"
  >
    <div
      class="w-full max-w-96 items-center p-3 flex flex-col bg-white rounded-2xl text-black relative"
    >
      <h1 class="text-center font-medium text-2xl">{{ $t("game.end.title") }}</h1>

      <!-- Reasons -->
      <h2>{{ playerDetails.reason }}</h2>

      <!-- Player details -->
      <div
        class="w-56 flex flex-col mt-10 relative flex-1 overflow-auto max-h-82 mb-8"
        style="scrollbar-width: none"
      >
        <div
          v-for="(player, index) in playerDetails.playerDetails"
          :key="index"
          class="flex justify-between mb-2"
        >
          <!-- Player Name Column -->
          <div class="flex-1">
            <div class="font-medium">{{ player.name }}</div>
          </div>

          <!-- Player Role and Trait Column -->
          <div class="flex-1 text-right">
            <div>{{ player.role }} {{ player.trait }}</div>
          </div>
        </div>
      </div>

      <!-- Winners -->
      <h2
        class="font-medium tracking-wider text-xl animate-bounce text-white absolute top-20 text-with-border"
      >
        {{ playerDetails.winner }}
      </h2>

      <button
        class="w-3/4 mt-auto bg-emerald-600 hover:bg-emerald-500 text-white border border-black rounded-lg absolute bottom-2"
        @click="goBack"
      >
        {{ $t("game.end.goBack") }}
      </button>
    </div>
  </div>
</template>

<script>
import { faTurnUp, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { gameID, roomID, showBackground } from "../store";

export default {
  props: {
    playerDetails: {
      type: Object,
      required: true,
    },
  },

  setup() {
    return {
      faTurnUp,
      faXmark,
    };
  },

  components: {
    FontAwesomeIcon,
  },

  methods: {
    goBack() {
      localStorage.removeItem("gameID");
      gameID.value = null;
      this.$socket.removeAllListeners("game:data");
      this.$socket.removeAllListeners("game:event");
      showBackground.value = true;
      if (roomID.value) {
        // If roomID is available, navigate to the /rooms page and pass the roomID as a query parameter
        this.$router.push(`/rooms/${roomID.value}`);
      } else {
        // If no roomID is found, just navigate to /rooms
        this.$router.push("/rooms");
      }
    },
  },
};
</script>

<style scoped>
/* Text border effect using text-shadow (cross-browser) */
.text-with-border {
  text-shadow: 1px 1px 0px black,
    /* Shadow to the right and down */ -1px -1px 0px black,
    /* Shadow to the left and up */ 1px -1px 0px black,
    /* Shadow to the right and up */ -1px 1px 0px black; /* Shadow to the left and down */
}
</style>
