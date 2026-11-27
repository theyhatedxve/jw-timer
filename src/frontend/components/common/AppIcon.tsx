import Svg, { Path } from 'react-native-svg';

const paths = {
  close: 'M6 6l12 12M18 6 6 18',
  chevronLeft: 'M15 5l-7 7 7 7',
  chevronRight: 'M9 5l7 7-7 7',
  target: 'M12 2v4M12 18v4M2 12h4M18 12h4M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  document: 'M6 2h8l4 4v16H6ZM14 2v5h4M9 12h6M9 16h6',
  fullscreen: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  exitFullscreen: 'M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 4v16M4 12h16',
  play: 'M8 5v14l11-7Z',
  pause: 'M8 5v14M16 5v14',
  restart: 'M3 11a9 9 0 1 1 2 7M3 5v6h6',
  previousPart: 'M19 5v14L9 12ZM5 5v14',
  nextPart: 'M5 5v14l10-7ZM19 5v14',
  song: 'M9 18V5l12-2v13M9 7l12-2M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0ZM21 16a3 2 0 1 1-6 0 3 2 0 0 1 6 0Z',
  comments: 'M4 4h16v12H9l-5 4V4ZM8 8h8M8 12h6',
  book: 'M12 6c-3-3-6-3-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-1-10 2Zm0 0v15',
  heart: 'M12 21 4 13C-2 7 6 1 12 7c6-6 14 0 8 6l-8 8Z',
  list: 'M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12',
  microphone:
    'M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0V5ZM5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8',
  speaker:
    'M11 5 6 9H2v6h4l5 4V5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',
  laptop:
    'M4 3h16v13H4V3ZM2 20h20l-2-4H4l-2 4Z',
  microphoneAdjuster:
    'M10 2h4v8h-4V2ZM7 8v2a5 5 0 0 0 10 0V8M12 15v6M7 21h10M18 13l3 3M18 16l3-3',
  home:
    'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  meetings:
    'M7 3v4M17 3v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  assignments:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  timer:
    'M9 2h6M12 2v3M19 5l2 2M12 9v5l3 2M21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  moon: 'M20 15a8 8 0 0 1-11-11A8 8 0 1 0 20 15Z',
  globe: 'M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0ZM2 12h20M12 2c5 5 5 15 0 20-5-5-5-15 0-20Z',
  database: 'M4 6c0-4 16-4 16 0s-16 4-16 0Zm0 0v12c0 4 16 4 16 0V6M4 12c0 4 16 4 16 0',
  settings:
    'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
} as const;

export type AppIconName = keyof typeof paths;

export default function AppIcon({
  name,
  color,
  size,
}: {
  readonly name: AppIconName;
  readonly color: string;
  readonly size: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      <Path d={paths[name]} />
    </Svg>
  );
}
