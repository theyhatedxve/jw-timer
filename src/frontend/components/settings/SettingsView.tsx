import { Pressable, Text, View } from 'react-native';

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
}

interface Group {
  readonly key: keyof typeof text.groups;
  readonly icon: AppIconName;
  readonly ids: readonly string[];
}

const groups: readonly Group[] = [
  {
    key: 'general',
    icon: 'settings',
    ids: ['appearance', 'profile'],
  },
  {
    key: 'programs',
    icon: 'meetings',
    ids: ['workbook-import'],
  },
  {
    key: 'display',
    icon: 'laptop',
    ids: ['timer-display'],
  },
  {
    key: 'backups',
    icon: 'database',
    ids: ['backups'],
  },
  {
    key: 'diagnostics',
    icon: 'settings',
    ids: [
      'diagnostics',
      'backup-checks',
      'nativewind-preview',
    ],
  },
];

function descriptionFor(id: string): string | undefined {
  const descriptions: Readonly<Record<string, string>> = text.descriptions;
  return descriptions[id];
}

const rowIcons: Readonly<Record<string, AppIconName | undefined>> = {
  appearance: 'moon',
  profile: 'globe',
  'workbook-import': 'book',
  'timer-display': 'timer',
  backups: 'database',
};

function SettingsRow({
  action,
  values,
  last,
}: {
  readonly action: Action;
  readonly values: Readonly<Record<string, string | undefined>>;
  readonly last: boolean;
}) {
  const description = descriptionFor(action.id);
  const { palette } = useAppTheme();
  const value = values[action.id];
  const icon = rowIcons[action.id] ?? 'settings';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        action.label,
        value,
        description,
      ].filter(Boolean).join('. ')}
      onPress={action.onPress}
      className={
        'min-h-app-touch flex-row items-center gap-app-small border-app-border px-app-medium py-app-small active:opacity-75 ' +
        (last ? '' : 'border-b')
      }
    >
      <AppIcon name={icon} color={palette.text} size={spacing.medium} />
      <View className="flex-1 gap-app-small">
        <Text className="text-app-body font-semibold text-app-text">
          {action.label}
        </Text>
        {description ? (
          <Text className="text-app-body text-app-secondary">
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text className="max-w-[40%] flex-shrink text-right text-sm text-app-secondary">
          {value}
        </Text>
      ) : null}
      <Text accessible={false} className="text-app-title text-app-secondary">
        {text.chevron}
      </Text>
    </Pressable>
  );
}

function SettingsGroup({
  title,
  icon,
  actions,
  values,
}: {
  readonly title: string;
  readonly icon: AppIconName;
  readonly actions: readonly Action[];
  readonly values: Readonly<Record<string, string | undefined>>;
}) {
  const { palette } = useAppTheme();
  if (actions.length === 0) return null;

  return (
    <View className="overflow-hidden rounded-app-card border border-app-border bg-app-surface">
      <View className="flex-row items-center gap-app-small border-b border-app-border p-app-medium">
        <AppIcon name={icon} color={palette.brand} size={spacing.large} />
        <Text
          accessibilityRole="header"
          className="flex-1 text-app-body font-bold text-app-text"
        >
          {title}
        </Text>
      </View>
      {actions.map((action, index) => (
        <SettingsRow
          key={action.id}
          action={action}
          values={values}
          last={index === actions.length - 1}
        />
      ))}
    </View>
  );
}

export default function SettingsView({ actions, values }: Props) {
  const knownIds = new Set(groups.flatMap(group => group.ids));
  const remaining = actions.filter(action => !knownIds.has(action.id));

  return (
    <AppScreen>
      {groups.map(group => {
        const ordered = group.ids.flatMap(id => {
          const action = actions.find(item => item.id === id);
          return action ? [action] : [];
        });

        return (
          <SettingsGroup
            key={group.key}
            title={text.groups[group.key]}
            icon={group.icon}
            actions={ordered}
            values={values}
          />
        );
      })}
      <SettingsGroup
        title={text.groups.other}
        icon="settings"
        actions={remaining}
        values={values}
      />
    </AppScreen>
  );
}
