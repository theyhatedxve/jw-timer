import { StyleSheet } from 'react-native';
import { dimensions, spacing, typography } from '../../../constants/theme';

export function sectionBackground(index: number) {
  const colors = ['#206A7B', '#876009', '#96263A'];
  return { backgroundColor: colors[index % colors.length] ?? colors[0] };
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.small, gap: spacing.small, backgroundColor: '#FFFFFF' },
  tab: { minHeight: dimensions.minimumTouchTarget, padding: spacing.medium, justifyContent: 'center', borderRadius: dimensions.buttonRadius, borderWidth: 1, borderColor: '#52606D' },
  selected: { backgroundColor: '#DCEFFB', borderColor: '#14567C' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  meeting: { marginTop: spacing.large, gap: spacing.small },
  section: { padding: spacing.small, marginTop: spacing.medium },
  sectionText: { color: '#FFFFFF', fontWeight: '700', fontSize: typography.body },
  part: { paddingVertical: spacing.medium, gap: spacing.small, borderBottomWidth: 1, borderBottomColor: '#D5DDE5' },
  option: { padding: spacing.medium, minHeight: dimensions.minimumTouchTarget, borderWidth: 1, borderColor: '#52606D', borderRadius: dimensions.buttonRadius, marginBottom: spacing.small, gap: spacing.small },
  warning: { color: '#96263A', fontSize: typography.body },
});
