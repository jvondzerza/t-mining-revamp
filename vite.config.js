import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed to GitHub Pages under https://<user>.github.io/t-mining-revamp/, so
// production assets need that repo subpath as their base. Dev stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/t-mining-revamp/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}))
