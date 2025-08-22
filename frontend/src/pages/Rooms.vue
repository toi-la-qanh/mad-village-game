<template>
  <div
    class="flex py-11 w-full h-screen z-10 fixed justify-center items-center font-mono"
  >
    <div
      class="w-full max-w-xl bg-white h-full rounded-lg border border-black p-3 overflow-y-auto"
      style="scrollbar-width: none"
    >
      <!-- Go back to Homepage -->
      <button
        @click="goBack"
        class="outline-none text-lime-700 hover:text-lime-600"
      >
        < {{$t("rooms.goBack.home")}}
      </button>

      <!-- Title -->
      <div class="mt-4 flex justify-between flex-wrap">
        <h3 class="text-2xl font-bold">{{ $t("rooms.title") }}</h3>
        <div class="flex relative gap-2 items-center">
          <FontAwesomeIcon
            class="text-blue-900"
            :icon="faCircleInfo"
            @click="searchHelper"
          />
          <input
            type="text"
            :placeholder="$t('rooms.searchPlaceholder')"
            class="outline-none max-w-35"
            @input="searchRooms"
          />
        </div>
      </div>

      <!-- Search Helper -->
      <span class="hidden text-gray-400" id="searchInfo">
        {{ $t("rooms.searchHelper") }}
      </span>

      <div class="mt-2 flex justify-between">
        <!-- Create Room Button -->
        <button
          @click="createRoom"
          class="text-lime-700 hover:text-lime-600 focus:text-lime-600"
        >
          + {{ $t("rooms.createRoom") }}
        </button>

        <!-- Refresh Button -->
        <div
          class="flex gap-2 items-center text-lime-700 hover:text-lime-600 focus:text-lime-600"
        >
          <FontAwesomeIcon class="animate-spin" :icon="faRotate" />
          <button @click="refreshRooms()">{{ $t("rooms.reload") }}</button>
        </div>
      </div>

      <div class="w-full h-auto min-h-96 mt-7">
        <div v-if="filteredRooms && filteredRooms.length > 0">
          <div
            v-for="(room, index) in filteredRooms"
            :key="index"
            class="mb-2 border-2 border-lime-700 p-2 my-2 gap-5"
          >
            <div class="flex justify-between">
              <p>{{ $t("rooms.room") }} {{ index + 1 }}</p>
              <p>{{ room.playerCount }}/{{ room.capacity }}</p>
            </div>
            <div class="flex justify-between">
              <p>{{ $t("rooms.owner") }}: {{ room.ownerName }}</p>
              <button
                @click="navigateToRoom(room.roomID)"
                class="text-lime-700 font-bold hover:text-lime-600 focus:text-lime-600"
              >
                {{ $t("rooms.enterRoom") }} >>
              </button>
            </div>
          </div>
        </div>
        <div v-else>
          <div v-if="error">
            <p class="text-center">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Create Room Popup (Conditional Rendering) -->
      <div
        v-if="showCreateRoom"
        class="fixed top-0 left-0 w-full h-full bg-black/30 flex justify-center items-center z-20"
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
import { defineAsyncComponent } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faCircleInfo, faRotate } from "@fortawesome/free-solid-svg-icons";
import { isLoading } from "../store";

export default {
  components: {
    CreateRoom: defineAsyncComponent(() =>
      import("../components/CreateRoom.vue")
    ),
    FontAwesomeIcon,
  },
  
  setup() {
    return { faCircleInfo, faRotate };
  },

  data() {
    return {
      rooms: null,
      filteredRooms: [],
      error: null,
      showCreateRoom: false,
      searchQuery: "",
    };
  },

  async mounted() {
    const cachedRooms = sessionStorage.getItem("rooms");
    if (cachedRooms) {
      this.rooms = JSON.parse(cachedRooms);
      this.filteredRooms = this.rooms.rooms || [];
    } else {
      await this.fetchRooms();
    }
  },

  methods: {
    async fetchRooms() {
      isLoading.value = true;
      const room = new RoomApi();
      try {
        const response = await room.getAllRooms();
        if (response) {
          this.rooms = response;
          this.filteredRooms = response.rooms || [];
          sessionStorage.setItem("rooms", JSON.stringify(response));
        }
      } catch (error) {
        sessionStorage.removeItem("rooms");
        this.error = error.response?.data?.errors || this.$t("rooms.errors.loadRooms");
      } finally {
        isLoading.value = false;
      }
    },

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

    searchRooms(event) {
      this.searchQuery = event.target.value || "";
      
      if (!this.rooms || !this.rooms.rooms) {
        this.filteredRooms = [];
        return;
      }
      
      this.filteredRooms = this.rooms.rooms.filter(room => 
        room.ownerName?.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
        room.roomID?.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
      
      if (this.filteredRooms.length === 0 && this.searchQuery) {
        this.error = this.$t("rooms.errors.noRoomFound");
      } else {
        this.error = null;
      }
    },

    refreshRooms() {
      isLoading.value = true;
      this.rooms = null;
      this.filteredRooms = [];
      this.searchQuery = "";
      this.error = null;
      this.fetchRooms();
    },
  },
};
</script>
