import { Text, View } from 'react-native';

import type { SharedSchedule } from '../../../backend/domain/devices/sharedSchedule';
import { styles } from '../../styles/publishers/publishers.styles';
import { meetingDutyEn } from '../../../constants/strings/meetingDutyEn';
import { lanProbeEn } from '../../../constants/strings/lanProbeEn';

interface Props {
  readonly schedule: SharedSchedule;
}

export default function ReceivedScheduleView({ schedule }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.heading}>{lanProbeEn.preview}</Text>
      {schedule.meetings.length === 0 ? (
        <Text style={styles.secondary}>{lanProbeEn.emptySchedule}</Text>
      ) : null}
      {schedule.meetings.map(meeting => (
        <View key={meeting.id} style={styles.publisher}>
          <Text style={styles.heading}>{meeting.draft.title}</Text>
          <Text style={styles.secondary}>
            {meeting.draft.meetingDate}{' · '}
            {meeting.draft.startLocalTime ?? '—'}{' · '}
            {meeting.draft.timezone}
          </Text>
          {meeting.duties.map(duty => (
            <Text key={duty.key} style={styles.text}>
              {meetingDutyEn.labels[duty.key]}{': '}
              {duty.publisherName ?? meetingDutyEn.notAssigned}
            </Text>
          ))}
          {meeting.draft.sections.map((section, sectionIndex) => (
            <View
              key={section.id ?? `${meeting.id}:section:${sectionIndex}`}
              style={styles.group}
            >
              <Text style={styles.heading}>{section.title}</Text>
              {section.parts.map((part, partIndex) => (
                <Text
                  key={part.id ?? `${meeting.id}:${sectionIndex}:${partIndex}`}
                  style={styles.text}
                >
                  {part.title}{' · '}
                  {part.isTimed
                    ? `${Math.floor(part.durationSeconds / 60)}:${String(
                        part.durationSeconds % 60,
                      ).padStart(2, '0')}`
                    : '—'}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
