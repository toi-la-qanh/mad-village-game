import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/router';  

const app = createApp(App);

// Use the router
app.use(router);

// Mount the app
app.mount('#app');
