<template>
  <div
    class="fixed top-0 w-full h-full z-20 bg-inherit flex justify-center items-center"
  >
    <div class="sm:w-2/3 w-full h-full bg-black opacity-50 text-white rounded-lg relative">
      <button @click="close" class="absolute right-2 top-1">
        <FontAwesomeIcon
          class="text-2xl text-white hover:text-gray-400"
          :icon="faXmark"
        />
      </button>
      <div v-if="chat">
        <div v-for="index in chat" :key="index" class="flex flex-col">
          <div
            class="rounded-lg p-2"
            :class="{
              'text-right': chat.name === username,
              'text-left': chat.name !== username,
            }"
          >
            <h3 class="font-bold">{{ chat.name }}</h3>
            <p>{{ chat.message }}</p>
          </div>
        </div>
      </div>
      <div
        class="bottom-0 absolute w-full h-auto bg-white p-2 flex justify-between gap-2"
      >
        <input
          type="text"
          v-model="newMessage"
          placeholder="Type your message here"
          class="w-full outline-none text-black"
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
export default {
  emits: ["close"],
  setup() {
    return {
      faTurnUp,
      faXmark,
    };
  },
  data() {
    return {
      chat: {
        name: "Name",
        message: "Hello, how are you?",
      },
      username: user.value.name,
      newMessage: "",
    };
  },
  components: {
    FontAwesomeIcon,
  },
  methods: {
    close() {
      this.$emit("close");
    },
    sendMessage() {
      if (!this.newMessage.trim()) return; // Don't send if the input is empty

      const messageData = {
        username: this.username,
        message: this.newMessage,
      };

      // Emit the message to the server
      this.socket.emit("game:chat", messageData);

      // Clear the input field after sending
      this.newMessage = "";
    },
  },
};
</script>
