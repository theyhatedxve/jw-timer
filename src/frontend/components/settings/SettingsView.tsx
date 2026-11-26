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
  readonly appearanceLabel: string;
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
    key: 'backups',
    icon: 'settings',
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

function SettingsRow({
  action,
  appearanceLabel,
  last,
}: {
  readonly action: Action;
  readonly appearanceLabel: string;
  readonly last: boolean;
}) {
  const description = descriptionFor(action.id);
  const value = action.id === 'appearance' ? appearanceLabel : null;

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
        'min-h-app-touch flex-row items-center gap-app-small border-app-border p-app-medium active:opacity-75 ' +
        (last ? '' : 'border-b')
      }
    >
      <View className="flex-1 gap-app-small">
        <Text className="text-app-body font-semibold text-app-text">
          {action.label}
        </Text>
        {value ? (
          <Text className="text-app-body font-semibold text-app-secondary">
            {value}
          </Text>
        ) : null}
        {description ? (
          <Text className="text-app-body text-app-secondary">
            {description}
          </Text>
        ) : null}
      </View>
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
  appearanceLabel,
}: {
  readonly title: string;
  readonly icon: AppIconName;
  readonly actions: readonly Action[];
  readonly appearanceLabel: string;
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
          appearanceLabel={appearanceLabel}
          last={index === actions.length - 1}
        />
      ))}
    </View>
  );
}

export default function SettingsView({ actions, appearanceLabel }: Props) {
  const knownIds = new Set(groups.flatMap(group => group.ids));
  const remaining = actions.filter(action => !knownIds.has(action.id));

  return (
    <AppScreen>
      <Text
        accessibilityRole="header"
        className="text-app-title font-bold text-app-text"
      >
        {text.title}
      </Text>
      <Text className="text-app-body text-app-secondary">
        {text.description}
      </Text>
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
            appearanceLabel={appearanceLabel}
          />
        );
      })}
      <SettingsGroup
        title={text.groups.other}
        icon="settings"
        actions={remaining}
        appearanceLabel={appearanceLabel}
      />
    </AppScreen>
  );
}
