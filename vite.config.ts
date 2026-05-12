import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 💡 public 폴더를 소스 폴더로 확실히 지정합니다.
  publicDir: 'public',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});