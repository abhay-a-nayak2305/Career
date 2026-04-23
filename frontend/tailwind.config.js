/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          400: '#00fff0',
          500: '#00d4c8',
        },
        fuchsia: {
          500: '#ff00ff',
        },
        gold: {
          400: '#ffd400',
        },
        green: {
          400: '#00ff88',
        },
        red: {
          400: '#ff4444',
        },
        orange: {
          400: '#ff8800',
        },
        dark: {
          900: '#050508',
          800: '#0d0d14',
          700: '#151520',
          600: '#1a1a28',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'orbFloat1 30s ease-in-out infinite',
        'float-slow': 'orbFloat2 35s ease-in-out infinite',
        'float-slower': 'orbFloat3 40s ease-in-out infinite',
        'gradient-rotate': 'gradientRotate 6s linear infinite',
        'pulse-critical': 'pulseCritical 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'micro-bounce': 'microBounce 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'grid-float': 'gridFloat 60s linear infinite',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(0, 255, 240, 0.08)',
        'glow-strong': '0 0 60px rgba(0, 255, 240, 0.15)',
        'glow-green': '0 0 40px rgba(0, 255, 136, 0.15)',
        'glow-red': '0 0 40px rgba(255, 68, 68, 0.15)',
      },
      transitionTimingFunction: {
        'elastic': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
