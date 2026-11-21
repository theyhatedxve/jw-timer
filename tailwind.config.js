/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: {
          canvas: 'var(--app-canvas)',
          surface: 'var(--app-surface)',
          text: 'var(--app-text)',
          secondary: 'var(--app-secondary)',
          brand: 'var(--app-brand)',
          onBrand: 'var(--app-on-brand)',
          border: 'var(--app-border)',
          danger: 'var(--app-danger)',
        },
        preview: {
          canvas: 'var(--preview-canvas)',
          surface: 'var(--preview-surface)',
          text: 'var(--preview-text)',
          secondary: 'var(--preview-secondary)',
          brand: 'var(--preview-brand)',
          onBrand: 'var(--preview-on-brand)',
          border: 'var(--preview-border)',
        },
      },
      spacing: {
        'app-small': '8px',
        'app-medium': '16px',
        'app-large': '24px',
        'preview-gap': '16px',
        'preview-outer': '24px',
      },
      borderRadius: {
        'app-card': '16px',
        'app-button': '10px',
        'preview-card': '16px',
        'preview-button': '10px',
      },
      minHeight: {
        'app-touch': '48px',
        'preview-touch': '48px',
      },
      minWidth: {
        'app-touch': '48px',
        'preview-touch': '48px',
        'app-stat': '96px',
      },
      maxWidth: {
        'app-content': '640px',
        'preview-content': '640px',
      },
      fontSize: {
        'app-title': '28px',
        'app-body': '16px',
        'preview-title': '28px',
        'preview-body': '16px',
      },
    },
  },
  plugins: [],
};
