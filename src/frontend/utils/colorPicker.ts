export interface HsvColor {
  readonly h: number;
  readonly s: number;
  readonly v: number;
}

export function hexToHsv(hex: string): HsvColor {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error('Invalid hex color');
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const difference = maximum - minimum;
  let hue = 0;

  if (difference > 0) {
    if (maximum === r) hue = ((g - b) / difference) % 6;
    else if (maximum === g) hue = (b - r) / difference + 2;
    else hue = (r - g) / difference + 4;
  }

  return {
    h: (hue * 60 + 360) % 360,
    s: maximum === 0 ? 0 : difference / maximum,
    v: maximum,
  };
}

export function hsvToHex({ h, s, v }: HsvColor): string {
  const hue = ((h % 360) + 360) % 360;
  const saturation = Math.max(0, Math.min(1, s));
  const brightness = Math.max(0, Math.min(1, v));
  const chroma = brightness * saturation;
  const secondary = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const minimum = brightness - chroma;
  const sectors = [
    [chroma, secondary, 0], [secondary, chroma, 0],
    [0, chroma, secondary], [0, secondary, chroma],
    [secondary, 0, chroma], [chroma, 0, secondary],
  ];
  const channels = sectors[Math.floor(hue / 60)] ?? [0, 0, 0];
  return '#' + channels.map(channel =>
    Math.round((channel + minimum) * 255).toString(16).padStart(2, '0'),
  ).join('').toUpperCase();
}
