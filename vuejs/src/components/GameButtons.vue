<template>
  <div class="absolute w-full flex justify-end p-1 gap-3 z-10">
    <button v-if="!isArrowClicked" @click="toggleArrow">
      <FontAwesomeIcon
        class="text-white hover:text-gray-300"
        :icon="faCaretLeft"
      />
    </button>
    <button v-if="isArrowClicked" @click="toggleArrow">
      <FontAwesomeIcon
        class="text-white hover:text-gray-300"
        :icon="faCaretRight"
      />
    </button>
    <button v-if="isArrowClicked" @click="showRole">
      <div
        v-html="infoSVG"
        class="hover:shadow-white rounded-full hover:shadow-sm hover:bg-gray-400"
      ></div>
    </button>
    <button v-if="isArrowClicked">
      <div
        v-html="helpSVG"
        class="hover:shadow-white rounded-full hover:shadow-sm hover:bg-gray-400"
      ></div>
    </button>
    <button @click="openSettings">
      <div
        v-html="settingSVG"
        class="hover:shadow-white rounded-full hover:shadow-sm hover:bg-gray-400"
      ></div>
    </button>
  </div>
  <div class="absolute h-full flex items-center p-1 z-10">
    <button @click="openChat">
      <FontAwesomeIcon
        class="text-white text-xl hover:text-gray-300"
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
  emits: ["showRole", "openChat" ,"openSettings"],
  setup() {
    return {
      settingSVG,
      helpSVG,
      infoSVG,
      faCaretLeft,
      faCaretRight,
      faCommentDots,
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
    openChat() {
      this.$emit("openChat");
    },
    openSettings() {
      this.$emit("openSettings");
    },
  },
};
</script>
