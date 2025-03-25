<template>
  <div
    class="fixed top-0 w-full h-full z-20 bg-inherit flex justify-center items-center"
  >
    <div
      class="w-2/3 p-3 h-5/6 gap-3 flex flex-col bg-white rounded-2xl text-black relative overflow-y-auto"
      style="scrollbar-width: none"
    >
      <!-- Close Vote Section -->
      <button @click="close" class="absolute right-3 top-1 z-10">
        <FontAwesomeIcon
          class="text-2xl text-red-400 hover:text-red-200"
          :icon="faXmark"
        />
      </button>

      <h1 class="text-center font-medium text-2xl">Bỏ phiếu</h1>

      <div class="flex relative flex-col gap-4">
        <div v-for="(player, index) in players" >
          <div
            class="flex items-center flex-row relative justify-between leading-10 p-2 rounded-2xl gap-10 border border-black shadow-lg"
          >
            <div class="flex relative flex-col gap-1">
              <p class="h-5 items-center flex">{{ player.name }}</p>
              <img
                class="w-6"
                src="../assets/character_backward_look.png"
                alt=""
              />
            </div>
            <button
              @click="chooseTarget(index)"
              v-if="player._id !== user_id"
              class="top-0 left-0 w-full h-full absolute bg-transparent"
            >
              cham
            </button>
            <p class="text-xl w-5 text-center">1</p>
          </div>
        </div>
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
    players: {
      type: Object,
      required: true,
    },
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
      user_id: user.value.id,
    };
  },
  components: {
    FontAwesomeIcon,
  },
  async mounted() {},
  methods: {
    close() {
      this.$emit("close");
    },
    chooseTarget(index) {
      console.log(index);
    },
  },
};
</script>
