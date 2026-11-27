import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { dimensions, spacing, typography } from '../../../constants/theme';
import { useAppTheme } from '../../context/AppearanceContext';

export function useProfileStyles() {
  const { palette } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    fill: { flex: 1 },
    screen: { flex: 1, backgroundColor: palette.canvas },
    scroll: { flexGrow: 1, paddingBottom: spacing.large },
    content: { width: '100%', maxWidth: dimensions.contentWidth, alignSelf: 'center' },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingHorizontal: spacing.medium, paddingTop: spacing.small, paddingBottom: spacing.small },
    back: { minHeight: dimensions.minimumTouchTarget, minWidth: dimensions.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
    navigationTitle: { flex: 1, color: palette.text, fontSize: typography.heading, lineHeight: 27, fontWeight: '700' },
    badge: { height: 46, width: 46, borderRadius: 23, backgroundColor: palette.selection, alignItems: 'center', justifyContent: 'center' },
    hero: { minHeight: 202, justifyContent: 'center', overflow: 'hidden' },
    heroCopy: { width: '58%', paddingLeft: spacing.large, paddingTop: spacing.medium, paddingBottom: 48, gap: spacing.small, zIndex: 1 },
    stackedHeroCopy: { width: '100%', paddingRight: spacing.large, paddingBottom: spacing.small },
    stackedHall: { position: 'relative', width: '100%', height: 150, right: 0, bottom: 0 },
    heroTitle: { color: palette.text, fontSize: typography.title, lineHeight: 34, fontWeight: '800' },
    body: { color: palette.secondary, fontSize: typography.body, lineHeight: typography.bodyLineHeight },
    hall: { position: 'absolute', width: '68%', height: 230, right: -42, bottom: -30 },
    waves: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 44 },
    form: { padding: spacing.medium, paddingTop: spacing.large, gap: spacing.medium },
    section: { borderWidth: dimensions.borderWidth, borderColor: palette.border, borderRadius: dimensions.cardRadius, backgroundColor: palette.surface, overflow: 'hidden' },
    sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.medium, borderBottomWidth: dimensions.borderWidth, borderBottomColor: palette.border },
    sectionTitle: { flex: 1, color: palette.text, fontSize: 18, lineHeight: 25, fontWeight: '700' },
    sectionBody: { padding: spacing.medium, gap: spacing.medium },
    field: { gap: spacing.small },
    label: { color: palette.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight, fontWeight: '700' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.small, minHeight: 54, paddingLeft: spacing.medium, paddingRight: spacing.small, borderWidth: dimensions.borderWidth, borderColor: palette.border, borderRadius: dimensions.buttonRadius },
    input: { flex: 1, minWidth: 0, borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent', paddingLeft: 0 },
    value: { flex: 1, color: palette.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight, paddingVertical: spacing.medium },
    options: { gap: spacing.small },
    option: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.medium, paddingHorizontal: spacing.medium, paddingVertical: spacing.medium, borderWidth: dimensions.borderWidth, borderColor: palette.border, borderRadius: dimensions.buttonRadius },
    checkSlot: { width: 24, alignItems: 'center', justifyContent: 'center' },
    optionText: { flex: 1, color: palette.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight, fontWeight: '700' },
    footnote: { color: palette.secondary, fontSize: typography.supporting, lineHeight: 21 },
    action: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.small, borderRadius: dimensions.buttonRadius, borderWidth: dimensions.borderWidth, borderColor: palette.brand, backgroundColor: palette.brand, padding: spacing.medium },
    actionLabel: { color: palette.onBrand, fontSize: typography.body, lineHeight: typography.bodyLineHeight, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
    actions: { gap: spacing.small, paddingTop: spacing.small },
    summary: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.small },
    summaryText: { flex: 1, gap: 3 },
    summaryValue: { color: palette.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight },
    error: { color: palette.danger, fontSize: typography.body, lineHeight: typography.bodyLineHeight },
  }), [palette]);
}
