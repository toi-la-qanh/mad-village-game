<template>
  <div
    class="fixed top-0 w-full h-full z-20 bg-inherit flex justify-center items-center"
  >
    <div
      class="md:w-2/3 md:rounded-lg w-full h-full bg-gray-900/50 text-white relative overflow-y-auto"
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
      <div v-if="chat" class="max-h-400 pb-10">
        <div
          v-for="(data, index) in chat"
          :key="index"
          class="flex flex-col py-2 pl-2 pr-7 relative"
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

      <!-- Send Message Section -->
      <div
        class="md:absolute bottom-0 fixed w-full h-auto bg-white p-2 flex justify-between gap-2"
      >
        <input
          type="text"
          v-model="newMessage"
          placeholder="Type your message here"
          class="w-full outline-none text-black"
          @keydown.enter="sendMessage($event)"
        />
        <button @click="sendMessage">
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
    day: { type: Number, required: true },
    dayChat: { type: Boolean, required: true },
    nightChat: { type: Boolean, required: true },
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
    };
  },
  components: {
    FontAwesomeIcon,
  },
  async mounted() {
    this.fetchMessages();
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
      socket.emit(
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
      socket.on("game:fetchDayChat", (data) => {
        console.log(data);
        this.chat.push({
          name: data.playerName,
          message: data.message,
        });
      });
    },
  },
};
</script>
