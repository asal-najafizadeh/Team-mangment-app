import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite به صورت پیش‌فرض از history API fallback پشتیبانی می‌کند
  // اما برای اطمینان، می‌توانیم به صورت صریح تنظیم کنیم
  build: {
    // برای production build
    rollupOptions: {
      // اطمینان حاصل کنید که index.html به درستی ساخته می‌شود
    },
  },
})
