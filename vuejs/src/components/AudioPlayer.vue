<template>
  <div class="audio-player">
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
    const userInteracted = ref(false);
    
    // Initialize audio from sessionStorage if available
    if (sessionStorage.getItem('audioEnabled') !== null) {
      audioEnabled.value = sessionStorage.getItem('audioEnabled') === 'true';
    } else {
      audioEnabled.value = true; // Default to enabled
    }
    
    if (sessionStorage.getItem('audioVolume') !== null) {
      audioVolume.value = parseFloat(sessionStorage.getItem('audioVolume'));
    }

    // Safe play function that handles promise rejection
    const safePlay = () => {
      if (!audioElement.value || !audioEnabled.value) return;
      
      const playPromise = audioElement.value.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.info('Play prevented:', error);
          // Don't keep trying to play if the user hasn't interacted
          if (!userInteracted.value) {
            setupInteractionHandlers();
          }
        });
      }
    };

    // Set up event handlers for user interaction
    const setupInteractionHandlers = () => {
      const playOnInteraction = () => {
        userInteracted.value = true;
        safePlay();
      };
      
      // Add to various events for better mobile support
      ['click', 'touchstart', 'touchend', 'pointerdown'].forEach(eventType => {
        document.addEventListener(eventType, playOnInteraction, { once: true });
      });
    };

    // Watch for changes in audio settings
    watch(audioEnabled, (newValue) => {
      if (audioElement.value) {
        if (newValue && userInteracted.value) {
          safePlay();
        } else if (!newValue) {
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

    // Pause audio when tab is not visible to save resources
    const handleVisibilityChange = () => {
      if (!audioElement.value) return;
      
      if (document.hidden) {
        if (!audioElement.value.paused) {
          audioElement.value.pause();
        }
      } else if (audioEnabled.value && userInteracted.value) {
        safePlay();
      }
    };

    onMounted(() => {
      if (audioElement.value) {
        audioElement.value.volume = audioVolume.value;
        
        // Try to autoplay if enabled
        if (audioEnabled.value) {
          safePlay();
          
          // If autoplay doesn't work, we'll need user interaction
          if (!userInteracted.value) {
            setupInteractionHandlers();
          }
        }
        
        // Add visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    });

    onUnmounted(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up any remaining event listeners
      ['click', 'touchstart', 'touchend', 'pointerdown'].forEach(eventType => {
        document.removeEventListener(eventType, () => {});
      });
    });

    return {
      audioElement,
      audioSrc: props.src
    };
  }
};
</script>