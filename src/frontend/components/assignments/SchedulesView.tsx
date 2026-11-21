import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../common/ActionButton';
import { scheduleEn as text } from '../../../constants/strings/scheduleEn';
import { styles as base } from '../../styles/publishers/publishers.styles';
import { sectionBackground, styles } from '../../styles/assignments/schedules.styles';
import type { useSchedules } from '../../hooks/useSchedules';
import {
  meetingDutyEn,
} from '../../../constants/strings/meetingDutyEn';

type Props = ReturnType<typeof useSchedules>;

export default function SchedulesView(model: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={model.state.status === 'ready' ? model.state.rows : []}
        keyExtractor={row => row.id}
        contentContainerStyle={base.content}
        ListHeaderComponent={
          <View style={base.group}>
            <Text accessibilityRole="header" style={base.title}>{text.schedules}</Text>
            <Text style={base.secondary}>{text.draft}</Text>
            <Text style={base.heading}>{model.weekLabel}</Text>
            <View style={styles.controls}>
              <ActionButton label={text.previous} disabled={!model.canPrevious} onPress={model.previousWeek} />
              <ActionButton label={text.next} disabled={!model.canNext} onPress={model.nextWeek} />
            </View>
            <ActionButton label={text.managePrograms} onPress={model.openPrograms} />
            {model.state.status === 'error' ? <>
              <Text accessibilityRole="alert" style={base.error}>{model.state.message}</Text>
              <ActionButton label={text.reload} onPress={model.reload} />
            </> : null}
          </View>
        }
        ListEmptyComponent={
          model.state.status === 'loading'
            ? <Text style={base.text}>{text.loading}</Text>
            : model.state.status === 'ready'
              ? <Text style={base.text}>{text.empty}</Text>
              : undefined
        }
        renderItem={({ item }) => (
          <View>
            {item.startsMeeting ? <View style={styles.meeting}>
              <Text accessibilityRole="header" style={base.title}>{item.meetingTitle}</Text>
              <Text style={base.secondary}>{item.date} · {item.timezone}</Text>
              <ActionButton
                label={meetingDutyEn.title}
                onPress={() => model.openDuties(item.meetingId)}
              />
            </View> : null}
            {item.startsSection ? <View style={[styles.section, sectionBackground(item.sectionIndex)]}>
              <Text accessibilityRole="header" style={styles.sectionText}>{item.sectionTitle}</Text>
            </View> : null}
            <View style={styles.part}>
              <Text style={base.heading}>{item.title}</Text>
              <Text style={base.secondary}>{item.duration}</Text>
              {item.meetingOnly ? (
                <Text style={base.secondary}>{meetingDutyEn.noParts}</Text>
              ) : (
                <View style={styles.part}>
                  {/* Keep the existing part contents here. */}
                </View>
              )}
              {item.slots.length === 0 ? <Text style={base.secondary}>{text.notAssigned}</Text> : null}
              {item.slots.map(slot => <View key={slot.assignment.role} style={base.group}>
                <Text style={base.text}>{model.roleLabel[slot.assignment.role]}: {slot.label}</Text>
                {slot.needsReview ? <Text style={styles.warning}>{text.review}</Text> : null}
                <ActionButton
                  label={`${text.edit}: ${model.roleLabel[slot.assignment.role]}`}
                  onPress={() => model.openAssignment(item.meetingId, item.id, slot.assignment.role)}
                />
              </View>)}
              <ActionButton label={text.add} onPress={() => model.openAssignment(item.meetingId, item.id)} />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
