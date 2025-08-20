import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: set base to your repo name when deploying on GitHub Pages,
// e.g. '/hyflowdashboard/' if your repo is github.com/<you>/hyflowdashboard
export default defineConfig({
  plugins: [react()],
  base: '/hyflowdashboard/',
})
