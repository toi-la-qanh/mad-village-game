<template>
  <div class="absolute top-0 right-0 z-100">
    <select :key="locale" v-model="locale" @change="changeLanguage">
      <option value="en">English</option>
      <option value="vi">Tiếng Việt</option>
    </select>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import i18n from "../translation"; 

export default {
  setup() {
    const locale = ref(i18n.global.locale.value);

    const changeLanguage = (event) => {
      const newLocale = event.target.value;
      locale.value = newLocale;
      i18n.global.locale.value = newLocale;
      sessionStorage.clear();
      sessionStorage.setItem("language", newLocale);
      window.location.reload();
    };

    onMounted(() => {
      sessionStorage.setItem("language", i18n.global.locale.value);
    });

    return {
      locale,
      changeLanguage,
    };
  },
};
</script>
