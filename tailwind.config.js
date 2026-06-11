/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f2244',
          50:  '#e8eef7',
          100: '#c5d4eb',
          200: '#9eb9dc',
          300: '#769dcd',
          400: '#5487c2',
          500: '#3372b7',
          600: '#2a5d9e',
          700: '#1e4580',
          800: '#142f5e',
          900: '#0f2244',
          950: '#091830',
        },
        brand: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark:  '#1d4ed8',
        },
        mute: {
          DEFAULT: '#64748b',
          light:  '#94a3b8',
          dark:   '#475569',
        },
        haze: {
          DEFAULT: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 8px 30px rgba(15, 34, 68, 0.12)',
        'lift-lg': '0 16px 48px rgba(15, 34, 68, 0.18)',
        card: '0 1px 4px rgba(15, 34, 68, 0.06)',
      },
      backgroundImage: {
        'molecule-grid':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23ffffff' fill-opacity='0.04'/%3E%3Ccircle cx='0' cy='0' r='1.5' fill='%23ffffff' fill-opacity='0.04'/%3E%3Ccircle cx='60' cy='0' r='1.5' fill='%23ffffff' fill-opacity='0.04'/%3E%3Ccircle cx='0' cy='60' r='1.5' fill='%23ffffff' fill-opacity='0.04'/%3E%3Ccircle cx='60' cy='60' r='1.5' fill='%23ffffff' fill-opacity='0.04'/%3E%3Cline x1='0' y1='0' x2='60' y2='60' stroke='%23ffffff' stroke-opacity='0.02' stroke-width='0.5'/%3E%3Cline x1='60' y1='0' x2='0' y2='60' stroke='%23ffffff' stroke-opacity='0.02' stroke-width='0.5'/%3E%3C/svg%3E\")",
      },
      animation: {
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':  'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
