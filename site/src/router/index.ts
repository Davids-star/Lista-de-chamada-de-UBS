import { createRouter, createWebHistory } from 'vue-router'
import RetirarSenhaView from '@/views/RetirarSenhaView.vue'
import PainelView from '@/views/PainelView.vue'

/** Celular/tablet: tela de toque ou estreita. Notebook/desktop: ponteiro preciso e tela larga. */
function ehCelular(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Entrada do site: celular vai para a retirada de senha, notebook vai para o painel.
    { path: '/', redirect: () => (ehCelular() ? '/retirar-senha' : '/painel') },
    { path: '/retirar-senha', name: 'retirar-senha', component: RetirarSenhaView },
    { path: '/painel', name: 'painel', component: PainelView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
