import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/claude': {
        target: process.env.VITE_SUPABASE_URL + '/functions/v1/claude',
        changeOrigin: true,
        rewrite: () => '',
        headers: {
          Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        },
      },
    },
  },
});
