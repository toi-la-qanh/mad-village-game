<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
</script>
<template>
  <div
    class="flex py-12 w-full h-screen z-10 fixed justify-center items-center font-mono"
  >
    <div
      class="w-full max-w-xl bg-white h-full rounded-2xl border border-black p-3 overflow-y-auto scrollbar-none"
    >
      <button
        @click="goBack"
        class="outline-none text-lime-700 hover:text-lime-600"
      >
        < Quay về sảnh
      </button>
      <div v-if="error">
        {{ error }}
      </div>
      <div v-else class="h-auto">
        <!-- Title -->
        <h3 class="text-2xl text-center">
          Phòng chờ ({{ room.playerCount }}/{{ room.capacity }})
        </h3>
        <p>Chủ phòng: {{ room.owner?.name }}</p>
        <p>
          Người chơi:
          <span v-for="(player, index) in room.players" :key="index">
            {{ player.name }}
            <span v-if="index !== room.players.length - 1">, </span>
          </span>
        </p>
        <h3 class="text-2xl text-center">Cài đặt</h3>
        <div class="flex gap-3 flex-col h-auto">
          <div class="flex flex-wrap flex-row gap-2">
            Chọn vai trò:
            <div v-for="(role, index) in roles" :key="index">
              <img
                class="w-[30px] h-[30px] border-2 border-black"
                :class="role.trait === 'bad' ? 'bg-red-500' : 'bg-green-500'"
                :src="'data:image/png;base64,' + role.image"
                @click="chooseRole(role)"
                alt="Role Image"
              />
            </div>
          </div>
          <form
            @submit.prevent="startGame"
            class="flex gap-2 flex-col relative h-auto"
          >
            <div class="flex flex-wrap flex-row gap-4">
              Các vai trò đã chọn:
              <div
                v-for="(role, index) in chosenRoles"
                :key="index"
                class="relative flex flex-row"
              >
                <img
                  class="w-[30px] h-[30px] border-2 border-black"
                  :class="role.trait === 'bad' ? 'bg-red-500' : 'bg-green-500'"
                  :src="'data:image/png;base64,' + role.image"
                  alt="Role Image"
                />
                <FontAwesomeIcon
                  :icon="faXmark"
                  class="absolute right-[-10px] top-[-10px] text-red-500 cursor-pointer"
                  @click="removeRole(role)"
                />
              </div>
            </div>
            <button
              @click="startGame"
              class="relative bottom-0 w-full bg-lime-700 text-yellow-300 p-2 rounded-lg hover:bg-lime-600 hover:text-white"
            >
              Bắt đầu trò chơi
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RoomApi from "../api/room.api";
import GameApi from "../api/game.api";
import { socket } from "../socket";

export default {
  data() {
    return {
      room: [],
      roles: [],
      chosenRoles: [],
      error: null,
    };
  },
  async mounted() {
    const room = new RoomApi();
    try {
      const response = await room.getRoom(this.$route.params.id);
      console.log(response);
      this.room = response.roomData;
    } catch (error) {
      console.error(error);
      this.error = error.response?.data?.errors;
    }
    const game = new GameApi();
    try {
      const response = await game.getRoles();
      this.roles = response.rolesDetail;
    } catch (error) {
      console.error(error);
      this.error = error.response?.data?.errors;
    }
  },
  methods: {
    goBack() {
      this.$router.push("/rooms"); // Navigate back to the rooms page
    },
    chooseRole(role) {
      if (!this.chosenRoles.includes(role)) {
        this.chosenRoles.push(role);
        console.log(this.chosenRoles);
      }
    },
    removeRole(role) {
      this.chosenRoles = this.chosenRoles.filter((r) => r !== role);
    },
    async startGame() {
      const game = new GameApi();
      try {
        const response = await game.start({
          roomID: this.room.roomID,
          roles: this.chosenRoles.map((role) => role.name),
          traits: this.chosenRoles.map((role) => role.trait),
        });
        console.log("Data successfully posted:", response);
        socket.emit("game:start", { game: response.game });
        router.push({ name: "game", params: { id: response.id } });
      } catch (error) {
        console.error(error);
        this.error = error.response?.data?.errors;
      }
    },
  },
};
</script>
