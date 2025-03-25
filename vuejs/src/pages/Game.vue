<template>
  <div v-if="game" class="overflow-hidden h-screen">
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
        @openVoteSection="openVoteSection = true"
      />
    </div>

    <!-- Settings -->
    <div v-if="openSettingsSection">
      <GameSettings @close="openSettingsSection = false" />
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
      :playerBeingWatched="playerBeingWatched"
    />

    <!-- Role information -->
    <div v-if="role">
      <RoleInfo :role="role" @close="role = null" />
    </div>

    <!-- Chat Section -->
    <div v-if="openChatSection">
      <Chat
        :day="game.day"
        :dayChat="event.discussion"
        :nightChat="event.nightChat"
        @close="
          openChatSection = false;
          showGameButtons = true;
        "
      />
    </div>

    <!-- Vote Section -->
    <div v-if="openVoteSection">
      <Vote :players="game.players" @close="openVoteSection = false" />
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
import { defineAsyncComponent, toRaw } from "vue";

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
    Vote: defineAsyncComponent(() => import("../components/Vote.vue")),
  },
  data() {
    return {
      game: null, // Store game data
      loading: false, // Store loading state
      error: null, // Store error state
      role: null,
      openChatSection: false,
      openVoteSection: false,
      showGameButtons: true,
      timeOut: null,
      timeOutMessage: null,
      openSettingsSection: false,
      event: {
        showRoles: false,
        performAction: false,
        showRoles: false,
        performAction: false,
        day: false,
        discussion: false,
        nightChat: false,
        vote: false,
        watchPeople: false,
        end: false,
      },
      playerBeingWatched: null,
    };
  },

  async mounted() {
    this.fetchGameData();
    this.setupGameEvents();
    this.startCountdown();
  },

  methods: {
    fetchGameData() {
      socket.on("game:error", (data) => {
        this.error = data;
      });

      socket.emit("game:data", localStorage.getItem("gameID"), (data) => {
        console.log(data);
        socket.emit("room:join", data.room);
        this.game = data;
        console.log(this.game);
      });
    },

    setupGameEvents() {
      // Retrieve the current event of the game
      socket.emit("game:event", localStorage.getItem("gameID"), (data) => {
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
      });

      // Get the timeout and messages
      socket.on("game:timeout", (data) => {
        if (data) {
          this.timeOut = data.timeout;
          this.timeOutMessage = data.message;
        } else {
          this.timeOut = null;
          this.timeOutMessage = null;
        }
      });
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

      this.socket.emit("game:watch", localStorage.getItem("gameID"), (data) => {
        if (data.status !== "error") {
          this.watchPeople = true;
          this.playerBeingWatched = data;
        }
      });
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
      console.log("End phase:", data);
    },
  },

  beforeUnmount() {
    // Cleanup the socket listener when the component is destroyed
    socket.off("game:error");
    socket.off("game:timeout");
  },
};
</script>
