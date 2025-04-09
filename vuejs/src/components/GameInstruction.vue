<template>
  <div
    class="top-0 w-screen h-full bg-inherit flex justify-center items-center z-20 fixed"
  >
    <div
      class="w-full max-w-[700px] md:border md:border-black px-3 pb-3 h-5/6 gap-3 flex flex-col bg-white rounded-2xl text-black relative"
    >
      <!-- Close Button -->
      <button @click="close" class="absolute left-3 top-2 z-10">
        <FontAwesomeIcon
          class="text-green-700 text-xl hover:text-gray-400"
          :icon="faArrowLeft"
        />
      </button>

      <!-- Show List of Contents Button -->
      <div
        class="absolute z-10 bg-white border-r-0 border-t-0"
        :class="{
          'right-0 top-2 p-1 rounded-tr-2xl border border-black': listOfContents,
          'right-3': !listOfContents,
        }"
      >
        <button @click="showListOfContents">
          <FontAwesomeIcon
            class="text-xl text-green-700 hover:text-gray-400"
            :icon="faListUl"
          />
        </button>

        <ol v-if="listOfContents" class="list-content">
          <li>
            <a href="#guide" class="hover:text-gray-400">Hướng dẫn cách chơi</a>
          </li>
          <li>
            <a href="#roles" class="hover:text-gray-400">Các vai trò</a>
            <ul>
              <li v-for="(role, index) in roles" :key="index">
                <a :href="'#role-' + (index + 1)" class="hover:text-gray-400"
                  >{{ role.name }} {{ role.trait }}</a
                >
              </li>
            </ul>
          </li>
        </ol>
      </div>

      <div class="overflow-y-auto" style="scrollbar-width: none">
        <!-- Instructions -->
        <div class="relative">
          <h3 class="text-center text-2xl sticky top-0 p-2 bg-white">
            Hướng dẫn chơi
          </h3>
          <div v-html="text" id="guide"></div>
        </div>

        <!-- Roles details -->
        <div class="relative">
          <h3 class="text-center text-2xl sticky top-0 p-2 bg-white" id="roles">
            Các vai trò
          </h3>
          <div class="flex flex-col gap-5">
            <div
              v-for="(role, index) in roles"
              :key="index"
              class="flex flex-wrap gap-5"
            >
              <!-- Role Info Column -->
              <div class="flex flex-col flex-1 min-w-40">
                <h4 :id="'role-' + (index + 1)" class="font-bold">
                  {{ role.name }} {{ role.trait }}
                </h4>
                <img
                  class="w-30 h-30 object-contain border border-black bg-green-500"
                  :class="{ 'bg-red-500': role.trait === 'bad' }"
                  :src="'data:image/png;base64,' + role.image"
                  alt="Role Image"
                />
              </div>

              <!-- Ability Icons Column -->
              <div class="flex flex-col flex-1 min-w-40">
                <ul class="list-decimal list-inside space-y-2">
                  <li>Mô tả: {{ role.description }}</li>
                  <li>Số lần sử dụng kỹ năng: {{ role.counts }}</li>
                    <div class="flex space-x-2 flex-wrap items-center">
                      <li>Hình ảnh kỹ năng:</li>
                      <img
                        v-for="(icon, index) in role.abilityIcons"
                        :key="index"
                        class="w-10 h-10 border border-black bg-green-500"
                        :class="{ 'bg-red-500': role.trait === 'bad' }"
                        :src="'data:image/png;base64,' + icon"
                        alt="Role Image"
                      />
                    </div>
                  
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { faArrowLeft, faListUl } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { user } from "../store";
import LlmApi from "../api/llm.api";
import GameApi from "../api/game.api";
import { isLoading } from "../store";
import MarkdownIt from "markdown-it";

export default {
  emits: ["close"],

  setup() {
    return {
      faArrowLeft,
      faListUl,
    };
  },

  data() {
    return {
      user_id: user.value.id,
      text: "",
      roles: [],
      listOfContents: false,
    };
  },

  components: {
    FontAwesomeIcon,
  },

  async mounted() {
    this.text = JSON.parse(sessionStorage.getItem("instruction"));
    if (this.text == null) this.generate();

    this.roles = JSON.parse(sessionStorage.getItem("all_roles"));
    if (!this.roles) this.fetchRoles();
  },

  methods: {
    async generate() {
      try {
        const ai = new LlmApi();
        const response = await ai.getInstruction();

        if (response != null) {
          const md = new MarkdownIt();
          this.text = md.render(response);
          sessionStorage.setItem("instruction", JSON.stringify(this.text));
        }
      } catch (error) {
        this.text = null;
        sessionStorage.removeItem("instruction");
        console.error("Error fetching instruction:", error);
      }
    },

    close() {
      const currentRouteName = this.$route.name;

      if (currentRouteName === "game") {
        // If on the game page, emit the close event
        this.$emit("close");
      } else if (currentRouteName === "instruction") {
        // If on the instruction page, navigate back to the previous page
        this.$router.push({ name: "home" }); // Go back to the previous page
      }
    },

    async fetchRoles() {
      // Set loading state to true
      isLoading.value = true;

      try {
        const game = new GameApi();
        const response = await game.getRoles();
        isLoading.value = false;
        if (response != null) {
          this.roles = response?.rolesDetail;
          sessionStorage.setItem("all_roles", JSON.stringify(this.roles));
        }
      } catch (error) {
        isLoading.value = false;
        this.roles = [];
        sessionStorage.removeItem("all_roles");
        console.error("Error fetching roles:", error);
      }
    },

    showListOfContents() {
      this.listOfContents = !this.listOfContents;
    },
  },
};
</script>

<style scoped>
/* Text border effect using text-shadow (cross-browser) */
.text-with-border {
  text-shadow: 1px 1px 0px black,
    /* Shadow to the right and down */ -1px -1px 0px black,
    /* Shadow to the left and up */ 1px -1px 0px black,
    /* Shadow to the right and up */ -1px 1px 0px black; /* Shadow to the left and down */
}

/* Add margin to each <li> inside the <ol> */
.list-content li {
  margin-left: 10px; /* You can adjust this value as needed */
}
</style>
