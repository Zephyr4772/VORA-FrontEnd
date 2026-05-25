/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        input: 'var(--input)',
        ring: 'var(--ring)',
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
        },
        bg: {
          0: 'var(--bg-0)',
          100: 'var(--bg-100)',
          200: 'var(--bg-200)',
          300: 'var(--bg-300)',
        },
        text: {
          100: 'var(--text-100)',
          200: 'var(--text-200)',
          300: 'var(--text-300)',
          400: 'var(--text-400)',
          500: 'var(--text-500)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
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
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slideUpFade': {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up-fade': 'slideUpFade 0.5s ease-out forwards',
        'fade-in-delayed': 'fadeIn 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
};
