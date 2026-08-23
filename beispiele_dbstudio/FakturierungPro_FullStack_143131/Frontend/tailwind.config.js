export default { 
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], 
  theme: { 
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: { 
          DEFAULT: '#3b82f6',
          dark: '#3b82f6'
        },
        secondary: '#1e293b',
        accent: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        dark: { background: '#0f172a' }
      },
      boxShadow: {
        'theme-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'theme-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'theme-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      },
      borderRadius: {
        'theme': '0.5rem'
      }
    } 
  }, 
  plugins: [] 
}