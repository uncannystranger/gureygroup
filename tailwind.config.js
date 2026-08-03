/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3B82F6',
          indigo: '#6366F1',
          purple: '#8B5CF6',
          darkBg: '#0B0F17',
          darkCard: 'rgba(17, 24, 39, 0.65)',
          lightBg: '#EBF0F7',
          lightCard: 'rgba(255, 255, 255, 0.70)',
        }
      },
      borderRadius: {
        '3xl': '1.5rem',  // 24px
        '4xl': '2rem',    // 32px
        '5xl': '2.5rem',  // 40px
      },
      boxShadow: {
        'glass-light': '0 20px 40px -15px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 -1px 1px rgba(0, 0, 0, 0.03)',
        'glass-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.12), inset 0 -1px 1px rgba(0, 0, 0, 0.3)',
        'neumorph-light': '8px 8px 20px #d1d9e6, -8px -8px 20px #ffffff',
        'neumorph-dark': '6px 6px 16px #06080d, -6px -6px 16px #101622',
        'pill-glow': '0 0 25px rgba(99, 102, 241, 0.45)',
        'blue-glow': '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
        '3xl': '40px',
      }
    },
  },
  plugins: [],
}
