import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
// import { TroisJSVuePlugin } from 'troisjs';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
// app.use(TroisJSVuePlugin);
app.use(router)

app.mount('#app')
