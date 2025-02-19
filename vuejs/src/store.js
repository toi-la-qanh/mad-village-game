import { ref } from "vue";

export const authError = ref(null);
export const showSignUpForm = ref(false);
export const user = ref({
  name: null,
  id: null,
});
export const showBackground = ref(true);
export const roomID = ref(localStorage.getItem('roomID') || null);
export const gameID = ref(localStorage.getItem('gameID') || null);
export const errorMessages = ref(null);
export const isLoading = ref(false);