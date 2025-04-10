import { ref } from "vue";

export const authError = ref(null);
export const showSignUpForm = ref(false);
export const user = ref({
  name: null,
  id: null,
});
export const showBackground = ref(true);
export const roomID = ref(null);
export const errorMessages = ref(null);
export const isLoading = ref(false);