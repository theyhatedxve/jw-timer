import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dimensions, spacing, typography } from '../../constants/theme';
import { useAppTheme } from '../context/AppearanceContext';
import { styles } from '../styles/navigation/tabs.styles';

export function useTabLayout() {
  const { palette } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const useRail = width >= dimensions.navigationRailBreakpoint;
  const height = typography.navigationLineHeight * fontScale * 3 +
    spacing.large + spacing.medium + insets.bottom;
  const barStyle = useMemo(() => [
    styles.bar,
    { backgroundColor: palette.surface, borderColor: palette.border },
    useRail ? { width: dimensions.navigationRailWidth } : { height },
  ], [height, palette.surface, palette.border, useRail]);

  return { useRail, barStyle };
}
