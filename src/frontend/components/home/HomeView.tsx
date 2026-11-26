import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { homeEn as text } from '../../../constants/strings/homeEn';
import { dimensions, spacing } from '../../../constants/theme';

import type { HomeState } from '../../hooks/useHomeDashboard';
import { useAppTheme } from '../../context/AppearanceContext';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppIcon, { type AppIconName } from '../common/AppIcon';
import AppScreen from '../common/AppScreen';

interface Props {
  readonly state: HomeState;
  readonly reload: () => void;
  readonly openProgram: (id: string) => void;
  readonly openMeetings: () => void;
}

function QuickAction({
  icon,
  title,
  description,
  onPress,
}: {
  readonly icon: AppIconName;
  readonly title: string;
  readonly description: string;
  readonly onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      className="min-h-app-touch flex-row items-center gap-app-medium rounded-app-card border border-app-border bg-app-surface p-app-medium active:opacity-75"
    >
      <AppIcon name={icon} color={palette.brand} size={spacing.large} />

      <View className="flex-1">
        <Text className="text-app-body font-bold text-app-text">
          {title}
        </Text>
        <Text className="text-app-body text-app-secondary">
          {description}
        </Text>
      </View>

      <Text accessible={false} className="text-app-title text-app-secondary">
        {text.chevron}
      </Text>
    </Pressable>
  );
}

export default function HomeView({
  state,
  reload,
  openProgram,
  openMeetings,
}: Props) {
  const { palette } = useAppTheme();
  const next = state.status === 'ready' ? state.snapshot.next : null;

  const stats = next ? [
    { label: text.parts, value: String(next.partCount) },
    { label: text.duration, value: text.time(next.durationSeconds) },
  ] : [];

  return (
    <AppScreen>
      <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
        {text.title}
      </Text>

      <Text className="text-app-body font-semibold text-app-secondary">
        {text.offline}
      </Text>

      {state.status === 'loading' ? (
        <View className="gap-app-medium">
          <ActivityIndicator color={palette.brand} />
          <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">
            {text.loading}
          </Text>
        </View>
      ) : state.status === 'error' ? (
        <AppCard>
          <Text accessibilityRole="alert" className="text-app-body text-app-danger">
            {text.error}
          </Text>
          <AppButton label={text.retry} onPress={reload} />
        </AppCard>
      ) : next ? (
        <>
          <AppCard>
            <AppIcon
              name="meetings"
              color={palette.brand}
              size={dimensions.minimumTouchTarget}
            />

            <Text className="text-app-body text-app-secondary">
              {text.next}
            </Text>

            <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
              {text.date(next.meeting.draft.meetingDate)}
            </Text>

            <Text className="text-app-body font-bold text-app-text">
              {next.meeting.draft.title}
            </Text>

            <Text className="text-app-body text-app-secondary">
              {next.meeting.draft.meetingType === 'midweek'
                ? text.midweek
                : text.weekend}
              {' · '}
              {text.local}
            </Text>

            <AppButton
              label={text.openProgram}
              onPress={() => openProgram(next.meeting.id)}
            />
          </AppCard>

          <View className="flex-row flex-wrap gap-app-small">
            {stats.map(stat => (
              <View key={stat.label} className="min-w-app-stat flex-1">
                <AppCard>
                  <Text className="text-app-body font-bold text-app-text">
                    {stat.value}
                  </Text>
                  <Text className="text-app-body text-app-secondary">
                    {stat.label}
                  </Text>
                </AppCard>
              </View>
            ))}
          </View>
        </>
      ) : (
        <AppCard>
          <Text className="text-app-body text-app-secondary">
            {text.empty}
          </Text>
          <AppButton label={text.meetings} onPress={openMeetings} />
        </AppCard>
      )}

      <Text accessibilityRole="header" className="text-app-body font-bold text-app-text">
        {text.quickActions}
      </Text>

      <QuickAction
        icon="meetings"
        title={text.meetings}
        description={text.meetingsDescription}
        onPress={openMeetings}
      />
    </AppScreen>
  );
}
