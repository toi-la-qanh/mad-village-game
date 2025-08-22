  <template>
    <BackGround v-if="showBackground" />
    <router-view class="z-10 absolute" />
    <SignUpForm v-if="showSignUpForm" />
    <ErrorPopup v-if="errorMessages && !showSignUpForm" />
    <Loading v-if="isLoading" />
    <AudioPlayer :src="'/audio/sound-track.mp3'" />
  </template>

  <script>
  import { defineAsyncComponent } from 'vue';
  import { showSignUpForm, showBackground, errorMessages, isLoading } from './store';
  export default {
    components: {
      // Lazy load components
      BackGround: defineAsyncComponent(() => import('./layouts/BackGround.vue')),
      SignUpForm: defineAsyncComponent(() => import('./components/SignUpForm.vue')),
      ErrorPopup: defineAsyncComponent(() => import('./components/ErrorPopup.vue')),
      Loading: defineAsyncComponent(() => import('./components/Loading.vue')),
      AudioPlayer: defineAsyncComponent(() => import('./components/AudioPlayer.vue')),
    },
    setup() {
      return {
        showSignUpForm,
        showBackground,
        errorMessages,
        isLoading,
      };
    },
  };
  </script>
