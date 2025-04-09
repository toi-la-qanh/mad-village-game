<template>
  <div
    class="flex py-12 w-full h-screen z-10 fixed justify-center items-center font-mono"
  >
    <div
      class="w-full max-w-xl relative bg-white h-full rounded-2xl border border-black p-3 overflow-y-auto"
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
        <p v-if="Array.isArray(error)" class="flex flex-col">
          <span v-for="(err, index) in error" :key="index" class="text-center">
            {{ err }}
          </span>
        </p>
        <p v-else class="text-center">{{ error }}</p>
      </div>

      <div v-else class="space-y-3">
        <!-- Title -->
        <div class="flex justify-center gap-1">
          <h3 class="text-2xl text-center">
            Phòng chờ ({{ room.playerCount }}/{{ room.capacity }})
          </h3>
          <button @click="copyRoomLink"><FontAwesomeIcon :icon="faCopy"/></button>
        </div>

        <!-- Room Owner -->
        <p>Chủ phòng: {{ room.owner?.name }}</p>

        <!-- Player -->
        <div>
          Người chơi:
          <span v-for="(player, index) in filteredPlayers" :key="index">
            {{ player.name }}

            <button
              v-if="userID === room.owner?._id && player._id !== userID"
              @click="kickPlayer(index)"
              class="relative -top-2"
            >
              <FontAwesomeIcon
                class="text-red-700 hover:text-gray-400"
                :icon="faXmark"
              />
            </button>
            <span v-if="index !== room.players.length - 2">, </span>
          </span>
        </div>

        <div v-if="errorWhenKickPlayer">
          <p v-if="Array.isArray(errorWhenKickPlayer)" class="flex flex-col">
            <span
              v-for="(err, index) in errorWhenKickPlayer"
              :key="index"
              class="text-center"
            >
              {{ err }}
            </span>
          </p>
          <p v-else class="text-center">{{ errorWhenKickPlayer }}</p>
        </div>

        <!-- User is not in the room -->
        <div v-if="!userInRoom" class="relative">
          <div v-if="room.password" class="mt-5 text-center flex flex-wrap justify-center gap-3">
            <p class="text-2xl">Mật khẩu phòng:</p>

            <!-- Password Input -->
            <div class="flex items-center">
              <input
                :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="Nhập mật khẩu"
                v-model="inputPassword"
                class="outline-none w-30"
              />

              <!-- Show/Hide Password Button -->
              <button @click="togglePasswordVisibility">
                <FontAwesomeIcon
                  :icon="isPasswordVisible ? faEyeSlash : faEye"
                />
              </button>
            </div>
          </div>

          <!-- Button to join the room -->
          <button
            type="submit"
            class="mt-5 text-gray-600 bg-green-300 w-full hover:bg-green-500 rounded-md py-2 font-semibold transition-colors duration-200"
            @click="joinRoom"
          >
            Vào phòng
          </button>

          <!-- Error messages -->
          <p class="text-red-500 text-center" v-if="errorWhenJoiningRoom">
            {{ errorWhenJoiningRoom }}
          </p>

          <!-- Helper details -->
          <p class="mt-10 text-center">
            Thông tin phòng sẽ hiện ra khi bạn đã vào phòng
          </p>
        </div>

        <!-- User is in the room -->
        <div v-else class="space-y-3">
          <!-- Room Settings -->
          <div>
            <h3 class="text-2xl text-center">Cài đặt phòng</h3>
            <h4 class="text-center text-gray-500">
              Bạn có thể cập nhật lại cài đặt phòng ở đây
            </h4>
            <div class="flex gap-1 flex-col h-auto relative">
              <div class="flex flex-row gap-2">
                <p>Số lượng người:</p>
                <input
                  type="number"
                  :placeholder="room.capacity"
                  min="0"
                  v-model="newCapacity"
                  class="w-10 outline-0"
                />
              </div>
              <div class="flex flex-row gap-2">
                <p>Mật khẩu phòng:</p>
                <input
                  type="text"
                  placeholder="Nhập mật khẩu mới"
                  v-model="newPassword"
                  class="w-30 outline-0"
                />
              </div>
              <button
                class="w-full font-bold text-gray-600 bg-green-300 p-2 rounded-lg hover:bg-green-500 hover:text-white"
                @click="updateRoom"
                :disabled="disableButton()"
              >
                Cập nhật
              </button>

              <!-- Error message -->
              <div v-if="errorWhenUpdatingRoom">
                <p
                  v-if="Array.isArray(errorWhenUpdatingRoom)"
                  class="flex flex-col"
                >
                  <span
                    v-for="(err, index) in errorWhenUpdatingRoom"
                    :key="index"
                    class="text-red-500 text-center"
                  >
                    {{ err }}
                  </span>
                </p>
                <p v-else class="text-red-500 text-center">
                  {{ errorWhenUpdatingRoom }}
                </p>
              </div>
            </div>
          </div>

          <!-- Game Settings -->
          <div>
            <h3 class="text-2xl text-center">Cài đặt game</h3>
            <h4 class="text-center text-gray-500">
              Chọn ít nhất 1 vai trò tốt, 1 vai trò xấu
            </h4>
            <div class="flex gap-1 flex-col h-auto relative mt-4">
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

              <!-- Selected roles -->
              <div class="flex flex-wrap flex-row gap-4 relative">
                Các vai trò đã chọn:
                <div class="flex flex-row gap-5 relative">
                  <div v-for="(role, index) in selectedRoles" :key="index">
                    <div class="flex relative gap-0.5">
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
                </div>
              </div>

              <!-- Vote time -->
              <div>
                Thời gian bỏ phiếu:
                <input
                  type="number"
                  :placeholder="vote_time"
                  min="30"
                  max="300"
                  class="outline-none w-10"
                />
                (giây)
              </div>

              <!-- Discussion time -->
              <div>
                Thời gian thảo luận:
                <input
                  type="number"
                  :placeholder="discussion_time"
                  min="60"
                  max="600"
                  class="outline-none w-10"
                />
                (giây)
              </div>

              <!-- Start game button -->
              <button
                class="w-full font-bold text-gray-600 bg-green-300 p-2 rounded-lg hover:bg-green-500 hover:text-white"
                :disabled="disableButton()"
                @click="startGame"
              >
                Bắt đầu chơi
              </button>

              <!-- Error message from the form -->
              <div v-if="gameError">
                <p v-if="Array.isArray(gameError)" class="flex flex-col">
                  <span
                    v-for="(err, index) in gameError"
                    :key="index"
                    class="text-red-500 text-center"
                  >
                    {{ err }}
                  </span>
                </p>
                <p v-else class="text-red-500 text-center">{{ gameError }}</p>
              </div>
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
import { isLoading, roomID, user } from "../store";
import { defineAsyncComponent } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faEye, faEyeSlash, faXmark } from "@fortawesome/free-solid-svg-icons";
import {faCopy} from "@fortawesome/free-regular-svg-icons"
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

export default {
  setup() {
    return { faXmark, faCircleInfo, faEye, faEyeSlash, faCopy };
  },

  components: {
    RoleInfo: defineAsyncComponent(() => import("../components/RoleInfo.vue")),
    FontAwesomeIcon,
  },

  data() {
    return {
      room: {
        players: [
          {
            _id: "",
            name: "",
          },
        ],
      },
      userID: user.value.id,
      userInRoom: false,
      roles: [],
      selectedRoles: [],
      error: null,
      errorWhenJoiningRoom: null,
      gameError: null,
      isRoleInfoVisible: false,
      selectedRoleForPopup: [],
      isPasswordVisible: false,
      inputPassword: "",
      newCapacity: 6,
      newPassword: "",
      errorWhenUpdatingRoom: null,
      vote_time: 30,
      discussion_time: 120,
      errorWhenKickPlayer: null,
    };
  },

  computed: {
    filteredPlayers() {
      return (
        this.room.players?.filter(
          (player) => player.name !== this.room.owner?.name
        ) || []
      );
    },
  },

  async mounted() {
    this.room = JSON.parse(sessionStorage.getItem("room"));
    console.log(this.room);
    if (this.room == null) {
      await this.fetchRoom(this.$route.params.id);
    }

    if (!this.error && this.room) {
      if (this.room._id !== roomID.value) {
        this.userInRoom = false;
      } else {
        this.userInRoom = true;
      }
      this.handleSocketEvents();

      // Get roles from session storage or fetch them
      this.roles = JSON.parse(sessionStorage.getItem("all_roles"));
      if (!this.roles) await this.fetchRoles();
    }
  },

  beforeUnmount() {
    // Clean up the socket listener to prevent memory leaks
    ["room:join", "room:update", "role:update", "game:started"].forEach(
      (event) => {
        socket.off(event);
      }
    );

    // Clear local storage if leaving the component
    if (this.error) {
      localStorage.removeItem("roomID");
    }
  },

  methods: {
    handleSocketEvents() {
      // Update the room data when it changes
      this.$socket.on("room:update", async (roomID) => {
        await this.fetchRoom(roomID);
      });

      // Update the selected roles
      this.$socket.on("role:update", (data) => {
        this.selectedRoles = data;
      });

      // Take the user to the game page
      this.$socket.on("game:started", (gameID) => {
        localStorage.setItem("gameID", gameID);
        this.$router.push({ name: "game", params: { id: gameID } });
      });
    },

    async fetchRoom(id) {
      isLoading.value = true;
      try {
        const room = new RoomApi();
        const response = await room.getRoom(id);
        isLoading.value = false;
        if (response != null) {
          this.room = response?.roomData;
          sessionStorage.setItem("room", JSON.stringify(this.room));
        }
      } catch (error) {
        isLoading.value = false;
        sessionStorage.removeItem("room");
        if (error.status === 422) {
          this.error = error.response?.data?.errors.map(
            (err) => err.msg || err
          );
        } else if (error.status === 404) {
          this.error = error.response?.data?.errors;
        } else {
          this.error = error.message;
        }
      }
    },

    copyRoomLink() {
      navigator.clipboard.writeText(window.location.href);
    },

    async joinRoom() {
      isLoading.value = true;
      try {
        const room = new RoomApi();
        const data = {};

        if (this.inputPassword) {
          data.password = this.inputPassword; // Only add the password if it's not an empty string
        }

        const response = await room.joinRoom(this.$route.params.id, data);
        if (response != null) {
          isLoading.value = false;
          this.userInRoom = true;
          this.$socket.emit("room:join", this.room._id);
          roomID.value = this.room._id;
        }
      } catch (error) {
        isLoading.value = false;
        console.log(error);
        this.errorWhenJoiningRoom = error.response?.data?.errors;
      }
    },

    togglePasswordVisibility() {
      // Toggle password visibility
      this.isPasswordVisible = !this.isPasswordVisible;
    },

    async goBack() {
      if (!this.error) {
        const isConfirmed = window.confirm("Bạn có chắc muốn rời khỏi phòng?");
        if (!isConfirmed) return;

        try {
          const room = new RoomApi();
          await room.leaveRoom(this.room._id);
          socket.emit("room:leave", this.room._id);
          roomID.value = null;
          this.$router.push("/rooms");
        } catch (error) {
          console.error("Leave room error:", error);
          this.error = error.response?.data?.error || error.message;
        }
      } else {
        roomID.value = null;
        this.$router.push("/rooms");
      }
    },

    async fetchRoles() {
      const game = new GameApi();
      try {
        const response = await game.getRoles();
        if (response != null) {
          this.roles = response?.rolesDetail;
          sessionStorage.setItem(
            "all_roles",
            JSON.stringify(response?.rolesDetail)
          );
        }
      } catch (error) {
        this.error = error.message;
      }
    },

    chooseRole(role) {
      if (this.userID !== this.room.owner._id) return;
      this.selectedRoles.push(role);
      this.syncRolesWithServer();
    },

    removeRole(index) {
      if (this.userID !== this.room.owner._id) return;
      this.selectedRoles.splice(index, 1);
      this.syncRolesWithServer();
    },

    syncRolesWithServer() {
      this.$socket.emit("role:select", {
        role: this.selectedRoles,
        roomID: this.room?.roomID,
      });
    },

    async startGame() {
      const game = new GameApi();
      isLoading.value = true;
      try {
        const response = await game.start({
          roomID: this.room._id,
          roles: this.selectedRoles.map((role) => role.name),
          traits: this.selectedRoles.map((role) => role.trait),
          vote_time: this.vote_time,
          discussion_time: this.discussion_time,
        });
        isLoading.value = false;
        if (response != null) {
          localStorage.setItem("gameID", response.gameID);
          this.$router.push({ name: "game", params: { id: response.gameID } });
          this.$socket.emit("game:start", response.gameID);
        }
      } catch (error) {
        isLoading.value = false;
        console.log(error);
        if (error.status === 422) {
          this.gameError = error.response?.data?.errors.map(
            (err) => err.msg || err
          );
        } else {
          this.gameError = error.response?.data?.errors;
        }
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

    async updateRoom() {
      isLoading.value = true;
      try {
        const room = new RoomApi();
        const passRoom = this.newPassword?.trim() || "";

        const response = await room.updateRoom({
          capacity: this.newCapacity,
          password: passRoom,
        });
        isLoading.value = false;

        if (response != null && response.roomID) {
          this.fetchRoom(response.roomID);
          this.$socket.emit("room:refresh", response.roomID);
        }
      } catch (error) {
        isLoading.value = false;
        console.log(error);
        if (error.status === 422) {
          this.errorWhenUpdatingRoom = error.response?.data?.errors.map(
            (err) => err.msg || err
          );
        } else {
          this.errorWhenUpdatingRoom = error.response?.data?.errors;
        }
      }
    },

    /**
     * Method to allow only the owner of the room can access to api
     */
    disableButton() {
      return this.userID !== this.room.owner?._id;
    },

    async kickPlayer(index) {
      const userConfirmed = window.confirm(
        "Bạn có chắc muốn đá người chơi này ra khỏi phòng?"
      );

      if (!userConfirmed) {
        return; // If the user cancels, exit the function without doing anything
      }

      const playerId = this.room.players[index + 1].id;
      console.log(playerId);
      isLoading.value = true;
      try {
        const room = new RoomApi();
        const response = await room.kickPlayer(this.room._id, {
          user_id: playerId,
        });
        if (response) {
          this.$socket.emit("room:refresh", response.roomID);
          this.fetchRoom(response.roomID);
        }
        isLoading.value = false;
      } catch (error) {
        isLoading.value = false;
        if (error.status === 422) {
          this.errorWhenKickPlayer = error.response?.data?.errors.map(
            (err) => err.msg || err
          );
        } else {
          this.errorWhenKickPlayer = error.response?.data?.errors;
        }
      }
    },
  },
};
</script>
