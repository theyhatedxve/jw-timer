import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { meetingWeek } from '../../../backend/domain/meetings/meetingWeek';
import { homeEn as text } from '../../../constants/strings/homeEn';
import { dimensions, spacing } from '../../../constants/theme';
import { useAppTheme } from '../../context/AppearanceContext';
import type { HomeState } from '../../hooks/useHomeDashboard';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppIcon from '../common/AppIcon';
import AppScreen from '../common/AppScreen';

interface Props {
  readonly state: HomeState;
  readonly reload: () => void;
  readonly openProgram: (id: string) => void;
  readonly openMeetings: () => void;
}

export default function HomeView({
  state,
  reload,
  openProgram,
  openMeetings,
}: Props) {
  const { palette } = useAppTheme();
  const next = state.status === 'ready' ? state.snapshot.next : null;
  const draft = next?.meeting.draft;
  const stats = next ? [
    { icon: 'list', label: text.parts, value: String(next.partCount) },
    { icon: 'timer', label: text.duration, value: text.time(next.durationSeconds) },
  ] as const : [];

  return (
    <AppScreen>
      <View className="overflow-hidden rounded-app-card pb-app-large">
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          className="absolute inset-x-0 bottom-0 h-12 overflow-hidden"
        >
          <View
            className="absolute -bottom-16 h-24 w-[120%] rounded-full"
            style={{
              right: '-35%',
              backgroundColor: palette.brand,
              opacity: 0.2,
              transform: [{ rotate: '-10deg' }],
            }}
          />
          <View
            className="absolute -bottom-20 h-24 w-[120%] rounded-full"
            style={{
              left: '-25%',
              backgroundColor: palette.brand,
              opacity: 0.12,
              transform: [{ rotate: '8deg' }],
            }}
          />
        </View>

        <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
          {text.title}
        </Text>
        <View className="mt-app-small flex-row items-center gap-app-small">
          <View accessible={false} className="h-2 w-2 rounded-full bg-app-brand" />
          <Text className="flex-shrink text-app-body font-semibold text-app-brand">
            {text.offline}
          </Text>
        </View>
      </View>

      {state.status === 'loading' ? (
        <AppCard>
          <ActivityIndicator color={palette.brand} />
          <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">
            {text.loading}
          </Text>
        </AppCard>
      ) : state.status === 'error' ? (
        <AppCard>
          <Text accessibilityRole="alert" className="text-app-body text-app-danger">
            {text.error}
          </Text>
          <AppButton label={text.retry} onPress={reload} />
        </AppCard>
      ) : next && draft ? (
        <>
          <AppCard>
            <View className="flex-row items-start gap-app-medium">
              <AppIcon name="meetings" color={palette.text} size={dimensions.minimumTouchTarget} />
              <View className="flex-1 gap-app-small">
                <Text accessibilityRole="header" className="text-app-body font-semibold text-app-text">
                  {draft.meetingType === 'midweek' ? text.nextMidweek : text.nextWeekend}
                </Text>
                <Text className="text-app-title font-bold text-app-text">
                  {text.week(meetingWeek(draft.meetingDate))}
                </Text>
                <Text className="text-app-body text-app-secondary">{draft.title}</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.openProgram}
              onPress={() => openProgram(next.meeting.id)}
              className="min-h-app-touch flex-row items-center justify-center gap-app-small rounded-full bg-app-brand p-app-medium active:opacity-75"
            >
              <Text accessible={false} className="text-app-body font-bold text-app-onBrand">
                {text.play}
              </Text>
              <Text className="flex-shrink text-center text-app-body font-bold text-app-onBrand">
                {text.openProgram}
              </Text>
            </Pressable>
          </AppCard>

          <View className="flex-row flex-wrap gap-app-small">
            {stats.map(stat => (
              <View key={stat.icon} className="min-w-app-stat flex-1">
                <AppCard>
                  <View className="items-center gap-app-small">
                    <AppIcon name={stat.icon} color={palette.text} size={spacing.large} />
                    <Text className="text-center text-xl font-bold text-app-text">{stat.value}</Text>
                    <Text className="text-center text-app-body text-app-secondary">{stat.label}</Text>
                  </View>
                </AppCard>
              </View>
            ))}
          </View>
        </>
      ) : (
        <AppCard>
          <Text className="text-app-body text-app-secondary">{text.empty}</Text>
        </AppCard>
      )}

      <Text accessibilityRole="header" className="text-xl font-bold text-app-text">
        {text.quickActions}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text.meetings + '. ' + text.meetingsDescription}
        onPress={openMeetings}
        className="min-h-app-touch flex-row items-center gap-app-medium rounded-app-card border border-app-border bg-app-surface p-app-medium active:opacity-75"
      >
        <AppIcon name="meetings" color={palette.text} size={spacing.large} />
        <View className="flex-1">
          <Text className="text-app-body font-bold text-app-text">{text.meetings}</Text>
          <Text className="text-app-body text-app-secondary">{text.meetingsDescription}</Text>
        </View>
        <Text accessible={false} className="text-app-title text-app-secondary">{text.chevron}</Text>
      </Pressable>
    </AppScreen>
  );
}
