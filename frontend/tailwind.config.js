/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#0d2149', 700: '#123063', 900: '#081633' },
        brandred:  { DEFAULT: '#e2001a', dark: '#b10014' },
        brandblue: { DEFAULT: '#0a5bd3', light: '#2b7ae4' },
        ink:    '#17202e',
        muted:  '#6b7688',
        line:   '#e2e7f0',
        page:   '#eef1f7',
        okgreen:'#1f9d55',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 6px 22px rgba(13,33,73,0.10)',
        cardlg: '0 14px 40px rgba(13,33,73,0.18)',
        glow: '0 0 60px rgba(43,122,228,0.35)',
      },
      backgroundImage: {
        grid: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 39h40M39 0v40' stroke='%23ffffff' stroke-opacity='.05'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        pop:  { '0%': { transform: 'translateY(14px)', opacity: '0' }, '100%': { transform: 'none', opacity: '1' } },
        spinslow: { to: { transform: 'rotate(360deg)' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      animation: {
        pop: 'pop .18s ease',
        spinslow: 'spinslow 26s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
