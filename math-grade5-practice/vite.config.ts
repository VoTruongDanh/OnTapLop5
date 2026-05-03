import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// Plugin to copy 404.html to dist
function copy404Plugin() {
  return {
    name: 'copy-404',
    writeBundle() {
      const src = path.join(__dirname, 'public', '404.html')
      const dest = path.join(__dirname, 'dist', '404.html')
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), copy404Plugin()],
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3000'),
    strictPort: true,
    allowedHosts: ['toanlop5.up.railway.app'],
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
  },
})
