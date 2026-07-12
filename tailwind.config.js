/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      colors: {
        brand: {
          // Primary — SmartzConnect Pink
          pink:    '#EC4899',
          rose:    '#FF2D78',
          blush:   '#FFB3D1',
          // Accent — SmartzConnect Red
          red:     '#DC2626',
          // Premium — SmartzConnect Gold
          gold:    '#D4AF37',
          // Secondary — Deep Purple (kept for app shell)
          purple:  '#9B5DE5',
          violet:  '#7C3AED',
          lavender:'#C4B5FD',
          // Neutrals
          dark:    '#0D0A14',
          darker:  '#080510',
          surface: '#130E1E',
          card:    '#1C1530',
          border:  '#2D2245',
          muted:   '#8B7AA8',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'love-gradient':   'linear-gradient(135deg, #FF4D8D 0%, #9B5DE5 100%)',
        'love-gradient2':  'linear-gradient(135deg, #FF2D78 0%, #7C3AED 100%)',
        'brand-gradient':  'linear-gradient(135deg, #EC4899 0%, #DC2626 100%)',
        'gold-gradient':   'linear-gradient(135deg, #D4AF37 0%, #EC4899 100%)',
        'dark-gradient':   'linear-gradient(135deg, #0D0A14 0%, #130E1E 50%, #1C1530 100%)',
        'hero-gradient':   'radial-gradient(ellipse at 60% 0%, rgba(236,72,153,0.18) 0%, transparent 55%), radial-gradient(ellipse at 0% 80%, rgba(220,38,38,0.10) 0%, transparent 50%)',
        'card-gradient':   'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(220,38,38,0.08) 100%)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-love':  'pulseLove 2s ease-in-out infinite',
        'slide-up':    'slideUp 0.6s ease-out',
        'fade-in':     'fadeIn 0.8s ease-out',
        'spin-slow':   'spin 8s linear infinite',
        'heartbeat':   'heartbeat 1.4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        pulseLove: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,77,141,0.4)' },
          '50%':      { boxShadow: '0 0 0 20px rgba(255,77,141,0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%':      { transform: 'scale(1.15)' },
          '28%':      { transform: 'scale(1)' },
          '42%':      { transform: 'scale(1.1)' },
          '70%':      { transform: 'scale(1)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
