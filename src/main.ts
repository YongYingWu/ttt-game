import './assets/main.css'
import '@/style/common.scss'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'vant/lib/index.css'

const app = createApp(App)

app.use(router)

app.mount('#app')
