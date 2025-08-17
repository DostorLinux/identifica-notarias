// Theme configuration following identifica.ai brand guidelines

export const colors = {
  // Primary colors
  primary: {
    purple: '#A63089',
    purpleDark: '#662483',
    green: '#3AAA35',
    gray: '#575756',
  },
  
  // Extended palette
  extended: {
    red: '#B32C32',
    redLight: '#BD2E67',
    purpleLight: '#8A4493',
    purpleMedium: '#902763',
    purpleBright: '#913189',
    blue: '#392B85',
    greenLight: '#3BB186',
    greenBright: '#6CB53A',
    greenYellow: '#89B630',
    brown: '#67584C',
    grayLight: '#6F6D63',
    grayDark: '#59595E',
  },
  
  // Gradients
  gradients: {
    purple: ['#662483', '#A63089'],
    green: ['#3AAA35', '#6CB53A'],
    mixed: ['#662483', '#A63089', '#3AAA35'],
  },
  
  // Common colors
  white: '#FFFFFF',
  black: '#000000',
  error: '#B32C32',
  success: '#3AAA35',
  warning: '#89B630',
  info: '#392B85',
  
  // Backgrounds
  background: {
    light: '#F5F5F5',
    dark: '#1A1A1A',
    card: '#FFFFFF',
  },
  
  // Text colors
  text: {
    primary: '#575756',
    secondary: '#6F6D63',
    light: '#FFFFFF',
    disabled: '#A0A0A0',
  },
};

export const typography = {
  fontFamily: {
    primary: 'System', // Will be replaced with Museo Sans when available
    secondary: 'System', // Will be replaced with Open Sans
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    bold: '700',
    black: '900',
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
