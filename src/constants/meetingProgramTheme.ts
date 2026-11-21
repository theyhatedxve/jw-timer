import type { AppPalette } from './appearanceTheme';

type Tone = 'treasures' | 'ministry' | 'living';

interface SectionColors {
  readonly background: string;
  readonly border: string;
  readonly text: string;
}

const names: Record<Tone, readonly string[]> = {
  treasures: [
    "TREASURES FROM GOD'S WORD",
    'MGA BAHANDI TIKANG HA PULONG HAN DIOS',
  ],
  ministry: [
    'APPLY YOURSELF TO THE FIELD MINISTRY',
    'MAGIN MAS EPEKTIBO HA MINISTERYO',
  ],
  living: [
    'LIVING AS CHRISTIANS',
    'PAGKINABUHI SUGAD NGA MGA KRISTIANO',
  ],
};

const tones = ['treasures', 'ministry', 'living'] as const;

const palettes: Record<'light' | 'dark', Record<Tone, SectionColors>> = {
  dark: {
    treasures: {
      background: '#073C40',
      border: '#168A90',
      text: '#F0F5F7',
    },
    ministry: {
      background: '#493400',
      border: '#B38719',
      text: '#FFF5D6',
    },
    living: {
      background: '#4D1720',
      border: '#C45B6B',
      text: '#FFF0F2',
    },
  },
  light: {
    treasures: {
      background: '#E0F2F3',
      border: '#16777D',
      text: '#103C40',
    },
    ministry: {
      background: '#FFF0C2',
      border: '#8B6400',
      text: '#503800',
    },
    living: {
      background: '#FBE5E9',
      border: '#A63D50',
      text: '#651D2A',
    },
  },
};

export function sectionTone(title: string): Tone | 'neutral' {
  const normalized = title
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .toUpperCase();

  return tones.find(tone => names[tone].includes(normalized)) ?? 'neutral';
}

export function sectionColors(
  title: string,
  theme: 'light' | 'dark',
  palette: AppPalette,
): SectionColors {
  const tone = sectionTone(title);

  return tone === 'neutral'
    ? {
        background: palette.surface,
        border: palette.border,
        text: palette.text,
      }
    : palettes[theme][tone];
}
