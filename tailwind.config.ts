import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coeka: {
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          gold: {
            50: '#fefce8',
            100: '#fef9c3',
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207',
          },
          navy: {
            800: '#0f172a',
            900: '#020617',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
