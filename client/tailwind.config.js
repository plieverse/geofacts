/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#15202B',
        panel: '#1E2A35',
        accent: '#1D8CD7',
        'accent-light': '#4AA3E0',
        'text-primary': '#E7E9EA',
        'text-secondary': '#8899A6',
        divider: '#2F3336',
        heart: '#F91880',
        success: '#00BA7C',
      },
    },
  },
  plugins: [],
};
