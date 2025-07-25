<template>
  <div class="fixed inset-0 flex justify-center items-center z-20">
    <div class="w-full max-w-[800px] h-5/6 bg-white rounded-2xl shadow-2xl relative overflow-hidden">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 mb-1">
        <button 
          @click="close" 
          class="p-2 text-green-600 hover:text-gray-600 transition-colors duration-200"
        >
          <FontAwesomeIcon :icon="faArrowLeft" class="text-xl" />
        </button>
        <h3 class="text-xl font-semibold text-gray-800">{{ $t("instruction.title") }}</h3>
        <button 
          @click="showListOfContents" 
          class="p-2 text-green-600 hover:text-gray-600 transition-colors duration-200"
        >
          <FontAwesomeIcon :icon="faListUl" class="text-xl" />
        </button>
      </div>

      <!-- Content -->
      <div class="h-full overflow-y-auto px-6 py-4">
        <!-- Instructions -->
        <div class="prose prose-green max-w-none mb-8">
          <div v-html="text" id="guide" class="space-y-4"></div>
        </div>

        <!-- Roles Section -->
        <div class="space-y-8 mb-20">
          <h3 class="text-xl font-semibold text-gray-800" id="roles">{{ $t("instruction.roles") }}</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="(role, index) in roles"
              :key="index"
              class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex flex-col md:flex-row gap-4">
                <!-- Role Image -->
                <div class="flex-shrink-0">
                  <img
                    :id="'role-' + (index + 1)"
                    class="w-32 h-32 object-contain rounded-lg border-2"
                    :class="role.trait === 'bad' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'"
                    :src="'data:image/png;base64,' + role.image"
                    alt="Role Image"
                  />
                </div>

                <!-- Role Info -->
                <div class="flex-1 space-y-3">
                  <h4 class="text-lg font-semibold text-gray-800">
                    {{ role.name }}
                    <span 
                      class="ml-2 px-2 py-1 text-xs font-medium rounded-full"
                      :class="role.trait === 'bad' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
                    >
                      {{ role.trait }}
                    </span>
                  </h4>
                  
                  <p class="text-gray-600">{{ role.description }}</p>
                  
                  <div class="space-y-2">
                    <p class="text-sm text-gray-500">
                      {{ $t("instruction.skillUsage") }}: {{ role.counts }}
                    </p>
                    
                    <div class="flex flex-wrap gap-2">
                      <span class="text-sm text-gray-500">{{ $t("instruction.skill") }}:</span>
                      <div class="flex flex-wrap gap-2">
                        <img
                          v-for="(icon, iconIndex) in role.abilityIcons"
                          :key="iconIndex"
                          class="w-8 h-8 object-contain rounded border"
                          :class="role.trait === 'bad' ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'"
                          :src="'data:image/png;base64,' + icon"
                          alt="Ability Icon"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table of Contents Sidebar -->
      <div 
        v-if="listOfContents"
        class="absolute right-0 top-0 h-full w-64 bg-white border-l border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out overflow-auto"
      >
        <div class="px-4 py-6">
          <h4 class="text-lg font-semibold text-gray-800 mb-4">{{ $t("instruction.tableOfContents") }}</h4>
          <nav class="space-y-2">
            <a 
              href="#guide" 
              class="block px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              {{ $t("instruction.guide") }}
            </a>
            <div class="space-y-1 pl-4">
              <a 
                href="#roles" 
                class="block px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                {{ $t("instruction.roles") }}
              </a>
              <div class="space-y-1 pl-4">
                <a 
                  v-for="(role, index) in roles" 
                  :key="index"
                  :href="'#role-' + (index + 1)"
                  class="block px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  {{ role.name }} {{ role.trait }}
                </a>
              </div>
            </div>
          </nav>
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
import markdownit from 'markdown-it'

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
          const md = markdownit();
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
/* Hide scrollbar for Chrome, Safari and Opera */
::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
* {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom prose styles */
.prose {
  color: #374151; /* text-gray-700 equivalent */
}

.prose h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937; /* text-gray-800 equivalent */
  margin-bottom: 1rem;
}

.prose h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937; /* text-gray-800 equivalent */
  margin-bottom: 0.75rem;
}

.prose p {
  margin-bottom: 1rem;
}

.prose ul {
  list-style-type: disc;
  list-style-position: inside;
  margin-bottom: 1rem;
}

.prose li {
  margin-bottom: 0.5rem;
}
</style>
