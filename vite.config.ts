import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { beasties } from 'vite-plugin-beasties';
import { imagetools } from 'vite-imagetools';


export default defineConfig({
  // Базовый путь для GitHub Pages
  // Замените 'my-vue-app' на имя вашего репозитория
  base: process.env.GITHUB_PAGES === 'true' ? '/my-vue-app/' : '/',
  plugins: [
    beasties({
      options: {
        preload: 'swap',
        inlineThreshold: 2048,
        pruneSource: false,
      },
    }),
    // Поддержка адаптивных изображений
    imagetools({
      // Можно кастомизировать
      removeMetadata: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (
              id.includes('three') ||
              id.includes('three/examples/jsm')
            ) {
              return 'three';
            }
            if (id.includes('postprocessing')) {
              return 'postprocessing';
            }
          }
        },
      },
       onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    // Сохраняем имена SVG файлов
    assetsDir: 'assets',
  },
  optimizeDeps: {
    include: ['three', 'postprocessing'],
  },
});
