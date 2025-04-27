import { createRouter, createWebHistory } from 'vue-router'
import Community from '@/views/Community/index.vue'

const router = createRouter({
  history: createWebHistory('/leyuan'),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: Community,
    },
  ],
})

export default router
