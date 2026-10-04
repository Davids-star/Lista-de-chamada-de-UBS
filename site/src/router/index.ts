import { createRouter, createWebHistory } from 'vue-router'
import RetirarSenhaView from '@/views/RetirarSenhaView.vue'
import PainelView from '@/views/PainelView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'retirar-senha', component: RetirarSenhaView },
    { path: '/painel', name: 'painel', component: PainelView },
  ],
})
