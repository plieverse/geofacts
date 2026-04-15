/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:               'rgb(var(--color-bg) / <alpha-value>)',
        panel:            'rgb(var(--color-panel) / <alpha-value>)',
        accent:           '#1D8CD7',
        'accent-light':   '#4AA3E0',
        'text-primary':   'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        divider:          'rgb(var(--color-divider) / <alpha-value>)',
        // hover-surface: wit in donkere modus, zwart in lichte modus
        // gebruik als: hover:bg-hover-surface/5  border-hover-surface/20  etc.
        'hover-surface':  'rgb(var(--color-hover-surface) / <alpha-value>)',
        heart:    '#F91880',
        success:  '#00BA7C',
      },
    },
  },
  plugins: [],
};
