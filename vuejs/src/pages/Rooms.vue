<template>
  <div
    class="flex py-12 w-full h-screen z-10 fixed justify-center items-center font-mono"
  >
    <div
      class="w-full max-w-xl bg-white h-screen rounded-2xl border border-black p-3 overflow-y-auto scrollbar-none"
    >
      <button
        @click="goBack"
        class="outline-none text-lime-700 hover:text-lime-600"
      >
        < Trang chủ
      </button>
      <!-- Title -->
      <div class="mt-4 flex justify-between">
        <h3 class="text-2xl font-bold">Sảnh chờ</h3>
        <input type="text" placeholder="Tìm phòng ..." class="outline-none" />
      </div>

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
        <div v-if="rooms.length > 0">
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
        class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-20"
      >
        <div class="bg-white p-4 rounded-xl w-full max-w-96">
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
      error: null,
      showCreateRoom: false,
    };
  },
  async mounted() {
    const room = new RoomApi();
    try {
      const response = await room.getAllRooms();
      console.log(response);
      this.rooms = response.rooms;
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
  },
};
</script>
