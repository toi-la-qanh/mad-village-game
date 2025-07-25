<template>
  <div class="relative flex flex-col gap-2 p-4">
    <h3 class="text-xl">{{ $t("createRoom.title") }}</h3>
    <button class="absolute right-2 top-2 w-6 h-6" @click="closePopup">
      <FontAwesomeIcon
        class="text-xl text-red-600 hover:text-red-400 focus:text-red-400"
        :icon="faXmark"
      />
    </button>
    <form
      @submit.prevent="handleCreateRoom"
      class="w-full gap-2 flex flex-col relative"
    >
      <div class="flex gap-2 w-full flex-wrap relative">
        <p class="w-auto">{{ $t("createRoom.capacity.title") }}:</p>
        <input
          class="outline-none w-auto"
          v-model="capacity"
          type="text"
          :placeholder="$t('createRoom.capacity.placeholder')"
        />
      </div>
      <div class="flex gap-2 w-full flex-wrap relative">
        <p class="w-auto">{{ $t("createRoom.password.title") }}:</p>
        <input
          class="outline-none w-auto"
          v-model="password"
          type="text"
          :placeholder="$t('createRoom.password.placeholder')"
        />
      </div>
      <button
        type="submit"
        class="text-gray-600 bg-green-300 w-full hover:bg-green-500 rounded-md py-2 font-semibold transition-colors duration-200"
      >
        {{ $t("createRoom.submit") }}
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
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default {
  setup() {
    return {
      faXmark,
    };
  },
  components: {
    FontAwesomeIcon,
  },
  data() {
    return {
      capacity: "",
      password: "",
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
        const roomData = {
          capacity: this.capacity,
        };

        // Only add password if it's not an empty string
        if (this.password !== "") {
          roomData.password = this.password;
        }

        const response = await room.createRoom(roomData);

        this.closePopup();
        roomID.value = response.roomID;
        this.$socket.emit("room:join", response.roomID);
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
