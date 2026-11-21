import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../common/ActionButton';
import { meetingDutyEn as text } from '../../../constants/strings/meetingDutyEn';
import { styles } from '../../styles/publishers/publishers.styles';
import type { useDutyOverview } from '../../hooks/useDutyOverview';

type Props = ReturnType<typeof useDutyOverview> & {
  readonly onEdit?: (meetingId: string) => void;
  readonly onPublishers?: () => void;
};

export default function DutyOverviewView(model: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={model.entries}
        keyExtractor={meeting => meeting.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.group}>
            <Text accessibilityRole="header" style={styles.title}>
              {model.onEdit ? text.title : text.assignments}
            </Text>
            {model.onPublishers ? (
              <ActionButton label={text.publishers} onPress={model.onPublishers} />
            ) : null}
            {model.error ? (
              <>
                <Text accessibilityRole="alert" style={styles.error}>{model.error}</Text>
                <ActionButton label={text.reload} onPress={model.reload} />
              </>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !model.ready ? (
            <Text style={styles.text}>{text.loading}</Text>
          ) : !model.error ? (
            <Text style={styles.text}>{text.empty}</Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.publisher}>
            <Text accessibilityRole="header" style={styles.heading}>{item.title}</Text>
            <Text style={styles.secondary}>{item.date}</Text>
            {item.rows.map(row => (
              <View key={row.key} style={styles.group}>
                <Text style={styles.secondary}>{row.label}</Text>
                <Text style={styles.text}>{row.name}</Text>
                {row.notices.map(message => (
                  <Text
                    key={message}
                    style={styles.error}
                    accessibilityLabel={`${row.label}: ${message}`}
                  >
                    {message}
                  </Text>
                ))}
              </View>
            ))}
            {model.onEdit ? (
              <ActionButton label={text.edit} onPress={() => model.onEdit?.(item.id)} />
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
