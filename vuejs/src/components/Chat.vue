<template>
  <div
    class="fixed top-0 w-full h-full z-20 bg-inherit flex justify-center items-center"
  >
    <div
      class="lg:w-2/3 lg:rounded-lg w-full h-full bg-gray-900/50 text-white relative max-h-screen"
    >
      <!-- Close Chat Section -->
      <button @click="close" class="md:absolute fixed right-2 top-1 z-10">
        <FontAwesomeIcon
          class="text-2xl text-white hover:text-gray-400"
          :icon="faXmark"
        />
      </button>

      <div v-if="conversation.length === 0">
        <p class="text-center">Chưa có tin nhắn chờ</p>
      </div>

      <!-- Fetch the chat messages -->
      <div
        class="max-h-screen w-full flex flex-col pl-4 gap-1 overflow-y-auto md:pb-12 pb-15"
        style="scrollbar-width: none"
      >
        <div v-for="(convo, index) in conversation" :key="index" class="mb-4">
          <div class="sticky top-0 rounded-lg text-center mb-2">
            <h3 class="text-white font-bold">Ngày {{ convo.day }}</h3>
          </div>
          <!-- Game Messages -->
          <div
            v-if="convo.gameMessages && convo.gameMessages.length > 0"
            v-for="(message, msgIndex) in convo.gameMessages"
            :key="'msg' + msgIndex"
            class="text-yellow-300 mb-2"
          >
            {{ message }}
          </div>

          <!-- Vote Section -->
          <div v-if="convo.day !== 0">
            <div class="mb-2">
              <h3 class="font-bold">Bot</h3>
              <p>Thông tin bỏ phiếu ngày {{ convo.day }}</p>
            </div>

            <!-- Vote Details -->
            <div
              class="sticky top-0 bg-white rounded-lg max-w-1/3 min-w-96 flex flex-col p-2 text-black"
            >
              <!-- Header Row -->
              <div class="flex justify-between items-center border-b pb-2 mb-2">
                <div class="w-1/3 font-bold">Tên</div>
                <div class="w-1/3 font-bold text-center">Số phiếu</div>
                <div class="w-1/3 font-bold text-right">Bỏ phiếu</div>
              </div>

              <!-- Player Rows -->
              <div
                v-for="(player, playerIndex) in players.filter((p) => p.alive)"
                :key="playerIndex"
                class="flex justify-between items-center py-1"
              >
                <!-- Player Name -->
                <div class="w-1/3">{{ player.name }}</div>

                <!-- Votes Count -->
                <div class="w-1/3 text-center">
                  {{
                    (
                      (convo.votes &&
                        convo.votes.find(
                          (vote) => vote.target === player._id
                        )) || {
                        count: 0,
                      }
                    ).count
                  }}
                </div>

                <!-- Vote Input -->
                <div class="w-1/3 text-right">
                  <input
                    type="radio"
                    :value="player._id"
                    v-model="selectedPlayerId"
                    @click="toggleVote(playerIndex)"
                    :disabled="!voteEvent || player.name === username"
                    class="mr-2"
                  />
                </div>
              </div>

              <!-- Vote Result -->
              <div
                v-if="convo.voteResult"
                class="mt-2 pt-2 border-t text-center font-bold"
              >
                Kết quả: {{ convo.voteResult }}
              </div>
            </div>
          </div>

          <!-- Fetch the chat messages -->
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
        </div>
      </div>

      <div v-if="error" class="text-red-500">{{ error }}</div>
      <!-- Send Message Section -->
      <div
        class="md:absolute fixed bottom-0 w-full md:h-auto h-13 bg-white p-2 flex justify-between gap-2"
        :class="{ 'bg-gray-600': !dayChat }"
      >
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
            class="text-xl text-black hover:text-gray-400"
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
    players: { type: Array, required: true },
    voteEvent: { type: Boolean, required: true },
    gameID: { type: String, required: true },
    conversation: { type: Array, required: true },
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
      username: user.value.name,
      newMessage: "",
      error: null,
      selectedPlayerId: null,
      isMessageSending: false, // Cooldown flag for messages
      isVoteSending: false, // Cooldown flag for votes
    };
  },

  components: {
    FontAwesomeIcon,
  },

  methods: {
    sendMessage(event) {
      if (event) event.preventDefault();

      // Check if message sending is on cooldown
      if (this.isMessageSending) {
        this.error = "Vui lòng đợi trước khi gửi tin nhắn tiếp theo!";
        return;
      }

      if (!this.dayChat) {
        this.error = "Không thể gửi tin nhắn trong giai đoạn này!";
        return;
      }

      const me = this.players.find((p) => p.name === this.username);
      if (!me || !me.alive) {
        this.error = "Bạn đã chết, không thể gửi tin nhắn!";
        return;
      }

      if (!this.newMessage.trim()) {
        this.error = "Tin nhắn không được để trống!";
        return;
      }

      // Clear previous errors
      this.error = null;

      // Set cooldown flag
      this.isMessageSending = true;

      // Send message
      this.$socket.emit("game:discussion", this.newMessage, (data) => {
        if (data && data.status) {
          if (data.status === 400) return;
          this.error = data.message;
        } else {
          // Clear input after successful send
          this.newMessage = "";
          // Don't add message locally - it will be added via socket event in Game.vue
        }
      });

      // Reset cooldown after 1 seconds
      setTimeout(() => {
        this.isMessageSending = false;
      }, 1000);
    },

    toggleVote(index) {
      // Check if vote sending is on cooldown
      if (this.isVoteSending) {
        this.error = "Vui lòng đợi trước khi bỏ phiếu tiếp theo!";
        return;
      }

      // Validate game ID
      if (!this.gameID) {
        this.error = "Không tìm thấy mã game!";
        return;
      }

      // Validate vote
      if (!this.voteEvent) {
        this.error = "Chưa đến giai đoạn bỏ phiếu!";
        return;
      }

      const playerId = this.players[index]._id;
      this.selectedPlayerId = playerId;

      // Set cooldown flag
      this.isVoteSending = true;

      this.$socket.emit("game:voteTarget", playerId, (data) => {
        if (data && data.status) {
          if (data.status === 400) return;
          this.error = data.message;
        } else {
          this.error = null;
        }
      });

      // Reset cooldown after 3 seconds
      setTimeout(() => {
        this.isVoteSending = false;
      }, 3000);
    },

    close() {
      this.$emit("close");
    },
  },
};
</script>
