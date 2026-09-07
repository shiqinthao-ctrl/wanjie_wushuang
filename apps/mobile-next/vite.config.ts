import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/mobile-next/',
  plugins: [vue()],
  server: { port: 5178, strictPort: true },
  preview: { port: 4178, strictPort: true },
});
