<template>
  <div class="audio-player">
    <!-- Actual audio element -->
    <audio ref="audioElement" loop>
      <source :src="audioSrc" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
  </div>
</template>

<script>
import { onMounted, onUnmounted, watch, ref } from 'vue';
import { audioEnabled, audioVolume } from '../store';

export default {
  name: 'AudioPlayer',
  props: {
    src: {
      type: String,
      default: '/audio/sound-track.mp3'
    }
  },
  setup(props) {
    const audioElement = ref(null);
    
    // Initialize audio from sessionStorage if available
    // Default to true if not set previously
    if (sessionStorage.getItem('audioEnabled') !== null) {
      audioEnabled.value = sessionStorage.getItem('audioEnabled') === 'true';
    } else {
      audioEnabled.value = true; // Default to enabled
    }
    
    if (sessionStorage.getItem('audioVolume') !== null) {
      audioVolume.value = parseFloat(sessionStorage.getItem('audioVolume'));
    }

    // Watch for changes in audio settings
    watch(audioEnabled, (newValue) => {
      if (audioElement.value) {
        if (newValue) {
          // Try to play with user interaction
          const playPromise = audioElement.value.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              // Auto-play was prevented, create a one-time click handler to play
              const playOnInteraction = () => {
                audioElement.value.play();
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
              };
              
              document.addEventListener('click', playOnInteraction, { once: true });
              document.addEventListener('touchstart', playOnInteraction, { once: true });
            });
          }
        } else {
          audioElement.value.pause();
        }
        sessionStorage.setItem('audioEnabled', newValue);
      }
    });

    watch(audioVolume, (newValue) => {
      if (audioElement.value) {
        audioElement.value.volume = newValue;
        sessionStorage.setItem('audioVolume', newValue);
      }
    });

    onMounted(() => {
      if (audioElement.value) {
        audioElement.value.volume = audioVolume.value;
        
        // Try to autoplay
        if (audioEnabled.value) {
          const playPromise = audioElement.value.play();
          
          // Handle autoplay restrictions
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.info('Autoplay prevented by browser, waiting for user interaction');
              
              // Set up one-time event listeners for user interaction
              const playOnInteraction = () => {
                audioElement.value.play();
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
              };
              
              document.addEventListener('click', playOnInteraction, { once: true });
              document.addEventListener('touchstart', playOnInteraction, { once: true });
            });
          }
        }
      }

      // Add a page visibility change listener to pause/resume audio
      document.addEventListener('visibilitychange', handleVisibilityChange);
    });

    onUnmounted(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });

    // Pause audio when tab is not visible to save resources
    const handleVisibilityChange = () => {
      if (audioElement.value) {
        if (document.hidden) {
          if (!audioElement.value.paused) {
            audioElement.value.pause();
          }
        } else if (audioEnabled.value) {
          audioElement.value.play().catch(e => console.error('Error resuming audio:', e));
        }
      }
    };

    return {
      audioElement,
      audioSrc: props.src
    };
  }
};
</script> 