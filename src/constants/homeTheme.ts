// Home-only colors from the approved meeting-overview reference.
const hero = {
  hero: '#16323B',
  heroText: '#FFFFFF',
  mint: '#B8E8DE',
  badge: '#00757A',
  divider: '#526E73',
} as const;

export const homeTheme = {
  light: { ...hero, soft: '#DDF3EB', accent: '#006C70' },
  dark: { ...hero, soft: '#173D38', accent: '#9DE1D5' },
  heroRadius: 28,
  cardRadius: 20,
} as const;
