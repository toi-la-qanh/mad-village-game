<template>
  <div
    class="flex py-12 w-full h-screen z-10 fixed justify-center items-center font-mono"
  >
    <div
      class="w-full max-w-xl bg-white h-full rounded-2xl border border-black p-3 overflow-y-auto"
      style="scrollbar-width: none"
    >
      <!-- Go back -->
      <button
        @click="goBack"
        class="outline-none text-lime-700 hover:text-lime-600"
      >
        < Quay về sảnh
      </button>

      <!-- Error -->
      <div v-if="error">
        <p class="text-center">{{ error }}</p>
      </div>

      <div v-else>
        <!-- Loading -->
        <div v-if="loading">
          <p class="text-center">Chờ tí nhé ...</p>
        </div>

        <div v-else>
          <!-- Title -->
          <h3 class="text-2xl text-center">
            Phòng chờ ({{ room.playerCount }}/{{ room.capacity }})
          </h3>

          <!-- Room Owner -->
          <p>Chủ phòng: {{ room.owner?.name }}</p>

          <!-- Player -->
          <p>
            Người chơi:
            <span v-for="(player, index) in room.players" :key="index">
              {{ player.name }}
              <span v-if="index !== room.players.length - 1">, </span>
            </span>
          </p>

          <!-- Settings -->
          <h3 class="text-2xl text-center mb-4">Cài đặt</h3>
          <div class="flex gap-5 flex-col h-auto relative min-h-80">
            <div class="flex flex-row gap-2">
              <p>Số lượng người:</p>
              <input
                type="number"
                :placeholder="room.capacity"
                min="0"
                name=""
                class="w-10 outline-0"
              />
            </div>
            <!-- Role Section -->
            <div class="flex flex-wrap flex-row gap-2 relative">
              Chọn vai trò:
              <div v-for="(role, index) in roles" :key="index">
                <div class="flex gap-0.5">
                  <img
                    class="w-[30px] h-[30px] border-2 border-black hover:shadow-gray-500 hover:shadow-md"
                    :class="
                      role.trait === 'bad' ? 'bg-red-500' : 'bg-green-500'
                    "
                    :src="'data:image/png;base64,' + role.image"
                    @click="chooseRole(role)"
                    alt="Role Image"
                  />
                  <FontAwesomeIcon
                    class="text-sm text-blue-900 -top-2 relative hover:text-gray-500"
                    :icon="faCircleInfo"
                    @click="openRoleInfoPopup(role)"
                  />
                </div>
              </div>
            </div>

            <!-- Submit form to start the game -->
            <form
              @submit.prevent="startGame"
              class="flex gap-2 flex-col h-full min-h-20"
            >
              <!-- Selected roles -->
              <div class="flex flex-wrap flex-row gap-4 relative">
                Các vai trò đã chọn:
                <div
                  v-for="(role, index) in selectedRoles"
                  :key="index"
                  class="relative flex flex-row"
                >
                  <img
                    class="w-[30px] h-[30px] border-2 border-black"
                    :class="
                      role.trait === 'bad' ? 'bg-red-500' : 'bg-green-500'
                    "
                    :src="'data:image/png;base64,' + role.image"
                    alt="Role Image"
                  />
                  <FontAwesomeIcon
                    :icon="faXmark"
                    class="absolute right-[-10px] top-[-10px] text-red-500 cursor-pointer"
                    @click="removeRole(index)"
                  />
                </div>
              </div>

              <!-- Start game button -->
              <button
                class="absolute bottom-0 w-full bg-lime-700 text-yellow-300 p-2 rounded-lg hover:bg-lime-600 hover:text-white"
              >
                Bắt đầu trò chơi
              </button>
            </form>

            <!-- Error message from the form -->
            <div v-if="gameError">
              <p class="text-red-500 text-center flex relative justify-center">
                {{ gameError }}
              </p>
            </div>
          </div>

          <!-- Role info section -->
          <RoleInfo
            v-if="isRoleInfoVisible"
            :role="selectedRoleForPopup"
            @close="closeRoleInfoPopup"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RoomApi from "../api/room.api";
import GameApi from "../api/game.api";
import { socket } from "../socket";
import { isLoading, roomID } from "../store";
import { defineAsyncComponent } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

export default {
  setup() {
    return { faXmark, faCircleInfo };
  },
  components: {
    RoleInfo: defineAsyncComponent(() => import("../components/RoleInfo.vue")),
    FontAwesomeIcon,
  },
  data() {
    return {
      room: {},
      roles: [],
      selectedRoles: [],
      error: null,
      loading: false,
      gameError: null,
      isRoleInfoVisible: false,
      selectedRoleForPopup: [],
    };
  },
  async mounted() {
    await this.joinRoom(this.$route.params.id);
    await this.fetchRoom(this.$route.params.id);
    // console.log(this.error);
    if (!this.error) {
      roomID.value = this.$route.params.id;
      this.handleSocketEvents();
      await this.fetchRoles();
    } else {
      roomID.value = null;
    }
  },
  beforeUnmount() {
    // Leave the Socket.IO room when the component is destroyed
    // socket.emit('leaveRoom', this.$route.params.id);

    // Clean up the socket listener to prevent memory leaks
    socket.off("room:join");
    socket.off("room:update");
    socket.off("role:update");
    socket.off("game:started");
  },
  methods: {
    handleSocketEvents() {
      // Update the room data when it changes
      socket.on("room:update", async (roomID) => {
        await this.fetchRoom(roomID);
      });

      // Update the selected roles
      socket.on("role:update", (data) => {
        this.selectedRoles = data;
      });

      // Take the user to the game page
      socket.on("game:started", (gameID) => {
        localStorage.setItem("gameID", gameID);
        this.$router.push({ name: "game", params: { id: gameID } });
      });
    },
    async fetchRoom(id) {
      const room = new RoomApi();
      try {
        const response = await room.getRoom(id);
        this.room = response?.roomData;
      } catch (error) {
        console.log(error.response?.data?.errors);
        if (error.response?.status === 404) {
          this.error = error.response?.data?.errors;
        } else {
          this.error = error.message;
        }
      }
    },
    async joinRoom(id) {
      const room = new RoomApi();
      try {
        const response = await room.joinRoom(id);
        localStorage.setItem("roomID", response.roomID);
        roomID.value = response.roomID;
        socket.emit("room:join", response.roomID);
      } catch (error) {
        console.log(error.response?.data?.errors);
        this.error = error.response?.data?.errors;
      }
    },
    async goBack() {
      if (!this.error) {
        const isConfirmed = window.confirm("Bạn có chắc muốn rời khỏi phòng?");
        if (isConfirmed) {
          try {
            const room = new RoomApi();
            await room.leaveRoom(this.$route.params.id);
            socket.emit("room:leave", this.$route.params.id);
            if (localStorage.getItem("roomID"))
              localStorage.removeItem("roomID");
            await this.$router.push("/rooms");
          } catch (error) {
            if (error.response?.status === 404) {
              this.error = error.response?.data?.errors;
            } else {
              this.error = error.message;
            }
          }
        }
      } else {
        if (localStorage.getItem("roomID")) localStorage.removeItem("roomID");
        await this.$router.push("/rooms");
      }
    },
    async fetchRoles() {
      const game = new GameApi();
      try {
        const response = await game.getRoles();
        this.roles = response?.rolesDetail;
      } catch (error) {
        this.error = error.message;
      }
    },
    chooseRole(role) {
      this.selectedRoles.push(role);
      localStorage.setItem("selectedRoles", JSON.stringify(this.selectedRoles));
      socket.emit("role:select", {
        role: JSON.parse(localStorage.getItem("selectedRoles")),
        roomID: this.room?.roomID,
      });
    },
    removeRole(index) {
      this.selectedRoles.splice(index, 1);
      localStorage.setItem("selectedRoles", JSON.stringify(this.selectedRoles));
      socket.emit("role:remove", {
        role: JSON.parse(localStorage.getItem("selectedRoles")),
        roomID: this.room?.roomID,
      });
    },
    async startGame() {
      const game = new GameApi();
      isLoading.value = true;
      try {
        const response = await game.start({
          roomID: this.room.roomID,
          roles: this.selectedRoles.map((role) => role.name),
          traits: this.selectedRoles.map((role) => role.trait),
        });
        isLoading.value = false;
        localStorage.setItem("gameID", response.gameID);
        socket.emit("game:start", response.gameID);
      } catch (error) {
        isLoading.value = false;
        console.log(error);
        this.gameError = error.response?.data?.errors;
      }
    },
    openRoleInfoPopup(role) {
      this.selectedRoleForPopup = role;
      this.isRoleInfoVisible = true;
    },
    closeRoleInfoPopup() {
      this.isRoleInfoVisible = false;
      this.selectedRoleForPopup = null;
    },
  },
};
</script>
