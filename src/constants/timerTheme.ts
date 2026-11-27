export const timerColors = {
  background: '#151515',
  surface: '#202020',
  selected: '#30383B',
  border: '#505050',
  text: '#F5F5F5',
  muted: '#C8C8C8',
  firstSection: '#5FD7EC',
  secondSection: '#FFE079',
  thirdSection: '#FFAA91',
  start: '#176B42',
  danger: '#A82F35',
  warning: '#FFE079',
  onControl: '#FFFFFF',
} as const;

export const timerLayout = {
  contentWidth: 1200,
  tableBreakpoint: 700,
  valueColumnWidth: 100,
} as const;

export const timerPresentation = {
  sessionBackground: '#16323B',
  sessionText: '#FFFFFF',
  sessionMuted: '#B8E8DE',
  sessionTrack: '#45656D',
  sessionOvertime: '#FFB4B8',
  sessionRadius: 28,
  sessionRestartBackground: '#B54D52',
  sessionControlHeight: 64,
  progressHeight: 10,
  minimumDigitScale: 0.3,
  runningBackground: timerColors.start,
  runningText: timerColors.onControl,
  restartBackground: timerColors.danger,
  restartText: timerColors.onControl,
} as const;
