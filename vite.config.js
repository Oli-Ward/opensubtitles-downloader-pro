import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// API Key embedding plugin (similar to uploader)
const apiKeyPlugin = () => {
  return {
    name: 'api-key-plugin',
    config(config, { command }) {
      if (command === 'build') {
        config.define = {
          ...config.define,
          'process.env.VITE_OPENSUBTITLES_API_KEY': JSON.stringify(process.env.VITE_OPENSUBTITLES_API_KEY || '')
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), apiKeyPlugin()],
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['crypto-js', 'guessit-js']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})