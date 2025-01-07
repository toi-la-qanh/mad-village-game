<script setup>
import BackGround from "./layouts/BackGround.vue";
import SignUpForm from "./components/SignUpForm.vue";
import { showSignUpForm, authError } from "./store";
console.log(authError.value);
console.log(showSignUpForm.value);
</script>

<template>
  <BackGround :class="{'opacity-80': showSignUpForm}"/>
  <router-view :class="{'opacity-90': showSignUpForm}"/>
  <SignUpForm v-if="showSignUpForm" />
</template>

<style scoped></style>
