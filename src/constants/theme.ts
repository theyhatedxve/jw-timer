// Proposed dark-theme tokens from docs/design_guidelines.md.
export const colors = {
  canvas: '#0D171D',
  surface: '#172830',
  text: '#F0F5F7',
  secondary: '#C0D0D6',
  brand: '#8BC8DC',
  onBrand: '#102530',
  border: '#5B727F',
  danger: '#FF9CA1',
  warning: '#F7CE7B',
  warningBackground: '#433218',
  disabled: '#82959D',
} as const;

export const spacing = {
  small: 8,
  medium: 16,
  large: 24,
} as const;

export const typography = {
  title: 28,
  heading: 20,
  body: 16,
  supporting: 14,
  bodyLineHeight: 24,
  navigationLineHeight: 20,
} as const;

export const dimensions = {
  minimumTouchTarget: 48,
  contentWidth: 640,
  navigationRailWidth: 220,
  navigationRailBreakpoint: 600,
  cardRadius: 16,
  buttonRadius: 10,
  borderWidth: 1,
} as const;