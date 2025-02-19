<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
</script>
<template>
  <div
    class="flex py-12 w-full h-screen z-10 fixed justify-center items-center font-mono"
  >
    <div
      class="w-full max-w-xl bg-white h-screen rounded-lg border border-black p-3 overflow-y-auto scrollbar-none"
    >
      <button
        @click="goBack"
        class="outline-none text-lime-700 hover:text-lime-600"
      >
        < Trang chủ
      </button>
      <!-- Title -->
      <div class="mt-4 flex justify-between flex-wrap">
        <h3 class="text-2xl font-bold">Sảnh chờ</h3>
        <div class="flex relative gap-2 items-center">
          <FontAwesomeIcon
            class="text-blue-900"
            :icon="faCircleInfo"
            @click="searchHelper"
          />
          <input
            type="text"
            placeholder="Tìm phòng ..."
            class="outline-none"
            @input="searchRooms"
          />
        </div>
      </div>

      <span class="hidden text-gray-400" id="searchInfo">
        Tìm phòng bằng mã phòng hoặc tên của chủ phòng
      </span>

      <div class="mt-2 flex justify-between">
        <button
          @click="createRoom"
          class="text-lime-700 hover:text-lime-600 focus:text-lime-600"
        >
          + Tạo phòng
        </button>
        <button>Bộ lọc</button>
      </div>

      <div class="w-full h-96 mt-7">
        <div v-if="rooms">
          <div
            v-for="(room, index) in rooms"
            :key="index"
            class="border-2 border-lime-700 p-2 my-2 gap-5"
          >
            <div class="flex justify-between">
              <p>Phòng {{ index + 1 }}</p>
              <p>{{ room.playerCount }}/{{ room.capacity }}</p>
            </div>
            <div class="flex justify-between">
              <p>Chủ phòng: {{ room.ownerName }}</p>
              <button
                @click="navigateToRoom(room.roomID)"
                class="text-lime-700 font-bold hover:text-lime-600 focus:text-lime-600"
              >
                Vào phòng >>
              </button>
            </div>
          </div>
        </div>
        <div v-else>
          <p class="text-center">{{ error }}</p>
        </div>
      </div>
      <!-- Create Room Popup (Conditional Rendering) -->
      <div
        v-if="showCreateRoom"
        class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 flex justify-center items-center z-20"
      >
        <div class="bg-white rounded-xl w-full max-w-96">
          <CreateRoom @close="closeCreateRoom" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RoomApi from "../api/room.api";
import CreateRoom from "../components/CreateRoom.vue";

export default {
  components: {
    CreateRoom,
  },
  data() {
    return {
      rooms: [],
      filteredRooms: [],
      error: null,
      showCreateRoom: false,
    };
  },
  async mounted() {
    const room = new RoomApi();
    try {
      this.rooms = await room.getAllRooms();
      this.filteredRooms = this.rooms;
    } catch (error) {
      console.error(error);
      this.error = error.response?.data?.errors;
    }
  },
  methods: {
    navigateToRoom(roomId) {
      this.$router.push({ name: "room", params: { id: roomId } });
    },
    goBack() {
      this.$router.push("/home");
    },
    createRoom() {
      this.showCreateRoom = true;
    },
    closeCreateRoom() {
      // Close the CreateRoom popup
      this.showCreateRoom = false;
    },
    searchHelper() {
      const info = document.getElementById("searchInfo");
      if (info.classList.contains("flex")) {
        info.classList.remove("flex");
        info.classList.add("hidden");
      } else {
        info.classList.remove("hidden");
        info.classList.add("flex");
      }
    },
    searchRooms() {
      this.filteredRooms = this.rooms.filter(
        (room) =>
          room.ownerName
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          room.roomID.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
      if (this.filteredRooms) {
        console.log("Not found");
      }
    },
  },
};
</script>
