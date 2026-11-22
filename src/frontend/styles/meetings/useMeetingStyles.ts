import { useMemo } from 'react';

import { useAppTheme } from '../../context/AppearanceContext';
import { createMeetingStyles } from './meetings.styles';

export function useMeetingStyles() {
  const { palette } = useAppTheme();

  return useMemo(() => createMeetingStyles(palette), [palette]);
}
