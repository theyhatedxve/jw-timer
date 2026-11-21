import { ActivityIndicator, Text } from 'react-native';

import { meetingDutyEn as text } from '../../../constants/strings/meetingDutyEn';
import { dutyOverviewEn as overview } from '../../../constants/strings/dutyOverviewEn';
import { receivedSchedulesEn } from '../../../constants/strings/receivedSchedulesEn';

import type { useDutyOverview } from '../../hooks/useDutyOverview';
import { useAppTheme } from '../../context/AppearanceContext';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppScreen from '../common/AppScreen';
import MeetingWeekPicker from '../meetings/MeetingWeekPicker';
import DutyAssignmentCard from './DutyAssignmentCard';

type Props = ReturnType<typeof useDutyOverview> & {
  readonly onEdit?: (meetingId: string) => void;
  readonly onPublishers?: () => void;
  readonly onReceived?: () => void;
};

export default function DutyOverviewView(model: Props) {
  const { palette } = useAppTheme();
  const selected = model.selectedMeeting;

  return (
    <AppScreen>
      <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
        {model.onEdit ? text.title : text.assignments}
      </Text>

      <MeetingWeekPicker
        week={model.week}
        canPrevious={model.canPrevious}
        canNext={model.canNext}
        previousWeek={model.previousWeek}
        nextWeek={model.nextWeek}
        selectDate={model.selectDate}
      />

      {model.onPublishers ? (
        <AppButton
          label={text.publishers}
          onPress={model.onPublishers}
        />
      ) : null}

      {model.onReceived ? (
        <AppButton
          label={receivedSchedulesEn.open}
          onPress={model.onReceived}
        />
      ) : null}

      {!model.ready ? (
        <>
          <ActivityIndicator color={palette.brand} />
          <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">
            {text.loading}
          </Text>
        </>
      ) : model.error ? (
        <AppCard>
          <Text accessibilityRole="alert" className="text-app-body text-app-danger">
            {model.error}
          </Text>
          <AppButton label={text.reload} onPress={model.reload} />
        </AppCard>
      ) : !selected ? (
        <AppCard>
          <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">
            {overview.emptyWeek}
          </Text>
        </AppCard>
      ) : (
        <>
          {model.entries.length > 1 ? (
            <AppCard>
              <Text accessibilityRole="header" className="text-app-body font-bold text-app-text">
                {overview.chooseMeeting}
              </Text>

              {model.entries.map(entry => (
                <AppButton
                  key={entry.id}
                  label={
                    `${overview.date(entry.date)} · ${entry.title}` +
                    (entry.id === selected.id ? overview.selected : '')
                  }
                  selected={entry.id === selected.id}
                  onPress={() => model.selectMeeting(entry.id)}
                />
              ))}
            </AppCard>
          ) : null}

          <AppCard>
            <Text className="text-app-body text-app-secondary">
              {overview.local}
              {' · '}
              {overview.date(selected.date)}
            </Text>

            <Text accessibilityRole="header" className="text-app-body font-bold text-app-text">
              {selected.title}
            </Text>
          </AppCard>

          {selected.rows.map(row => (
            <DutyAssignmentCard key={row.key} row={row} />
          ))}

          {model.onEdit ? (
            <AppButton
              label={text.edit}
              onPress={() => model.onEdit?.(selected.id)}
            />
          ) : null}
        </>
      )}
    </AppScreen>
  );
}
