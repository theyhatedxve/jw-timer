import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { meetingDutyEn as text } from '../../../constants/strings/meetingDutyEn';
import { dimensions, spacing } from '../../../constants/theme';

import { useAppTheme } from '../../context/AppearanceContext';
import type { useMeetingDuties } from '../../hooks/useMeetingDuties';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';

type Props = ReturnType<typeof useMeetingDuties>;

export default function MeetingDutiesView(model: Props) {
  const { palette } = useAppTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.canvas }}
      edges={['left', 'right', 'bottom']}
    >
      <FlatList
        data={model.selected ? model.eligible : []}
        keyExtractor={person => person.id}
        contentContainerStyle={{
          width: '100%',
          maxWidth: dimensions.contentWidth,
          alignSelf: 'center',
          padding: spacing.large,
          gap: spacing.medium,
        }}
        ListHeaderComponent={
          <View className="gap-app-medium">
            <Text
              accessibilityRole="header"
              className="text-app-title font-bold text-app-text"
            >
              {model.title}
            </Text>
            {model.error ? (
              <AppCard>
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  className="text-app-body text-app-danger"
                >
                  {model.error}
                </Text>
                <AppButton
                  label={text.reload}
                  disabled={model.busy}
                  onPress={model.reload}
                />
              </AppCard>
            ) : null}
            {!model.ready && !model.error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="text-app-body text-app-secondary"
              >
                {text.loading}
              </Text>
            ) : null}
            {model.ready && !model.selected ? (
              model.rows.map(row => (
                <AppCard key={row.key}>
                  <Text
                    accessibilityRole="header"
                    className="text-app-body font-bold text-app-text"
                  >
                    {row.label}
                  </Text>
                  <Text className="text-app-body text-app-text">{row.name}</Text>
                  {row.needsReview ? (
                    <Text className="text-app-body text-app-danger">{text.review}</Text>
                  ) : null}
                  <AppButton
                    label={`${text.assign}: ${row.label}`}
                    disabled={model.busy}
                    onPress={() => model.selectDuty(row.key)}
                  />
                </AppCard>
              ))
            ) : null}
            {model.ready && model.selected ? (
              <AppCard>
                <Text
                  accessibilityRole="header"
                  className="text-app-body font-bold text-app-text"
                >
                  {model.current?.label}
                </Text>
                <Text className="text-app-body text-app-text">
                  {text.current}: {model.current?.name}
                </Text>
                <AppButton
                  label={text.notAssigned}
                  disabled={model.busy}
                  onPress={() => model.assign(null)}
                />
                {model.eligible.length === 0 ? (
                  <Text className="text-app-body text-app-secondary">{text.noEligible}</Text>
                ) : null}
                <AppButton
                  label={text.back}
                  disabled={model.busy}
                  onPress={() => model.selectDuty(null)}
                />
              </AppCard>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <AppButton
            label={`${text.assign}: ${item.displayName}`}
            disabled={model.busy}
            onPress={() => model.assign(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}
