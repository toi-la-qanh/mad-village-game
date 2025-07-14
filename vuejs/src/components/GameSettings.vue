<template>
  <div
    class="w-full h-full fixed top-0 left-0 z-30 flex items-center justify-center overflow-auto scrollbar-hide"
  >
    <div
      class="md:p-5 p-3 h-full md:max-h-min w-full md:max-w-md bg-gray-900/50 relative text-white rounded-lg"
    >
      <!-- Close button -->
      <button class="absolute md:right-2 md:top-2 right-2 top-5" @click="close">
        <FontAwesomeIcon
          class="hover:text-gray-700 text-white text-2xl"
          :icon="faXmark"
        />
      </button>

      <!-- Settings Section -->
      <div class="relative flex flex-col gap-2 sm:gap-3 mt-8 sm:mt-6">
        <!-- Title -->
        <h2 class="text-center text-xl sm:text-2xl font-bold mb-3">{{ $t("settings.title") }}</h2>

        <!-- Columns - stack on mobile, side by side on larger screens -->
        <div class="flex flex-row justify-between items-start gap-4">
          <!-- Left column with labels -->
          <div class="flex flex-col flex-1 space-y-6 sm:space-y-4 w-full">
            <h3 class="text-base sm:text-base h-12 sm:h-10 flex items-center">
              {{ $t("settings.speed") }}:
            </h3>
            <h3 class="text-base sm:text-base h-12 sm:h-10 flex items-center">
              {{ $t("settings.animation") }}:
            </h3>
            <h3 class="text-base sm:text-base h-12 sm:h-10 flex items-center">
              {{ $t("settings.audio.label") }}:
            </h3>
          </div>

          <!-- Right column with controls -->
          <div class="flex flex-col flex-1 space-y-6 sm:space-y-4 w-full">
            <!-- Character Speed -->
            <div class="flex items-center justify-center h-12 sm:h-10">
              <!-- Minus button -->
              <button
                class="text-lg sm:text-base px-3 sm:px-1 hover:text-gray-300 h-full touch-manipulation"
                @click="decrementSpeed"
                :disabled="speed <= 0.5"
              >
                <FontAwesomeIcon :icon="faMinus" />
              </button>

              <input
                type="number"
                inputmode="decimal"
                class="text-white outline-none bg-inherit w-14 sm:w-10 text-center appearance-none h-full text-lg sm:text-base"
                :value="speed"
                readonly
              />

              <!-- Plus button -->
              <button
                class="text-lg sm:text-base px-3 sm:px-1 hover:text-gray-300 h-full touch-manipulation"
                @click="incrementSpeed"
                :disabled="speed >= 2"
              >
                <FontAwesomeIcon :icon="faPlus" />
              </button>
            </div>

            <!-- Toggle button for Animation -->
            <button
              @click="toggleAnimation"
              class="w-full hover:bg-gray-400 px-4 py-2 sm:p-1 rounded text-base sm:text-base h-12 sm:h-10 flex items-center justify-center touch-manipulation"
            >
              {{ animation ? $t("settings.animation.on") : $t("settings.animation.off") }}
            </button>

            <!-- Toggle button for Audio -->
            <button
              @click="toggleAudio"
              class="w-full hover:bg-gray-400 px-4 py-2 sm:p-1 rounded text-base sm:text-base h-12 sm:h-10 flex items-center justify-center touch-manipulation"
            >
              {{ audio ? $t("settings.audio.on") : $t("settings.audio.off") }}
            </button>
          </div>
        </div>

        <!-- Volume Slider (full width) -->
        <div class="flex justify-between items-center w-full gap-2 mt-4">
          <h3 class="whitespace-nowrap text-base">{{ $t("settings.audio.volume") }}:</h3>
          <input
            type="range"
            min="0"
            max="100"
            :value="volume"
            @input="updateVolume"
            class="flex-grow accent-white h-8"
          />
          <span
            class="min-w-[40px] text-center bg-gray-700 px-2 py-1 rounded text-base whitespace-nowrap"
          >
            {{ Math.round(volume) }}%
          </span>
        </div>

        <button
          @click="exitGame"
          class="w-full hover:bg-gray-400 p-3 sm:p-2 mt-3 rounded text-base font-medium touch-manipulation"
        >
          {{ $t("settings.quit") }}
        </button>

        <!-- Submit button -->
        <button
          @click="emitChangeSettings"
          class="w-full hover:bg-gray-400 p-3 sm:p-2 rounded text-base font-medium touch-manipulation"
        >
          {{ $t("settings.submit") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { faXmark, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { audioEnabled, audioVolume, gameID, roomID } from "../store";
import GameApi from "../api/game.api";

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
      audio: audioEnabled.value, // Audio setting
      volume: audioVolume.value * 100, // Volume in 0-100 range
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

    // Toggle the audio state
    toggleAudio() {
      this.audio = !this.audio;
    },

    // Update volume
    updateVolume(e) {
      this.volume = parseFloat(e.target.value);
    },

    // Quit game and redirect to home
    quitGame() {
      if (window.confirm(this.$t("settings.quitGameConfirm"))) {
        this.$router.push("/");
      }
    },

    // Emit the updated settings to the parent component (Game.vue)
    emitChangeSettings() {
      // Save settings to sessionStorage when the change button is clicked
      sessionStorage.setItem("speed", this.speed); // Save speed
      sessionStorage.setItem("animation", this.animation); // Save animation

      // Update audio settings in store
      audioEnabled.value = this.audio;
      audioVolume.value = this.volume / 100;

      sessionStorage.setItem("audioEnabled", this.audio);
      sessionStorage.setItem("audioVolume", this.volume / 100);

      // Emit new settings to Game.vue
      this.$emit("changeSettings", {
        newSpeed: this.speed,
        newAnimation: this.animation,
      });
    },

    async exitGame() {
      const confirmed = window.confirm(
        this.$t("settings.quitGameConfirm")
      );

      if (!confirmed) return;

      try {
        const game = new GameApi();
        await game.exit();
        gameID.value = null;
        if (roomID.value) {
          this.$router.push({ name: "room", params: { id: roomID.value } });
        } else {
          this.$router.push("/rooms");
        }
      } catch (error) {
        console.log(error);
      }
    },

    close() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

/* Improve touch targeting */
.touch-manipulation {
  touch-action: manipulation;
}
</style>
