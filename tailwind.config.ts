import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Hebrew"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"IBM Plex Sans Hebrew"', 'monospace'],
      },
      colors: {
        // צבעי תחומים
        domain: {
          biology: '#2D6A4F',
          society: '#1D3557',
          sport: '#E63946',
          city: '#457B9D',
          culture: '#6A0572',
          economy: '#F4A261',
          psychology: '#6B4226',
          technology: '#0077B6',
          physics: '#023E8A',
          evolution: '#40916C',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
