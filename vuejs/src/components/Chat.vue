<template>
  <div
    class="fixed top-0 w-full h-full z-20 bg-inherit flex justify-center items-center"
  >
    <div
      class="lg:w-2/3 lg:rounded-lg w-full h-full bg-gray-900/50 text-white relative overflow-y-auto"
      style="scrollbar-width: none"
    >
      <!-- Close Chat Section -->
      <button @click="close" class="md:absolute fixed right-2 top-1 z-10">
        <FontAwesomeIcon
          class="text-2xl text-white hover:text-gray-400"
          :icon="faXmark"
        />
      </button>

      <h1 class="text-center text-2xl">Ngày {{ day }}</h1>

      <!-- Fetch the chat messages -->
      <div
        v-if="chat"
        class="max-h-400 pb-10 flex flex-col py-2 pl-2 pr-7 gap-1"
      >
        <div v-for="(data, index) in chat" :key="index" class="relative">
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
        <div v-if="gameMessage">
          <p class="text-yellow-300">{{ gameMessage }}</p>
        </div>

        <!-- Vote Section -->
        <div v-if="voteEvent">
          <div class="">
            <h3 class="font-bold">Bot</h3>
            <p>Thông tin bỏ phiếu ngày {{ day }}</p>
          </div>

          <!-- Vote Details -->
          <div
            class="top-0 sticky bg-white rounded-lg max-w-1/3 min-w-96 flex flex-col p-1 text-black"
          >
            <div class="flex flex-row justify-between">
              <p>Tên</p>
              <p>Số phiếu</p>
              <p></p>
            </div>

            <div class="flex flex-row justify-between">
              <div v-for="(player, index) in players" :key="index">
                <!-- Player's name -->
                <p>{{ player.name }}</p>

                <!-- Votes count -->
                <div>
                  {{
                    (
                      votes.find((vote) => vote.target === player._id) || {
                        count: 0,
                      }
                    ).count
                  }}
                </div>

                <!-- Vote Select -->
                <input
                  type="radio"
                  v-model="isVoted"
                  @click="toggleVote(index)"
                  :checked="isVoted"
                />
              </div>
            </div>

            <p>Kết quả: {{ voteResult }}</p>
          </div>
        </div>
      </div>

      <!-- Send Message Section -->
      <div
        class="md:absolute bottom-0 fixed w-full h-auto bg-white p-2 flex justify-between gap-2"
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
import { socket } from "../socket";

export default {
  props: {
    voteEvent: { type: Boolean, required: true },
    day: { type: Number, required: true },
    dayChat: { type: Boolean, required: true },
    nightChat: { type: Boolean, required: true },
    gameMessage: { type: String, required: true },
    players: { type: Object, required: true },
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
      chat: [
        {
          name: null,
          message: null,
        },
      ],
      username: user.value.name,
      newMessage: "",
      error: null,
      isVoted: false,
      votes: JSON.parse(sessionStorage.getItem("votes")) || [],
      voteResult: sessionStorage.getItem("voteResult") || "",
    };
  },

  components: {
    FontAwesomeIcon,
  },

  async mounted() {
    this.fetchMessages();
    if (this.voteEvent) {
      this.fetchVotes();
      this.getVoteResult();
    }
  },

  methods: {
    close() {
      this.$emit("close");
    },

    sendMessage(event) {
      // If dayChat is false, don't send the message
      if (!this.dayChat) {
        if (event) {
          event.preventDefault(); // Prevent Enter key action if the event is passed
        }
        return; // Prevent message sending
      }

      if (!this.newMessage.trim()) return; // Don't send if the input is empty

      // Emit the message to the server
      this.$socket.emit(
        "game:discussion",
        localStorage.getItem("gameID"),
        this.newMessage,
        (data) => {
          if (data.status === "error") {
            this.error = data.message;
          } else {
            this.chat.push({
              name: this.username,
              message: this.newMessage,
            });
            this.newMessage = "";
            this.error = null;
          }
        }
      );
    },

    fetchMessages() {
      // Fetch the chat messages from the server
      this.$socket.on("game:fetchDayChat", (data) => {
        console.log(data);
        this.chat.push({
          name: data.playerName,
          message: data.message,
        });
      });
    },

    toggleVote(index) {
      this.isVoted = !this.isVoted;
      this.$socket.emit("game:voteTarget", this.players[index]._id);
    },

    fetchVotes() {
      // Fetch the votes from the server
      this.$socket.on("game:fetchVotes", (data) => {
        sessionStorage.setItem("votes", JSON.stringify(data));
        this.votes = data;
      });
    },

    getVoteResult() {
      this.$socket.on("game:voteResult", (data) => {
        if (data.status === "success") {
          sessionStorage.setItem("voteResult", data.message);
          this.voteResult = data.message;
        } else {
          console.log(data.message);
        }
      });
    },
  },

  beforeUnmount() {
    socket.off("game:fetchDayChat");
    socket.off("game:fetchVotes");
    socket.off("game:voteResult");
  },
};
</script>
