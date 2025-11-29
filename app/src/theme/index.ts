// Ultra-minimalist design system - professional, not AI-generated
export const colors = {
  // Core palette - reduced to essentials
  black: '#0A0A0A',
  white: '#FFFFFF',
  
  // Refined grayscale - fewer steps
  gray100: '#FAFAFA',
  gray200: '#F0F0F0',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#757575',
  gray600: '#424242',
  gray700: '#212121',
  
  // Single accent - understated
  accent: '#2563EB', // Refined blue
  accentLight: '#EFF6FF',
  
  // Extended color palette for UI elements
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  green: '#059669',
  greenLight: '#D1FAE5',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  red: '#DC2626',
  redLight: '#FEE2E2',
  
  // Status colors - minimal set
  error: '#DC2626',
  errorLight: '#FEE2E2',
  success: '#059669',
  successLight: '#D1FAE5',
  
  // Semantic usage
  background: '#FFFFFF',
  backgroundSecondary: '#FAFAFA',
  surface: '#FAFAFA',
  surfaceHover: '#F0F0F0',
  
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#BDBDBD',
  
  text: '#0A0A0A',
  textSecondary: '#424242',
  textTertiary: '#757575',
  textDisabled: '#BDBDBD',
  
  overlay: 'rgba(10, 10, 10, 0.4)',
};

// Subtle shadows - barely visible
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Minimal radius
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  // Font families
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  
  // Font sizes - rationalized
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },
  
  // Font weights - fewer options
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.3,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const layout = {
  // Screen padding
  screenPadding: 20,
  screenPaddingSmall: 16,
  
  // Component heights
  bottomNavHeight: 56,
  headerHeight: 52,
  inputHeight: 44,
  buttonHeight: 44,
  
  // Quick action cards
  quickActionCardHeight: 72,
  quickActionCardGap: 12,
  
  // Threat cards
  threatCardWidth: 280,
  threatCardHeight: 100,
  
  // History items
  historyItemHeight: 68,
  
  // Setting rows
  settingRowHeight: 52,
  
  // Spacing
  sectionGap: 24,
  itemGap: 8,
};

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  layout,
};

export type Theme = typeof theme;
