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
    {
      path: '/testA',
      name: 'testA',
      component: () => import('@/views/TestA/index.vue'),
    }
  ],
})

export default router
