/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ← тема переключается классом .dark
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ----- Палитра «Нефть-зелёный» (Petrol) -----
      // Токены питаются из CSS-переменных в src/index.css и сами
      // переключаются между светлой и тёмной темой (.dark).
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink) / <alpha-value>)',
        // Бренд-хром: петроль в обеих темах (шапка и т.п.)
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-ink': 'rgb(var(--brand-ink) / <alpha-value>)',
        // Медный хайлайт — цены со скидкой, маркер торга, важные акценты
        copper: 'rgb(194 112 61 / <alpha-value>)',
        petrol: 'rgb(15 61 62 / <alpha-value>)',
        // Смысловые цвета зон маржи (несут смысл — не путать с оформлением)
        zone: {
          green: 'rgb(var(--zone-green) / <alpha-value>)',
          yellow: 'rgb(var(--zone-yellow) / <alpha-value>)',
          red: 'rgb(var(--zone-red) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Основной текст и подписи
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Заголовки и шапка
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        // Цифры — табличные моноширинные
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        // Многослойные мягкие тени (тонкая близкая + рассеянная дальняя)
        card: '0 1px 2px rgba(15,61,62,0.05), 0 4px 16px -8px rgba(15,61,62,0.12)',
        'card-hover': '0 2px 4px rgba(15,61,62,0.06), 0 12px 28px -10px rgba(15,61,62,0.20)',
        lift: '0 8px 30px -8px rgba(15,61,62,0.25), 0 2px 6px rgba(15,61,62,0.10)',
        sheet: '0 -8px 40px -12px rgba(0,0,0,0.45)',
        'cta-glow': '0 4px 14px -4px rgba(194,112,61,0.55), 0 0 0 1px rgba(194,112,61,0.10)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'toast-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.82)' },
        },
        flash: {
          '0%': { backgroundColor: 'var(--flash-color)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0.4,0,0.2,1)',
        'rise-in': 'rise-in 220ms cubic-bezier(0.4,0,0.2,1)',
        'sheet-up': 'sheet-up 260ms cubic-bezier(0.4,0,0.2,1)',
        'toast-up': 'toast-up 240ms cubic-bezier(0.4,0,0.2,1)',
        breathe: 'breathe 2s ease-in-out infinite',
        flash: 'flash 700ms ease-out',
      },
    },
  },
  plugins: [],
};
