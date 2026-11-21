import { vars } from 'nativewind';

import { colors } from '../../../constants/theme';

export const nativewindPreviewThemes = {
  dark: vars({
    '--preview-canvas': colors.canvas,
    '--preview-surface': colors.surface,
    '--preview-text': colors.text,
    '--preview-secondary': colors.secondary,
    '--preview-brand': colors.brand,
    '--preview-on-brand': colors.onBrand,
    '--preview-border': colors.border,
  }),
  light: vars({
    '--preview-canvas': '#F5F7F8',
    '--preview-surface': '#FFFFFF',
    '--preview-text': '#172A34',
    '--preview-secondary': '#425A65',
    '--preview-brand': '#1C5D75',
    '--preview-on-brand': '#FFFFFF',
    '--preview-border': '#AABAC2',
  }),
} as const;
