import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // GitHub Pages base path — update to match your repository name
  // For local development or root deployment, use '/'
  base: '/vedanshi/',

  // Dev server: set COOP/COEP headers for cross-origin isolation
  // This enables SharedArrayBuffer which is needed for synchronous input()
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },

  // Preview server: same headers for `npm run preview`
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },

  // Ensure the worker is bundled correctly
  worker: {
    format: 'iife',
  },
})
