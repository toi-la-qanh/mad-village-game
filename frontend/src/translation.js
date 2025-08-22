import { createI18n } from 'vue-i18n'

// Import JSON translations
import en from './locales/en.json'
import vi from './locales/vi.json'
const messages = {
  en,
  vi,
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,          
  locale: sessionStorage.getItem("language") || "vi",           
  fallbackLocale: 'vi',
  messages,
})

export default i18n
