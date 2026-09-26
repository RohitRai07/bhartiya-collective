/**
 * Centralized Theme & Styling Tokens
 * Facilitates visual customization without modifying component JSX
 */
export const themeConfig = {
  palette: {
    primary: {
      main: '#D97706',       // Warm Indian Saffron / Kesar
      light: '#FDE68A',
      dark: '#B45309',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1E293B',       // Deep Indic Indigo / Midnight
      light: '#334155',
      dark: '#0F172A',
      contrastText: '#FFFFFF',
    },
    accent: {
      terracotta: '#9A3412', // Rich terracotta brick
      gold: '#CA8A04',       // Classical gold
      emerald: '#047857',    // Vedic forest green
    },
    neutral: {
      background: '#FAF8F5', // Soft parchment
      surface: '#FFFFFF',
      surfaceAlt: '#F5EFE6',
      border: '#E2E8F0',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
    }
  },
  typography: {
    headings: 'Georgia, "Times New Roman", serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  }
} as const;

export type ThemeConfig = typeof themeConfig;
