import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { settingsEn as text } from '../../../constants/strings/settingsEn';
import { spacing } from '../../../constants/theme';
import { useAppTheme } from '../../context/AppearanceContext';
import type { useSectionScreen } from '../../hooks/useSectionScreen';
import AppIcon, { type AppIconName } from '../common/AppIcon';
import AppScreen from '../common/AppScreen';

type Action = ReturnType<typeof useSectionScreen>['actions'][number];

interface Props {
  readonly actions: readonly Action[];
  readonly values: Readonly<Record<string, string | undefined>>;
  readonly hasNavigationHeader: boolean;
}

const groups: readonly {
  readonly key: keyof typeof text.groups;
  readonly ids: readonly string[];
}[] = [
  { key: 'general', ids: ['appearance', 'profile'] },
  { key: 'programs', ids: ['workbook-import'] },
  { key: 'timerData', ids: ['timer-display', 'backups'] },
  { key: 'developer', ids: ['diagnostics', 'backup-checks', 'nativewind-preview'] },
];

const rowIcons: Readonly<Record<string, AppIconName>> = {
  appearance: 'moon',
  profile: 'target',
  'workbook-import': 'document',
  'timer-display': 'fullscreen',
  backups: 'database',
  diagnostics: 'target',
  'backup-checks': 'restart',
  'nativewind-preview': 'laptop',
};
const labels: Readonly<Record<string, string>> = text.labels;
const descriptions: Readonly<Record<string, string>> = text.descriptions;

function SettingsRow({
  action, values,
}: {
  readonly action: Action;
  readonly values: Props['values'];
}) {
  const { palette } = useAppTheme();
  const label = labels[action.id] ?? action.label;
  const description = descriptions[action.id];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[label, values[action.id], description].filter(Boolean).join('. ')}
      onPress={action.onPress}
      className="min-h-app-touch flex-row items-center gap-app-small rounded-app-card border border-app-border bg-app-surface p-app-medium active:opacity-75"
    >
      <View className="rounded-full p-app-small" style={{ backgroundColor: palette.selection }}>
        <AppIcon name={rowIcons[action.id] ?? 'settings'} color={palette.brand} size={spacing.large} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-app-body font-semibold text-app-text">{label}</Text>
        {description ? <Text className="text-sm text-app-secondary">{description}</Text> : null}
      </View>
      <Text accessible={false} className="text-app-title text-app-secondary">{text.chevron}</Text>
    </Pressable>
  );
}

function SettingsGroup({
  title, actions, values,
}: {
  readonly title: string;
  readonly actions: readonly Action[];
  readonly values: Props['values'];
}) {
  if (actions.length === 0) return null;
  return (
    <View className="gap-app-small">
      <Text accessibilityRole="header" className="pb-app-small text-xs font-bold text-app-secondary">{title.toUpperCase()}</Text>
      {actions.map(action => <SettingsRow key={action.id} action={action} values={values} />)}
    </View>
  );
}

export default function SettingsView({ actions, values, hasNavigationHeader }: Props) {
  const knownIds = new Set(groups.flatMap(group => group.ids));
  const remaining = actions.filter(action => !knownIds.has(action.id));
  return (
    <SafeAreaView edges={hasNavigationHeader ? [] : ['top']} className="flex-1 bg-app-canvas">
      <AppScreen>
        <View className="gap-app-small pb-app-medium">
          {!hasNavigationHeader ? (
            <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">{text.title}</Text>
          ) : null}
          <Text className="text-app-body text-app-secondary">{text.subtitle}</Text>
        </View>
        <View className="gap-app-large">
          {groups.map(group => {
            const ordered = group.ids.flatMap(id => {
              const action = actions.find(item => item.id === id);
              return action ? [action] : [];
            });
            return <SettingsGroup key={group.key} title={text.groups[group.key]} actions={ordered} values={values} />;
          })}
          <SettingsGroup title={text.groups.other} actions={remaining} values={values} />
        </View>
      </AppScreen>
    </SafeAreaView>
  );
}
