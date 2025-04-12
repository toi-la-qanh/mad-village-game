<template>
  <div
    class="fixed top-0 w-full h-full z-20 bg-inherit flex justify-center items-center"
  >
    <div
      class="lg:w-2/3 lg:rounded-lg w-full h-full bg-gray-900/50 text-white relative"
    >
      <!-- Close Chat Section -->
      <button @click="close" class="md:absolute fixed right-2 top-1 z-10">
        <FontAwesomeIcon
          class="text-2xl text-white hover:text-gray-400"
          :icon="faXmark"
        />
      </button>

      <!-- Fetch the chat messages -->
      <div
        class="max-h-400 pb-10 flex flex-col py-2 pl-2 pr-7 gap-1 overflow-y-auto"
        style="scrollbar-width: none"
      >
        <div
          v-for="(convo, index) in conversation"
          :key="index"
          class="mb-4"
        >
          <div class="sticky top-0 rounded-lg p-2 mb-2">
            <h3 class="text-white">Ngày {{ convo.day }}</h3>
          </div>

          <div
            v-if="convo.chat && convo.chat.length > 0"
            v-for="(data, chatIndex) in convo.chat"
            :key="chatIndex"
            class="relative"
          >
            <div
              class="rounded-lg p-2"
              :class="{
                'text-right': data.name === username,
                'text-left': data.name !== username,
              }"
            >
              <h3 class="font-bold">{{ data.name }}</h3>
              <p>{{ data.message }}</p>
            </div>
          </div>

          <!-- Log the messages in the game -->
          <div v-if="convo.gameMessage">
            <p class="text-yellow-300">{{ convo.gameMessage }}</p>
          </div>

          <!-- Vote Section -->
          <div class="mb-2">
            <h3 class="font-bold">Bot</h3>
            <p>Thông tin bỏ phiếu ngày {{ convo.day }}</p>
          </div>

          <!-- Vote Details -->
          <div class="sticky top-0 bg-white rounded-lg max-w-1/3 min-w-96 flex flex-col p-2 text-black">
            <!-- Header Row -->
            <div class="flex justify-between items-center border-b pb-2 mb-2">
              <div class="w-1/3 font-bold">Tên</div>
              <div class="w-1/3 font-bold text-center">Số phiếu</div>
              <div class="w-1/3 font-bold text-right">Bỏ phiếu</div>
            </div>

            <!-- Player Rows -->
            <div v-for="(player, playerIndex) in players" :key="playerIndex" class="flex justify-between items-center py-1">
              <!-- Player Name -->
              <div class="w-1/3">{{ player.name }}</div>
              
              <!-- Votes Count -->
              <div class="w-1/3 text-center">
                {{
                  (convo.votes && convo.votes.find((vote) => vote.target === player._id) || {
                    count: 0,
                  }).count
                }}
              </div>
              
              <!-- Vote Input -->
              <div class="w-1/3 text-right">
                <input
                  type="radio"
                  :value="player._id"
                  v-model="selectedPlayerId"
                  @click="toggleVote(playerIndex)"
                  :disabled="!voteEvent"
                  class="mr-2"
                />
              </div>
            </div>

            <!-- Vote Result -->
            <div v-if="convo.voteResult" class="mt-2 pt-2 border-t text-center font-bold">
              Kết quả: {{ convo.voteResult }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="conversation.length === 0">
        <p class="text-center">Chưa có tin nhắn chờ</p>
      </div>

      <!-- Send Message Section -->
      <div
        class="md:absolute fixed bottom-0 w-full md:h-auto h-13 bg-white p-2 flex justify-between gap-2"
        :class="{ 'bg-gray-600': !dayChat }"
      >
        <div v-if="error">{{ error }}</div>
        <input
          type="text"
          v-model="newMessage"
          placeholder="Nói gì đó với dân làng đi .."
          class="w-full outline-none text-black"
          :class="{ 'cursor-not-allowed': !dayChat }"
          :disabled="!dayChat"
          @keydown.enter="sendMessage($event)"
        />
        <button
          @disable="!dayChat"
          @click="sendMessage"
          :class="{ 'cursor-not-allowed': !dayChat }"
        >
          <FontAwesomeIcon
            class="text-black hover:text-gray-700"
            :icon="faTurnUp"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { faTurnUp, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { user } from "../store";

export default {
  props: {
    day: { type: Number, required: true },
    dayChat: { type: Boolean, required: true },
    nightChat: { type: Boolean, required: true },
    gameMessage: { type: String, required: true },
    players: { type: Object, required: true },
    voteEvent: { type: Boolean, required: true },
    gameID: { type: String, required: true },
  },

  emits: ["close"],

  setup() {
    return {
      faTurnUp,
      faXmark,
    };
  },

  data() {
    return {
      conversation: [],
      username: user.value.name,
      newMessage: "",
      error: null,
      selectedPlayerId: null,
    };
  },

  components: {
    FontAwesomeIcon,
  },

  mounted() {
    // Initialize conversation with empty array if not in session storage
    const storedState = sessionStorage.getItem("conversation");
    if (storedState) {
      this.conversation = JSON.parse(storedState);
    } else {
      // Initialize with a conversation entry for the current day
      this.conversation = [{
        day: this.day,
        chat: [],
        gameMessage: "",
        voteResult: "",
        votes: []
      }];
      sessionStorage.setItem("conversation", JSON.stringify(this.conversation));
    }
  },

  methods: {
    sendMessage(event) {
      if (!this.dayChat) {
        if (event) event.preventDefault();
        return;
      }

      if (!this.newMessage.trim()) return;

      // Validate game ID
      if (!this.gameID) {
        this.error = "Không tìm thấy mã game!";
        return;
      }

      this.$socket.emit(
        "game:discussion",
        this.gameID,
        this.newMessage,
        (data) => {
          if (data && data.status === "error") {
            this.error = data.message;
          } else {
            // Find or create day's conversation
            let dayConversation = this.conversation.find(
              (convo) => convo.day === this.day
            );
            
            if (!dayConversation) {
              dayConversation = {
                day: this.day,
                chat: [],
                gameMessage: "",
                voteResult: "",
                votes: [],
              };
              this.conversation.push(dayConversation);
            }

            // Ensure chat array exists
            if (!dayConversation.chat) {
              dayConversation.chat = [];
            }

            // Add message immediately to the UI without waiting for socket response
            dayConversation.chat.push({
              name: this.username,
              message: this.newMessage,
            });

            // Update storage and reset input field
            this.newMessage = "";
            this.error = null;
            sessionStorage.setItem(
              "conversation",
              JSON.stringify(this.conversation)
            );
          }
        }
      );
    },

    toggleVote(index) {
      // Validate game ID
      if (!this.gameID) {
        this.error = "Không tìm thấy mã game!";
        return;
      }

      const playerId = this.players[index]._id;
      this.selectedPlayerId = playerId;
      this.$socket.emit("game:voteTarget", playerId);
    },

    close() {
      this.$emit("close");
    },
  },
};
</script>
