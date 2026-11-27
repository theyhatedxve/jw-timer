import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { meetingWeek } from '../../../backend/domain/meetings/meetingWeek';
import { homeEn as text } from '../../../constants/strings/homeEn';
import { homeTheme } from '../../../constants/homeTheme';
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
  readonly openTimer: () => void;
  readonly openSettings: () => void;
}

export default function HomeView({
  state, reload, openProgram, openMeetings, openTimer, openSettings,
}: Props) {
  const { palette, resolved } = useAppTheme();
  const colors = homeTheme[resolved];
  const next = state.status === 'ready' ? state.snapshot.next : null;
  const recent = state.status === 'ready' ? state.snapshot.recent : null;
  const quickActions = [
    { icon: 'meetings', label: text.meetings, hint: text.meetingsDescription, onPress: openMeetings },
    { icon: 'timer', label: text.timer, hint: text.timerDescription, onPress: openTimer },
  ] as const;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-app-canvas">
      <AppScreen>
        <View className="flex-row items-center gap-app-medium">
          <View className="flex-1 gap-app-small">
            <Text className="text-app-body text-app-secondary">{text.welcome}</Text>
            <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
              {text.overview}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.settings}
            onPress={openSettings}
            className="min-h-app-touch min-w-app-touch items-center justify-center rounded-full border border-app-border bg-app-surface active:opacity-75"
          >
            <AppIcon name="settings" color={palette.brand} size={spacing.large} />
          </Pressable>
        </View>

        <View className="flex-row flex-wrap items-center gap-app-small rounded-app-card p-app-medium" style={{ backgroundColor: colors.soft }}>
          <View accessible={false} className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.accent }} />
          <Text className="text-app-body font-bold" style={{ color: colors.accent }}>{text.offline}</Text>
          <Text className="flex-shrink text-sm" style={{ color: colors.accent }}>{text.storedLocally}</Text>
        </View>

        {state.status === 'loading' ? (
          <AppCard>
            <ActivityIndicator color={palette.brand} />
            <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">{text.loading}</Text>
          </AppCard>
        ) : state.status === 'error' ? (
          <AppCard>
            <Text accessibilityRole="alert" className="text-app-body text-app-danger">{text.error}</Text>
            <AppButton label={text.retry} onPress={reload} />
          </AppCard>
        ) : next ? (
          <View className="gap-app-large p-app-large" style={{ backgroundColor: colors.hero, borderRadius: homeTheme.heroRadius }}>
            <View className="flex-row items-center justify-between gap-app-medium">
              <View className="rounded-full px-app-large py-app-small" style={{ backgroundColor: colors.badge }}>
                <Text className="text-sm font-bold" style={{ color: colors.heroText }}>{text.upNext}</Text>
              </View>
              <AppIcon name="meetings" color={colors.mint} size={spacing.large} />
            </View>
            <View className="gap-app-small">
              <Text accessibilityRole="header" className="text-2xl font-bold" style={{ color: colors.heroText }}>
                {next.meeting.draft.meetingType === 'midweek' ? text.midweek : text.weekend}
              </Text>
              <Text className="text-app-body" style={{ color: colors.mint }}>
                {text.week(meetingWeek(next.meeting.draft.meetingDate))}
              </Text>
            </View>
            <View style={{ height: dimensions.borderWidth, backgroundColor: colors.divider }} />
            <View className="flex-row flex-wrap items-center gap-app-large">
              <View className="flex-1 flex-row items-center gap-app-small">
                <AppIcon name="list" color={colors.mint} size={spacing.large} />
                <Text className="flex-shrink text-app-body font-semibold" style={{ color: colors.heroText }}>{text.partsCount(next.partCount)}</Text>
              </View>
              <View className="flex-1 flex-row items-center gap-app-small">
                <AppIcon name="timer" color={colors.mint} size={spacing.large} />
                <Text className="flex-shrink text-app-body font-semibold" style={{ color: colors.heroText }}>{text.time(next.durationSeconds)}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.openProgram}
              onPress={() => openProgram(next.meeting.id)}
              className="min-h-app-touch flex-row items-center justify-center gap-app-small rounded-app-card p-app-medium active:opacity-75"
              style={{ backgroundColor: colors.mint }}
            >
              <AppIcon name="arrowRight" color={colors.hero} size={spacing.large} />
              <Text className="flex-shrink text-center text-app-body font-bold" style={{ color: colors.hero }}>{text.openProgram}</Text>
            </Pressable>
          </View>
        ) : (
          <AppCard><Text className="text-app-body text-app-secondary">{text.empty}</Text></AppCard>
        )}

        <View className="gap-app-small">
          <Text accessibilityRole="header" className="text-2xl font-bold text-app-text">{text.quickActions}</Text>
          <Text className="text-sm text-app-secondary">{text.tools}</Text>
        </View>
        <View className="flex-row gap-app-small">
          {quickActions.map(action => (
            <Pressable
              key={action.icon}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityHint={action.hint}
              onPress={action.onPress}
              className="min-h-app-touch flex-1 items-start gap-app-small border border-app-border bg-app-surface p-app-medium active:opacity-75"
              style={{ borderRadius: homeTheme.cardRadius }}
            >
              <View className="rounded-full p-app-small" style={{ backgroundColor: colors.soft }}>
                <AppIcon name={action.icon} color={colors.accent} size={spacing.large} />
              </View>
              <Text className="text-xl font-bold text-app-text">{action.label}</Text>
              <Text className="text-sm text-app-secondary">{action.hint}</Text>
            </Pressable>
          ))}
        </View>

        {state.status === 'ready' ? (
          <View className="gap-app-small">
            <Text accessibilityRole="header" className="text-xl font-bold text-app-text">{text.recentSession}</Text>
            {recent ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={recent.partTitle + '. ' + text.sessionState(recent.status, recent.digits)}
                accessibilityHint={text.timerDescription}
                onPress={openTimer}
                className="min-h-app-touch flex-row items-center gap-app-small border border-app-border bg-app-surface p-app-medium active:opacity-75"
                style={{ borderRadius: homeTheme.cardRadius }}
              >
                <View className="rounded-full p-app-small" style={{ backgroundColor: palette.warningBackground }}>
                  <AppIcon name={recent.status === 'completed' ? 'list' : recent.status === 'ready' ? 'play' : 'pause'} color={palette.warning} size={spacing.large} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-app-body font-semibold text-app-text">{recent.partTitle}</Text>
                  <Text className="text-sm text-app-secondary">{text.sessionState(recent.status, recent.digits)}</Text>
                </View>
                <Text accessible={false} className="text-app-title text-app-secondary">{text.chevron}</Text>
              </Pressable>
            ) : (
              <AppCard><Text className="text-sm text-app-secondary">{text.noRecentSession}</Text></AppCard>
            )}
          </View>
        ) : null}
      </AppScreen>
    </SafeAreaView>
  );
}
