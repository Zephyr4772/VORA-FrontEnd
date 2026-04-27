/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        xai: {
          dark: '#1f2228',
          white: '#ffffff',
          surface: 'rgba(255, 255, 255, 0.03)',
          surfaceHover: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.1)',
          borderStrong: 'rgba(255, 255, 255, 0.2)',
          textSecondary: 'rgba(255, 255, 255, 0.7)',
          textMuted: 'rgba(255, 255, 255, 0.5)',
          textDisabled: 'rgba(255, 255, 255, 0.3)'
        }
      },
      fontFamily: {
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Roboto Mono', 'Menlo', 'Monaco', 'Liberation Mono', 'Courier New', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        geist: ['"Geist Mono"', 'ui-monospace', 'monospace'],
        inter: ['"Inter"', 'ui-sans-serif', 'sans-serif']
      },
      letterSpacing: {
        'xai-button': '1.4px',
        'xai-tag': '1px'
      },
      boxShadow: {
        none: 'none',
      }
    },
  },
  plugins: [],
};
