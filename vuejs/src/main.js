import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/router';  
import { socket, state } from './socket';

const app = createApp(App);

// Use the router
app.use(router);

// Optionally make socket globally available
app.config.globalProperties.$socket = socket;
app.config.globalProperties.$socketState = state;

// Mount the app
app.mount('#app');
