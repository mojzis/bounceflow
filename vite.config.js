import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/bounceflow/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    commonjsOptions: {
      include: [/matter-js/, /node_modules/],
    },
  },
  optimizeDeps: {
    include: ['matter-js'],
  },
});
