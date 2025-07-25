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
      class="absolute text-black z-10 w-full text-center text-2xl flex flex-wrap justify-center gap-2"
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
      :yourTurn="yourTurn"
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
        :gameID="gameID"
        :day="game.day"
        :dayChat="game.period === 'day'"
        :nightChat="event.nightChat"
        :players="game.players"
        :voteEvent="event.vote"
        :conversation="conversation"
        @close="
          openChatSection = false;
          showGameButtons = true;
        "
      />
    </div>

    <!-- Day Report Popup -->
    <div v-if="showDayReport">
      <GameDayReport
        :day="game.day"
        :dayMessage="dayReportMessage"
        :details="lastNightReport"
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
      <p class="text-red-700">{{ i18n.global.t("errors.notFound.game") }}</p>
      <button
        @click="reload()"
        class="text-gray-800 bg-green-400 hover:bg-green-300 border boder-black rounded-full p-2 mt-2"
      >
        {{ i18n.global.t("buttons.reload") }}
      </button>
      <button
        @click="exitGame()"
        class="text-gray-800 bg-green-400 hover:bg-green-300 border boder-black rounded-full p-2 mt-2"
      >
        {{ i18n.global.t("buttons.exit") }}
      </button>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent, reactive, ref } from "vue";
import { showBackground, gameID, roomID } from "../store";
import GameApi from "../api/game.api";
import i18n from "../translation";

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
    GameDayReport: defineAsyncComponent(() =>
      import("../components/GameDayReport.vue")
    ),
  },

  data() {
    return {
      game: ref(null), // Store game data
      gameID: ref(null), // Store game ID
      loading: false, // Store loading state
      error: null, // Store error state
      role: null,
      showInstructionInfo: false,
      openChatSection: false,
      showGameButtons: true,
      timeOut: null,
      timeOutMessage: null,
      openSettingsSection: false,
      event: reactive({
        showRoles: false,
        performAction: false,
        day: false,
        discussion: false,
        nightChat: false,
        vote: false,
        end: false,
      }),
      characterSpeed: parseFloat(sessionStorage.getItem("speed")) || 1,
      animation: JSON.parse(sessionStorage.getItem("animation")) || true,
      playerDetails: reactive({}),
      yourTurn: ref(false),
      conversation: reactive([
        {
          day: 0,
          chat: [],
          gameMessages: [],
          voteResult: "",
          votes: [],
        },
      ]),
      showDayReport: false,
      dayReportMessage: "",
      lastNightReport: [],
    };
  },

  mounted() {
    // Get gameID from route params
    const routeGameId = this.$route.params.id;

    if (routeGameId) {
      this.gameID = routeGameId;
    }

    // Initialize conversation from session storage if available
    const storedConversation = sessionStorage.getItem("conversation");
    if (storedConversation) {
      this.conversation = JSON.parse(storedConversation);
    }

    this.fetchGameData();
    this.getGameEvents();
    this.setupGameEvents();
  },

  computed: {
    currentEvent() {
      return { ...this.event };
    },
  },

  methods: {
    reload() {
      window.location.reload();
    },

    fetchGameData() {
      this.$socket.emit("game:data", this.gameID, (data) => {
        if (!data) {
          showBackground.value = true;
        }
        showBackground.value = false;
        this.game = data;
      });
    },

    setupGameEvents() {
      // Remove any existing listeners first to prevent duplicates
      this.removeSocketListeners();

      // Get the timeout and messages
      this.$socket.on("game:timeOut", (data) => {
        if (data) {
          this.timeOut = data.timeout;
          this.timeOutMessage = data.message;
        } else {
          this.timeOut = null;
          this.timeOutMessage = null;
        }
      });

      this.$socket.on("game:error", (data) => {
        this.error = data;
      });

      this.$socket.on("game:end", (data) => {
        if (!data) return;
        this.endEvent(data);
      });

      // Listen for new chat messages
      this.$socket.on("game:fetchDayChat", (data) => {
        // Get current day
        const currentDay = this.game?.day;
        if (!currentDay) return;

        // Find or create day's conversation
        let dayConversation = this.conversation.find(
          (c) => c.day === currentDay
        );
        if (!dayConversation) {
          dayConversation = {
            day: currentDay,
            chat: [],
            gameMessages: [],
            voteResult: "",
            votes: [],
          };
          this.conversation.push(dayConversation);
        }

        // Add new message to day's chat
        dayConversation.chat.push({
          name: data.playerName,
          message: data.message,
        });

        // Update session storage
        sessionStorage.setItem(
          "conversation",
          JSON.stringify(this.conversation)
        );

        // Notify Vue that the data has changed to trigger watchers
        this.conversation = [...this.conversation];
      });

      // Votes listener
      this.$socket.on("game:fetchVotes", (data) => {
        if (!this.game) return;

        const currentDay = this.game.day;
        let dayConversation = this.conversation.find(
          (c) => c.day === currentDay
        );
        if (!dayConversation) {
          dayConversation = {
            day: currentDay,
            chat: [],
            gameMessages: [],
            voteResult: "",
            votes: [],
          };
          this.conversation.push(dayConversation);
        }
        dayConversation.votes = data;
        sessionStorage.setItem(
          "conversation",
          JSON.stringify(this.conversation)
        );
      });

      // Vote result listener
      this.$socket.on("game:voteResult", (data) => {
        if (!this.game) return;
        if (data.status === "success" || data.status === "tie") {
          const currentDay = this.game.day;
          let dayConversation = this.conversation.find(
            (c) => c.day === currentDay
          );
          if (!dayConversation) {
            dayConversation = {
              day: currentDay,
              chat: [],
              gameMessages: [],
              voteResult: "",
              votes: [],
            };
            this.conversation.push(dayConversation);
          }
          dayConversation.voteResult = data.message;
          sessionStorage.setItem(
            "conversation",
            JSON.stringify(this.conversation)
          );
        }
      });

      this.$socket.on("game:dayReport", (data) => {
        this.dayEvent(data);
      });

      this.$socket.on("game:update", (data) => {
        // Only fetch game data if the phase has changed
        if (data.phase !== this.game?.phases) {
          this.resetEventFlags();
          this.fetchGameData();
          this.getGameEvents();
        }

        // Update local state
        if (this.game) {
          this.game.phases = data.phase;
          this.game.period = data.period;
          this.game.day = data.day;
        }
      });
    },

    getGameEvents() {
      // Retrieve the current event of the game
      this.$socket.emit("game:event", this.gameID, (data) => {
        if (data.status === 400) return;

        if (data.message) {
          if (!this.game) return;

          const currentDay = this.game.day;
          let dayConversation = this.conversation.find(
            (c) => c.day === currentDay
          );
          if (!dayConversation) {
            dayConversation = {
              day: currentDay,
              chat: [],
              gameMessages: [],
              voteResult: "",
              votes: [],
            };
            this.conversation.push(dayConversation);
          }

          if (!dayConversation.gameMessages) {
            dayConversation.gameMessages = [];
          }

          dayConversation.gameMessages.push(data.message);
          sessionStorage.setItem(
            "conversation",
            JSON.stringify(this.conversation)
          );
        }

        switch (data.phase) {
          case "showRoles":
            this.showRolesEvent(data);
            break;
          case "performAction":
            this.performActionEvent(data);
            break;
          case "day":
            break;
          case "discussion":
            this.discussionEvent(data);
            break;
          case "vote":
            this.voteEvent(data);
            break;
          default:
            break;
        }
      });
    },

    // Helper function to open role info when clicked on the info button
    showRoleInfo() {
      this.role = JSON.parse(localStorage.getItem("role"));
    },

    showRolesEvent(data) {
      localStorage.setItem("role", JSON.stringify(data));
      this.role = data;
    },

    performActionEvent(data) {
      this.event.performAction = true;

      this.$socket.removeAllListeners("game:yourTurn");
      this.$socket.on("game:yourTurn", (isYourTurn) => {
        this.yourTurn = isYourTurn;
      });
    },

    dayEvent(data) {
      // Reset previous day events
      this.event.day = true;

      // Process the day event data
      if (data && data.message) {
        this.dayReportMessage = data.message;
      } else {
        this.dayReportMessage = "Một ngày mới đã bắt đầu trong làng.";
      }

      if (data && data.details) {
        this.lastNightReport = data.details;
      }

      this.showDayReport = true;
      setTimeout(() => {
        this.showDayReport = false;
      }, 3000);

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

    resetEventFlags() {
      Object.keys(this.event).forEach((key) => {
        this.event[key] = false;
      });
    },

    async exitGame() {
      const confirmed = window.confirm("Bạn có chắc chắn muốn rời khỏi trò chơi?");

      if (!confirmed) return;

      try {
        const game = new GameApi();
        await game.exit();
        gameID.value = null;
        if(roomID.value){
          this.$router.push({ name: "room", params: { id: roomID.value } });
        } else {
          this.$router.push("/rooms");
        }
      } catch (error) {
        console.log(error);
      }
    },

    removeSocketListeners() {
      // Cleanup the socket listener when the component is destroyed
      this.$socket.removeAllListeners("game:timeOut");
      this.$socket.removeAllListeners("game:error");
      this.$socket.removeAllListeners("game:end");
      this.$socket.removeAllListeners("game:fetchDayChat");
      this.$socket.removeAllListeners("game:fetchVotes");
      this.$socket.removeAllListeners("game:voteResult");
      this.$socket.removeAllListeners("game:yourTurn");
      this.$socket.removeAllListeners("game:update");
      this.$socket.removeAllListeners("game:dayReport");
    },
  },

  beforeUnmount() {
    this.removeSocketListeners();
    sessionStorage.removeItem("speed");
    sessionStorage.removeItem("animation");
  },
};
</script>
