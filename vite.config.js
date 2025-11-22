import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  },
  // 添加以下配置
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
})