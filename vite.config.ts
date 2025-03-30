import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Or '/' if deploying at root
  build: {
    outDir: 'dist'
  }
});