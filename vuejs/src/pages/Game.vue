<template>
  <div v-if="game" class="overflow-hidden h-screen w-screen">
    <!-- Game Errors -->
    <div v-if="error">
      <GameError :error="error" @close="error = null" />
    </div>

    <!-- Game Buttons -->
    <div v-if="showGameButtons">
      <GameButtons
        @showRole="showRoleInfo"
        @showInstruction="showInstructionInfo = true"
        @openChat="
          openChatSection = true;
          showGameButtons = false;
        "
        @openSettings="openSettingsSection = true"
      />
    </div>

    <!-- Settings -->
    <div v-if="openSettingsSection">
      <GameSettings
        @close="openSettingsSection = false"
        @changeSettings="updateSettings"
      />
    </div>

    <!-- Time out  -->
    <div
      class="absolute text-yellow-400 z-10 w-full text-center text-2xl flex flex-wrap justify-center gap-2"
    >
      <div v-if="timeOutMessage">{{ timeOutMessage }}</div>
      <div v-if="timeOut">{{ timeOut }}</div>
    </div>

    <!-- Map -->
    <Map
      :game="game"
      :playerCount="game.players.length"
      :event="event"
      :characterSpeed="characterSpeed"
      :animation="animation"
    />

    <!-- Role information -->
    <div v-if="role">
      <RoleInfo :role="role" @close="role = null" />
    </div>

    <!-- Instruction -->
    <div v-if="showInstructionInfo">
      <GameInstruction @close="showInstructionInfo = false" />
    </div>

    <!-- Chat Section -->
    <div v-if="openChatSection">
      <Chat
        :day="game.day"
        :dayChat="game.period === 'day'"
        :nightChat="event.nightChat"
        :gameMessage="gameMessage"
        :players="game.players"
        :voteEvent="event.vote"
        @close="
          openChatSection = false;
          showGameButtons = true;
        "
      />
    </div>

    <!-- Game Over Notifications -->
    <div v-if="event.end">
      <GameEnd :playerDetails="playerDetails" />
    </div>
  </div>

  <!-- Condition if there is no game data -->
  <div v-else>
    <div class="text-center w-screen absolute mt-12">
      <p class="text-red-700">Lỗi không tìm thấy dữ liệu game</p>
      <button
        @click="reload()"
        class="bg-green-400 hover:bg-green-300 border boder-black rounded-full p-2 mt-2"
      >
        Tải lại trang
      </button>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { showBackground } from "../store";

export default {
  components: {
    Map: defineAsyncComponent(() => import("../layouts/Map.vue")),
    RoleInfo: defineAsyncComponent(() => import("../components/RoleInfo.vue")),
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
    GameInstruction: defineAsyncComponent(() =>
      import("../components/GameInstruction.vue")
    ),
    GameEnd: defineAsyncComponent(() => import("../components/GameEnd.vue")),
  },

  data() {
    return {
      game: null, // Store game data
      loading: false, // Store loading state
      error: null, // Store error state
      role: null,
      showInstructionInfo: false,
      openChatSection: false,
      showGameButtons: true,
      timeOut: null,
      timeOutMessage: null,
      openSettingsSection: false,
      event: {
        showRoles: false,
        performAction: false,
        day: false,
        discussion: false,
        nightChat: false,
        vote: false,
        end: false,
      },
      gameMessage: "",
      characterSpeed: parseFloat(sessionStorage.getItem("speed")) || 1,
      animation: JSON.parse(sessionStorage.getItem("animation")) || true,
      playerDetails: null,
    };
  },

  async mounted() {
    this.setupGameEvents();
  },

  methods: {
    reload() {
      window.location.reload();
    },

    fetchGameData() {
      this.$socket.emit("game:data", localStorage.getItem("gameID"), (data) => {
        if (!data) {
          showBackground.value = true;
        }
        showBackground.value = false;
        this.$socket.emit("room:join", data.room);
        this.game = data;
      });
    },

    setupGameEvents() {
      // Get the timeout and messages
      this.$socket.on("game:timeout", (data) => {
        if (data) {
          this.timeOut = data.timeout;
          this.timeOutMessage = data.message;
          this.startCountdown();
        } else {
          this.timeOut = null;
          this.timeOutMessage = null;
        }
      });

      this.$socket.on("game:error", (data) => {
        this.error = data;
      });

      this.$socket.onAny((eventName, ...args) => {
        console.log(eventName);
      });

      this.fetchGameData();
      this.getGameEvents(); 

      this.$socket.on("game:update", () => {
        this.fetchGameData();
        this.getGameEvents();  
      });
    },

    getGameEvents() {
      // Retrieve the current event of the game
      this.$socket.emit(
        "game:event",
        localStorage.getItem("gameID"),
        (data) => {
          console.log("yes");
          this.gameMessage = data.message;
          switch (data.phase) {
            case "showRoles":
              this.showRolesEvent(data);
              break;
            case "performAction":
              this.performActionEvent(data);
              break;
            case "day":
              this.dayEvent(data);
              break;
            case "discussion":
              this.discussionEvent(data);
              break;
            case "vote":
              this.voteEvent(data);
              break;
            case "end":
              this.endEvent(data);
              break;
            default:
              break;
          }
        }
      );
    },

    // Count down the timeouts
    startCountdown() {
      const countdownInterval = setInterval(() => {
        if (this.timeOut > 0) {
          this.timeOut--;
        } else {
          clearInterval(countdownInterval);
          this.timeOutMessage = null;
          this.timeOut = null;
          this.role = null;
        }
      }, 1000);
    },

    // Helper function to open role info when clicked on the info button
    showRoleInfo() {
      this.role = JSON.parse(localStorage.getItem("role")); // change to sessionStorage for production
    },

    showRolesEvent(data) {
      localStorage.setItem("role", JSON.stringify(data));
      this.role = data;
    },

    performActionEvent(data) {
      this.event.performAction = true;
      // Handle error cases consistently
      this.error = data.status === "error" ? data.message : null;
    },

    dayEvent(data) {
      // Implement logic for day phase in the game
      console.log("Day phase:", data);
    },

    discussionEvent(data) {
      this.event.discussion = true;
      console.log("Discussion phase:", data);
    },

    voteEvent(data) {
      this.event.vote = true;
      console.log("Voting phase:", data);
    },

    endEvent(data) {
      this.event.end = true;
      this.playerDetails = data;
    },

    // Method to handle settings change
    updateSettings({ newSpeed, newAnimation }) {
      this.characterSpeed = newSpeed;
      this.animation = newAnimation;
      this.openSettingsSection = false; // Close settings panel
    },
  },

  beforeUnmount() {
    // Cleanup the socket listener when the component is destroyed
    this.$socket.off("game:error");
    this.$socket.off("game:timeout");
  },
};
</script>
