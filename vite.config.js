import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // Expõe o dev server na rede local (mostra o IP no terminal ao rodar `npm run dev`)
    host: true,
  },
})
