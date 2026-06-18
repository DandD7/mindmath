export const Colors = {
  // Primary palette - Tech-Noir
  primary: '#00F5FF', // Electric Cyan
  primaryDim: '#00B8D4', // Dimmed Cyan
  accent: '#8B5CF6', // Neon Violet
  accentDim: '#6D28D9', // Dimmed Violet

  // Backgrounds
  background: '#0A0E17', // Deep Space Navy
  backgroundLight: '#0F1520', // Slightly lighter navy
  surface: '#141B2D', // Card/Surface background
  card: 'rgba(20, 27, 45, 0.7)', // Glassmorphism card
  cardSolid: '#141B2D', // Solid card background

  // Feedback
  correct: '#00F5A0', // Neon Green
  incorrect: '#FF4E6A', // Neon Red/Pink

  // Text
  text: '#FFFFFF', // Crisp white
  textSecondary: '#B4BCD0', // Silver-grey
  textLight: '#6B7A99', // Muted blue-grey

  // Borders & Dividers
  border: 'rgba(0, 245, 255, 0.15)', // Cyan tinted border
  borderLight: 'rgba(139, 92, 246, 0.1)', // Violet tinted border

  // Glow effects
  glowCyan: 'rgba(0, 245, 255, 0.4)',
  glowViolet: 'rgba(139, 92, 246, 0.4)',
  glowCorrect: 'rgba(0, 245, 160, 0.4)',
  glowIncorrect: 'rgba(255, 78, 106, 0.3)',

  // Glassmorphism
  glass: 'rgba(20, 27, 45, 0.6)',
  glassBorder: 'rgba(0, 245, 255, 0.12)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Fonts = {
  mono: 'monospace' as const,
  system: 'System' as const,
  display: 'System' as const, // Clean sans-serif for headings
};

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 1.2,
  wider: 2.5,
  widest: 4,
};

export const Shadows = {
  small: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  glowViolet: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
};
