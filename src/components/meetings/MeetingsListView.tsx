import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/ActionButton';
import { meetingStyles as styles } from './MeetingControls';

import type { useMeetings } from '../../hooks/useMeetings';

type Props = ReturnType<typeof useMeetings>;

export default function MeetingsListView({
  state,
  reload,
  createMeeting,
  openMeeting,
}: Props) {
  const meetings =
    state.status === 'ready' ? state.meetings : [];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.screen}
    >
      <FlatList
        data={meetings}
        keyExtractor={meeting => meeting.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.group}>
            <Text
              accessibilityRole="header"
              style={styles.title}
            >
              Meetings
            </Text>

            <Text style={styles.supporting}>
              Prepare and save programs on this device.
            </Text>

            <ActionButton
              label="Create meeting"
              onPress={createMeeting}
            />

            {state.status === 'error' ? (
              <View style={styles.group}>
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={styles.error}
                >
                  {state.message}
                </Text>

                <ActionButton
                  label="Retry loading meetings"
                  onPress={reload}
                />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
            state.status === 'loading' ? (
                <Text style={styles.body}>Loading meetings…</Text>
            ) : state.status === 'ready' ? (
                <Text style={styles.body}>
                No saved meetings yet. Create your first program.
                </Text>
            ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text
              accessibilityRole="header"
              style={styles.heading}
            >
              {item.title}
            </Text>

            <Text style={styles.body}>
              {item.meetingDate}
              {' · '}
              {item.meetingType === 'midweek'
                ? 'Midweek'
                : 'Weekend'}
            </Text>

            <Text style={styles.supporting}>
              Local draft
            </Text>

            <ActionButton
              label={`Edit ${item.title}`}
              onPress={() => openMeeting(item.id)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}