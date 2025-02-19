<template>
  <div v-if="game">
    <!-- Game Errors -->
    <div v-if="error">
      <GameError :error="error" @close="error = null" />
    </div>

    <!-- Game Buttons -->
    <div v-if="showGameButtons">
      <GameButtons
        @showRole="showRoleInfo"
        @openChat="
          openChatSection = true;
          showGameButtons = false;
        "
        @openSettings="openSettingsSection = true"
      />
    </div>

    <!-- Settings -->
    <div v-if="openSettingsSection">
      <GameSettings @close="openSettingsSection = false" />
    </div>

    <!-- Time out  -->
    <div class="absolute text-yellow-400 z-10 w-full text-center text-2xl">
      <div v-if="timeOutMessage">{{ timeOutMessage }}</div>
      <div v-if="timeOut">{{ timeOut }}</div>
    </div>

    <!-- Map -->
    <Map :game="game" :playerCount="game.players.length" />

    <!-- Role information -->
    <div v-if="role">
      <ShowRole
        :name="role.role"
        :trait="role.trait"
        :image="role.image"
        :description="role.description"
        @close="role = null"
      />
    </div>

    <!-- Chat Section -->
    <div v-if="openChatSection">
      <Chat
        @close="
          openChatSection = false;
          showGameButtons = true;
        "
      />
    </div>
  </div>
  <!-- Condition if there is no game data -->
  <div v-else>
    <p v-if="loading">Loading...</p>
    <p v-else>No game data available</p>
  </div>
</template>

<script>
import { socket } from "../socket"; // Import socket connection
// import { gameID, roomID } from "../store";
import { defineAsyncComponent } from "vue";

export default {
  components: {
    Map: defineAsyncComponent(() => import("../layouts/Map.vue")),
    ShowRole: defineAsyncComponent(() =>
      import("../components/GameEvents/ShowRole.vue")
    ),
    GameButtons: defineAsyncComponent(() =>
      import("../components/GameButtons.vue")
    ),
    Chat: defineAsyncComponent(() => import("../components/Chat.vue")),
    GameError: defineAsyncComponent(() =>
      import("../components/GameError.vue")
    ),
    GameSettings: defineAsyncComponent(() =>
      import("../components/GameSettings.vue")
    ),
  },

  data() {
    return {
      game: JSON.parse(localStorage.getItem("game")), // Store game data
      loading: false, // Store loading state
      error: null, // Store error state
      role: null,
      openChatSection: false,
      showGameButtons: true,
      timeOut: null,
      timeOutMessage: null,
      openSettingsSection: false,
    };
  },

  async mounted() {
    this.setupGameEvents();
    if (this.timeOut) {
      this.startCountdown();
    }
  },

  methods: {
    setupGameEvents() {
      socket.on("game:error", (data) => {
        this.error = data;
      });

      socket.emit("game:data", localStorage.getItem("gameID"), (data) => {
        localStorage.setItem("game", JSON.stringify(data));
        this.game = data;
      });

      socket.emit("game:showRoles", localStorage.getItem("gameID"), (data) => {
        sessionStorage.setItem("role", JSON.stringify(data));
        this.role = data;
        this.timeOutMessage = "Trò chơi sẽ bắt đầu trong";
        this.timeOut = 5;
      });

      socket.on("game:timeout", (data) => {
        this.timeOut = data;
      });
      // socket.emit(
      //   "game:performAction",
      //   localStorage.getItem("gameID"),
      //   (data) => {
      //     socket.emit("game:getTimeout", "");
      //   }
      // );
    },

    startCountdown() {
      const countdownInterval = setInterval(() => {
        if (this.timeOut > 0) {
          this.timeOut--;
        } else {
          clearInterval(countdownInterval);
          this.timeOut = null;
          this.timeOutMessage = null;
          this.role = null;
        }
      }, 1000);
    },

    // Helper function to open role info when clicked on the info button
    showRoleInfo() {
      this.role = JSON.parse(sessionStorage.getItem("role"));
    },
  },

  beforeUnmount() {
    socket.off("game:data"); // Cleanup the socket listener when the component is destroyed
  },
};
</script>
