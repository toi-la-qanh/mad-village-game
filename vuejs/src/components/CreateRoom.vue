<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
</script>
<template>
  <div class="relative flex flex-col gap-2 p-4">
    <h3 class="text-xl">Tạo phòng</h3>
    <button class="absolute right-2 top-2 border-2 border-red-400 w-6 h-6" @click="closePopup">
      <FontAwesomeIcon class="text-red-600 hover:text-red-500 focus:text-red-500" :icon="faXmark" />
    </button>
    <form @submit.prevent="handleCreateRoom" class="w-full gap-2 flex flex-col">
      <div class="flex gap-2 w-full flex-wrap">
        <p class="w-auto">Số lượng người:</p>
        <input
          class="outline-none w-auto"
          v-model="capacity"
          type="text"
          placeholder="Nhập số nguyên dương"
        />
      </div>
      <button
        type="submit"
        class="w-full bg-lime-700 rounded-lg text-yellow-300 hover:bg-lime-600 hover:text-white focus:text-white focus:bg-lime-600"
      >
        Tạo
      </button>
      <div v-if="error">
        <p v-if="Array.isArray(error)" class="flex flex-col">
          <span
            v-for="(err, index) in error"
            :key="index"
            class="text-red-500 text-center"
          >
            {{ err }}
          </span>
        </p>
        <p v-else class="text-red-500 text-center">{{ error }}</p>
      </div>
    </form>
  </div>
</template>

<script>
import RoomApi from "../api/room.api";
import { roomID } from "../store";
import { socket } from "../socket";

export default {
  data() {
    return {
      capacity: "",
      error: [],
    };
  },
  methods: {
    closePopup() {
      // Emit an event to notify the parent to close the popup
      this.$emit("close");
    },
    async handleCreateRoom() {
      this.error = [];
      const room = new RoomApi();
      try {
        const response = await room.createRoom({ capacity: this.capacity });
        console.log("Response from createRoom:", response);
        this.closePopup();
        localStorage.setItem('roomID', response.roomID);
        roomID.value = response.roomID;
        socket.emit("room:created", response);
        this.$router.push({ name: "room", params: { id: response.roomID } });
      } catch (error) {
        if (error.status === 422) {
          this.error = error.response?.data?.errors.map(
            (err) => err.msg || err
          );
        } else {
          this.error = error.response?.data?.errors;
        }
      }
    },
  },
};
</script>
