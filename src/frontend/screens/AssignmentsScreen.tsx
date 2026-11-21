import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SchedulesView from '../components/assignments/SchedulesView';
import PublishersListView from '../components/publishers/PublishersListView';
import { useSchedules } from '../hooks/useSchedules';
import { usePublishers } from '../hooks/usePublishers';
import { scheduleService } from '../../bootstrap/scheduleDependencies';
import { publisherService } from '../../bootstrap/publisherDependencies';
import { scheduleEn } from '../../constants/strings/scheduleEn';
import { styles } from '../styles/assignments/schedules.styles';
import { styles as base } from '../styles/publishers/publishers.styles';

function SchedulesPanel() {
  const model = useSchedules(scheduleService);
  return <SchedulesView {...model} />;
}

function PublishersPanel() {
  const model = usePublishers(publisherService);
  return <PublishersListView {...model} />;
}

export default function AssignmentsScreen() {
  const [panel, setPanel] = useState<'schedules' | 'publishers'>('schedules');
  const panels = [
    { id: 'schedules', label: scheduleEn.schedules },
    { id: 'publishers', label: scheduleEn.publishers },
  ] as const;
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['left', 'right']}>
        <View style={styles.tabs}>
          {panels.map(item => <Pressable
            key={item.id} accessibilityRole="tab"
            accessibilityState={{ selected: panel === item.id }}
            onPress={() => setPanel(item.id)}
            style={[styles.tab, panel === item.id && styles.selected]}
          >
            <Text style={base.text}>{item.label}</Text>
          </Pressable>)}
        </View>
      </SafeAreaView>
      {panel === 'schedules' ? <SchedulesPanel /> : <PublishersPanel />}
    </View>
  );
}
