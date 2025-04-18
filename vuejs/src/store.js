import { ref } from "vue";

export const authError = ref(null);
export const showSignUpForm = ref(false);
export const user = ref({
  name: null,
  id: null,
});
export const showBackground = ref(true);
export const roomID = ref(null);
export const gameID = ref(null);
export const errorMessages = ref(null);
export const isLoading = ref(false);
// Audio settings
export const audioEnabled = ref(true);
export const audioVolume = ref(0.5); // Value between 0-1