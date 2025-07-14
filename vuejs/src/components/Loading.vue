<template>
  <div
    class="w-full h-full fixed top-0 left-0 flex justify-center items-center bg-gray-900/10 z-30"
  >
    <div
      class="flex flex-col justify-center items-center bg-white px-10 pt-4 rounded-lg border border-black"
    >
      <p class="text-xl">{{ $t("loading") }}</p>
      <div v-show="loading" class="lds-ellipsis">
        <div v-bind:style="[spinnerStyle]"></div>
        <div v-bind:style="[spinnerStyle]"></div>
        <div v-bind:style="[spinnerStyle]"></div>
        <div v-bind:style="[spinnerStyle]"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Loading",
  props: {
    loading: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: "#7f58af",
    },
  },
  data() {
    return {
      spinnerStyle: {
        background: this.color,
      },
    };
  },
};
</script>

<style scoped>
.lds-ellipsis {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ellipsis div {
  position: absolute;
  top: 33px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  animation-timing-function: cubic-bezier(0, 1, 1, 0);
}
.lds-ellipsis div:nth-child(1) {
  left: 8px;
  animation: lds-ellipsis1 0.6s infinite;
}
.lds-ellipsis div:nth-child(2) {
  left: 8px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(3) {
  left: 32px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(4) {
  left: 56px;
  animation: lds-ellipsis3 0.6s infinite;
}
@keyframes lds-ellipsis1 {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes lds-ellipsis3 {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}
@keyframes lds-ellipsis2 {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(24px, 0);
  }
}
</style>
