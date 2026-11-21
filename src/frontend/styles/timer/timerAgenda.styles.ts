import { StyleSheet } from 'react-native';

import {
  dimensions,
  spacing,
  typography,
} from '../../../constants/theme';

import {
  timerColors as colors,
  timerLayout,
} from '../../../constants/timerTheme';

const sectionColors = [
  colors.firstSection,
  colors.secondSection,
  colors.thirdSection,
] as const;

export function sectionColor(index: number): string {
  return sectionColors[index % sectionColors.length]
    ?? colors.text;
}

export function digitSize(fontSize: number) {
  return { fontSize };
}

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: timerLayout.contentWidth,
    alignSelf: 'center',
    padding: spacing.medium,
    paddingBottom: spacing.large,
  },
  header: {
    gap: spacing.medium,
    marginBottom: spacing.medium,
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.small,
  },
  titleBlock: {
    flexGrow: 1,
    flexBasis: 220,
    gap: spacing.small,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  heading: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  text: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  muted: {
    color: colors.muted,
    fontSize: typography.supporting,
    lineHeight: typography.bodyLineHeight,
  },
  clockBox: {
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderRadius: dimensions.buttonRadius,
    gap: spacing.small,
  },
  clock: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  currentCard: {
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.cardRadius,
    gap: spacing.small,
  },
  currentDigits: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  overtime: {
    color: colors.thirdSection,
  },
  notice: {
    padding: spacing.medium,
    borderWidth: dimensions.borderWidth,
    borderColor: colors.warning,
    borderRadius: dimensions.buttonRadius,
    gap: spacing.small,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.small,
    borderBottomWidth: dimensions.borderWidth,
    borderBottomColor: colors.border,
  },
  flexible: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeader: {
    padding: spacing.small,
    marginTop: spacing.medium,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    fontSize: typography.body,
    fontWeight: '700',
  },
  agendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    padding: spacing.small,
    minHeight: dimensions.minimumTouchTarget,
    borderBottomWidth: dimensions.borderWidth,
    borderBottomColor: colors.border,
  },
  compactRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  selectedRow: {
    backgroundColor: colors.selected,
  },
  rowValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.small,
  },
  valueColumn: {
    width: timerLayout.valueColumnWidth,
    flexShrink: 0,
    alignItems: 'center',
  },
  number: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  menu: {
    minWidth: dimensions.minimumTouchTarget,
    minHeight: dimensions.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGlyph: {
    color: colors.text,
    fontSize: typography.title,
  },
  footer: {
    padding: spacing.medium,
    gap: spacing.small,
    backgroundColor: colors.surface,
    borderTopWidth: dimensions.borderWidth,
    borderTopColor: colors.border,
  },
  control: {
    flexGrow: 1,
    flexBasis: 130,
    minHeight: dimensions.minimumTouchTarget,
    padding: spacing.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: dimensions.buttonRadius,
    backgroundColor: colors.selected,
  },
  startControl: {
    backgroundColor: colors.start,
  },
  restartControl: {
    backgroundColor: colors.danger,
  },
  controlLabel: {
    color: colors.onControl,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  fullscreenContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.large,
    gap: spacing.large,
  },
  fullscreenDigits: {
    color: colors.text,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});