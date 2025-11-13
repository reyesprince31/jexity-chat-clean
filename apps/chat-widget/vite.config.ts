import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import filesize from 'rollup-plugin-filesize';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  resolve: {
    alias: {
      'preact-render-to-string': resolve(__dirname, 'src/compat/preact-render-to-string.ts'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'ChatWidget',
      formats: ['es', 'umd'],
      fileName: (format) => `chat-widget.${format}.js`,
    },
    rollupOptions: {
      plugins: [
        filesize({
          showBrotliSize: true,
        }),
        visualizer({
          filename: resolve(__dirname, 'dist/chat-widget-stats.html'),
          template: 'treemap',
          gzipSize: true,
          brotliSize: true,
        }),
      ],
    },
  },
  server: {
    port: 3000,
  },
});
