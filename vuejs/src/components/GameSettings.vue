<template>
  <div
    class="w-full h-full fixed top-0 left-0 z-30 flex items-center justify-center"
  >
    <div class="p-4 w-full h-auto max-w-96 bg-gray-900/50 relative text-white">
      <!-- Close button -->
      <button class="absolute right-2 top-1" @click="close">
        <FontAwesomeIcon class="hover:text-gray-300 text-lg" :icon="faXmark" />
      </button>

      <!-- Settings Section -->
      <div class="relative flex flex-col gap-3">
        <!-- Title -->
        <h2 class="text-center text-xl">Cài đặt</h2>

        <!-- Columns -->
        <div class="flex flex-row justify-between items-stretch">
          <!-- Left column with labels -->
          <div class="flex flex-col flex-1">
            <h3 class="w-auto h-auto">Tốc độ di chuyển của nhân vật:</h3>
            <h3>Hiệu ứng hoạt ảnh:</h3>
          </div>

          <!-- Right column with controls -->
          <div class="flex flex-col justify-between items-center flex-1">
            <!-- Character Speed -->
            <div class="flex justify-center items-center">
              <!-- Minus button -->
              <button
                class="text-lg px-1 hover:text-gray-300"
                @click="decrementSpeed"
                :disabled="speed <= 0.5"
              >
                <FontAwesomeIcon :icon="faMinus" />
              </button>

              <!-- Speed input -->
              <input
                type="number"
                class="text-white outline-none bg-inherit w-10 text-center"
                :value="speed"
                readonly
              />

              <!-- Plus button -->
              <button
                class="text-lg px-1 hover:text-gray-300"
                @click="incrementSpeed"
                :disabled="speed >= 2"
              >
                <FontAwesomeIcon :icon="faPlus" />
              </button>
            </div>
            
            <!-- Toggle button for Animation -->
            <button @click="toggleAnimation" class="w-full hover:bg-gray-400">
              {{ animation ? "Bật" : "Tắt" }}
            </button>
          </div>
        </div>

        <!-- Submit button -->
        <button @click="emitChangeSettings" class="w-full hover:bg-gray-400">
          Thay đổi
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { faXmark, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  components: {
    FontAwesomeIcon,
  },
  setup() {
    return {
      faXmark,
      faPlus,
      faMinus,
    };
  },
  data() {
    return {
      speed: 1, // Initial speed is set to 1
      animation: true, // Default animation is enabled
    };
  },
  // Load settings from localStorage when the component is mounted
  mounted() {
    const savedSpeed = sessionStorage.getItem("speed");
    const savedAnimation = sessionStorage.getItem("animation");

    if (savedSpeed) {
      this.speed = parseFloat(savedSpeed);
    }
    if (savedAnimation !== null) {
      this.animation = savedAnimation === "true"; // 'true' string to boolean
    }
  },
  methods: {
    incrementSpeed() {
      if (this.speed < 2) {
        this.speed += 0.1; // Increase speed by 0.1
        this.speed = Math.round(this.speed * 10) / 10; // Round to one decimal place
      }
    },

    decrementSpeed() {
      if (this.speed > 0.5) {
        this.speed -= 0.1; // Decrease speed by 0.1
        this.speed = Math.round(this.speed * 10) / 10; // Round to one decimal place
      }
    },

    // Toggle the animation state between true (Bật) and false (Tắt)
    toggleAnimation() {
      this.animation = !this.animation; // Toggle the animation
    },

    // Emit the updated settings to the parent component (Game.vue)
    emitChangeSettings() {
      // Save settings to sessionStorage when the change button is clicked
      sessionStorage.setItem("speed", this.speed); // Save speed
      sessionStorage.setItem("animation", this.animation); // Save animation

      // Emit new settings to Game.vue
      this.$emit("changeSettings", {
        newSpeed: this.speed,
        newAnimation: this.animation,
      });
    },

    close() {
      this.$emit("close");
    },
  },
};
</script>
