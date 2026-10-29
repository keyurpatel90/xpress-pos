import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  // Button variants/sizes are assembled in code (btn-${variant}), so Tailwind cannot see them in the source
  safelist: ['btn-primary', 'btn-secondary', 'btn-ghost', 'btn-danger', 'btn-accent', 'btn-sm', 'btn-md', 'btn-lg', 'btn-glow'],
  theme: {
    extend: {
      colors: {
        // Slate-based text colours
        ink: { DEFAULT: '#0F172A', soft: '#334155', mute: '#64748B' },
        // Brand: vivid violet
        brand: {
          50: '#F8F0FF', 100: '#EEDDFF', 200: '#DDBBFF', 300: '#C88EFF', 400: '#AE5CFF',
          500: '#9B2DFF', 600: '#8800FF', 700: '#7000D6', 800: '#5A00AB', 900: '#3D0075',
        },
        field: '#F8FAFC',
        line: '#E2E8F0',
      },
      fontFamily: {
        display: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        slip: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        lift: '0 1px 2px rgba(15,23,42,.06), 0 12px 32px -14px rgba(15,23,42,.22)',
        glow: '0 10px 24px -8px rgba(136,0,255,.55)',
      },
    },
  },
  plugins: [],
};
export default config;
