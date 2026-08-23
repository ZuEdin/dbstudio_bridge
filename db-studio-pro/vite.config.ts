import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 5000,
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: env.DISABLE_HMR === 'true' ? false : undefined,
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
