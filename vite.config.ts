import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Root of andershyattmusic.com. Do not deploy this until DNS points here.
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        planner: 'planner/index.html',
        pipeline: 'pipeline/index.html',
      },
    },
  },
})
