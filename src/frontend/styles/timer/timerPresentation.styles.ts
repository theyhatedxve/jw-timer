import { StyleSheet } from 'react-native';

import {
  dimensions,
  spacing,
} from '../../../constants/theme';

import {
  timerLayout,
  timerPresentation,
} from '../../../constants/timerTheme';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: timerLayout.contentWidth,
    alignSelf: 'center',
    padding: spacing.medium,
    paddingBottom: spacing.large,
  },
  fullscreenContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  digits: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  progressTrack: {
    height: timerPresentation.progressHeight,
    borderRadius: dimensions.cardRadius,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: dimensions.cardRadius,
  },
});
