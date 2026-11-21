import Svg, { Path } from 'react-native-svg';

const paths = {
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
