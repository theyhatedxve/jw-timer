import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/ActionButton';

import { meetingDutyEn as text } from '../../../constants/strings/meetingDutyEn';
import { styles as base } from '../../styles/publishers/publishers.styles';
import { styles } from '../../styles/assignments/schedules.styles';

import type { useMeetingDuties } from '../../hooks/useMeetingDuties';

type Props = ReturnType<typeof useMeetingDuties>;

export default function MeetingDutiesView(model: Props) {
  return (
    <SafeAreaView
      style={base.screen}
      edges={['left', 'right', 'bottom']}
    >
      <FlatList
        data={model.selected ? model.eligible : []}
        keyExtractor={person => person.id}
        contentContainerStyle={base.content}
        ListHeaderComponent={
          <View style={base.group}>
            <Text accessibilityRole="header" style={base.title}>
              {model.title}
            </Text>

            {model.error ? (
              <>
                <Text accessibilityRole="alert" style={base.error}>
                  {model.error}
                </Text>
                <ActionButton
                  label={text.reload}
                  disabled={model.busy}
                  onPress={model.reload}
                />
              </>
            ) : null}

            {!model.ready && !model.error ? (
              <Text style={base.text}>{text.loading}</Text>
            ) : null}

            {model.ready && !model.selected ? (
              model.rows.map(row => (
                <View key={row.key} style={styles.part}>
                  <Text style={base.heading}>{row.label}</Text>
                  <Text style={base.text}>{row.name}</Text>

                  {row.needsReview ? (
                    <Text style={styles.warning}>{text.review}</Text>
                  ) : null}

                  <ActionButton
                    label={`${text.assign}: ${row.label}`}
                    disabled={model.busy}
                    onPress={() => model.selectDuty(row.key)}
                  />
                </View>
              ))
            ) : null}

            {model.ready && model.selected ? (
              <>
                <Text style={base.heading}>
                  {model.current?.label}
                </Text>
                <Text style={base.text}>
                  {text.current}: {model.current?.name}
                </Text>

                <ActionButton
                  label={text.notAssigned}
                  disabled={model.busy}
                  onPress={() => model.assign(null)}
                />

                {model.eligible.length === 0 ? (
                  <Text style={base.secondary}>{text.noEligible}</Text>
                ) : null}

                <ActionButton
                  label={text.back}
                  disabled={model.busy}
                  onPress={() => model.selectDuty(null)}
                />
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ActionButton
            label={`${text.assign}: ${item.displayName}`}
            disabled={model.busy}
            onPress={() => model.assign(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}