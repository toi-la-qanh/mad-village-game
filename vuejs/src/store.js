import { ref } from "vue";

export const authError = ref(null);
export const showSignUpForm = ref(false);
export const user = ref({
  name: null,
  id: null,
});
