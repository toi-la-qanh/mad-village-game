<template>
  <!-- Top right buttons -->
  <div class="fixed w-full flex justify-end p-1 gap-3 z-20 items-center">
    <!-- Left Arrow -->
    <button v-if="!isArrowClicked" @click="toggleArrow">
      <FontAwesomeIcon
        class="text-white text-3xl hover:text-gray-300"
        :icon="faCaretLeft"
      />
    </button>

    <!-- Right Arrow -->
    <button v-if="isArrowClicked" @click="toggleArrow">
      <FontAwesomeIcon
        class="text-white text-3xl hover:text-gray-300 stroke-black stroke-3"
        :icon="faCaretRight"
      />
    </button>

    <!-- Info -->
    <button v-if="isArrowClicked" @click="showRole">
      <div
        v-html="infoSVG"
        class="hover:shadow-white scale-125 rounded-full hover:shadow-sm hover:bg-gray-400"
      ></div>
    </button>

    <!-- Helper -->
    <button v-if="isArrowClicked" @click="showInstruction">
      <div
        v-html="helpSVG"
        class="hover:shadow-white scale-125 rounded-full hover:shadow-sm hover:bg-gray-400"
      ></div>
    </button>

    <!-- Settings -->
    <button @click="openSettings">
      <div
        v-html="settingSVG"
        class="hover:shadow-white scale-125 rounded-full hover:shadow-sm hover:bg-gray-400"
      ></div>
    </button>
  </div>

  <!-- Middle left buttons -->
  <div class="fixed h-full flex items-center p-1 z-10 flex-col justify-center gap-5">
    <!-- Chat -->
    <button @click="openChat">
      <FontAwesomeIcon
        class="text-white text-3xl hover:text-gray-300"
        :icon="faCommentDots"
      />
    </button>
  </div>
</template>

<script>
import settingSVG from "../assets/settings.svg?raw";
import helpSVG from "../assets/help.svg?raw";
import infoSVG from "../assets/info.svg?raw";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faCaretLeft,
  faCaretRight,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";

export default {
  emits: ["showRole", "showInstruction", "openChat" ,"openSettings"],
  setup() {
    return {
      settingSVG,
      helpSVG,
      infoSVG,
      faCaretLeft,
      faCaretRight,
      faCommentDots
    };
  },
  components: {
    FontAwesomeIcon,
  },
  data() {
    return {
      isArrowClicked: true,
    };
  },
  methods: {
    toggleArrow() {
      this.isArrowClicked = !this.isArrowClicked;
    },
    showRole() {
      this.$emit("showRole");
    },
    showInstruction() {
      this.$emit("showInstruction");
    },
    openChat() {
      this.$emit("openChat");
    },
    openSettings() {
      this.$emit("openSettings");
    },
  },
};
</script>

<style scoped>
.icon-with-border {
  color: black;
  -webkit-text-fill-color: white; /* Will override color (regardless of order) */
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: black;
}
</style>