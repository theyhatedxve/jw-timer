import { Text, View } from 'react-native';

import type { MeetingDutyKey } from '../../../backend/domain/assignments/meetingDuty';
import { spacing } from '../../../constants/theme';

import type { DutyOverviewRow } from '../../utils/dutyOverview';
import { useAppTheme } from '../../context/AppearanceContext';

import AppCard from '../common/AppCard';
import AppIcon, { type AppIconName } from '../common/AppIcon';

const icons: Record<MeetingDutyKey, AppIconName> = {
  'mic-server': 'microphone',
  'sound-operator': 'speaker',
  'laptop-operator': 'laptop',
  'microphone-adjuster': 'microphoneAdjuster',
};

export default function DutyAssignmentCard({
  row,
}: {
  readonly row: DutyOverviewRow;
}) {
  const { palette } = useAppTheme();

  return (
    <AppCard>
      <View className="flex-row items-start gap-app-medium">
        <AppIcon
          name={icons[row.key]}
          color={palette.brand}
          size={spacing.large}
        />

        <View className="flex-1 gap-app-small">
          <Text accessibilityRole="header" className="text-app-body font-bold text-app-text">
            {row.label}
          </Text>

          <Text className="text-app-body text-app-text">
            {row.name}
          </Text>

          {row.notices.map((message, index) => (
            <Text
              key={`${index}:${message}`}
              accessibilityLabel={`${row.label}: ${message}`}
              className="text-app-body text-app-danger"
            >
              {message}
            </Text>
          ))}
        </View>
      </View>
    </AppCard>
  );
}
