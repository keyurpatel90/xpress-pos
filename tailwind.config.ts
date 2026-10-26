import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#14251F', soft: '#3A4D45', mute: '#66766F' },
        pine: {
          50: '#EAF5F1', 100: '#CFE8DF', 200: '#9FD1C0', 400: '#3FA386',
          500: '#12896A', 600: '#0E6B52', 700: '#0B5441', 800: '#083D30', 900: '#062A21',
        },
        chili: { 50: '#FDEDEA', 100: '#FAD3CB', 500: '#E8452C', 600: '#C93A24' },
        turmeric: { 50: '#FFF7DC', 100: '#FDEBB0', 400: '#F5C242', 600: '#A67A00' },
        field: '#EEF2EF',
        line: '#D9E1DC',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Figtree Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        slip: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        lift: '0 1px 2px rgba(20,37,31,.06), 0 8px 24px -12px rgba(20,37,31,.18)',
      },
    },
  },
  plugins: [],
};
export default config;
