import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import filesize from 'rollup-plugin-filesize';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'ChatWidget',
      formats: ['es', 'umd'],
      fileName: (format) => `chat-widget.${format}.js`,
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: ['react', 'react-dom'],
      output: {
        // Global vars to use in UMD build for externalized deps
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
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
