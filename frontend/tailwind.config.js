/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          light: '#2a5080',
          dark: '#142840',
        },
        accent: {
          DEFAULT: '#00bcd4',
          light: '#4dd0e1',
          dark: '#0097a7',
        },
        success: '#4caf50',
        danger: '#ff4d4d',
        warning: '#ff6b6b',
        'dark-bg': '#0d1b2a',
        'dark-card': '#162739',
        'dark-border': '#1e3347',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(0,0,0,0.08)',
        'card-hover': '0 4px 20px 0 rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
