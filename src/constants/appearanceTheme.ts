import { colors as legacyColors } from './theme';

export type AppPalette = Record<keyof typeof legacyColors, string>;

export const appearancePalettes: Record<'light' | 'dark', AppPalette> = {
  dark: {
    ...legacyColors,
    canvas: '#101719',
    surface: '#1D2528',
    brand: '#00C2C7',
    onBrand: '#042E30',
  },
  light: {
    canvas: '#F5F7F8',
    surface: '#FFFFFF',
    text: '#172A34',
    secondary: '#425A65',
    brand: '#006C70',
    onBrand: '#FFFFFF',
    border: '#AABAC2',
    danger: '#A12A30',
    warning: '#7C4A00',
    warningBackground: '#FFF2D6',
    disabled: '#61717A',
  },
};
