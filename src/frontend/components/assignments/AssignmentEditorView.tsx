import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PUBLISHER_ROLE_CODES } from '../../../backend/domain/publishers/publisher';
import { publisherEn } from '../../../constants/strings/publisherEn';
import { scheduleEn as text } from '../../../constants/strings/scheduleEn';
import ActionButton from '../common/AppButton';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import { useAssignmentEditorStyles } from '../../styles/assignments/useAssignmentEditorStyles';
import type { useAssignmentEditor } from '../../hooks/useAssignmentEditor';

type Props = ReturnType<typeof useAssignmentEditor>;

export default function AssignmentEditorView(model: Props) {
  const documentStyles = useDocumentStyles();
  const base = { ...documentStyles, title: documentStyles.heading };
  const styles = useAssignmentEditorStyles();
  const busy = model.saving || model.completed;
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={model.role ? model.eligible : []}
        keyExtractor={person => person.id}
        contentContainerStyle={base.content}
        ListHeaderComponent={
          <View style={base.group}>
            <Text accessibilityRole="header" style={base.title}>{model.partTitle || text.editor}</Text>
            {model.loadError ? <>
              <Text accessibilityRole="alert" style={base.error}>{model.loadError}</Text>
              <ActionButton label={text.reload} onPress={model.reload} disabled={busy} />
            </> : null}
            {model.context && !model.loadError ? <>
              {model.role === null ? <>
                <Text style={base.heading}>{text.chooseRole}</Text>
                {PUBLISHER_ROLE_CODES.map(role => <ActionButton
                  key={role} label={publisherEn.roles[role]} disabled={busy}
                  onPress={() => model.chooseRole(role)}
                />)}
              </> : <>
                <Text style={base.heading}>{publisherEn.roles[model.role]}</Text>
                <Text style={base.text}>{text.choosePublisher}</Text>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: model.publisherId === null, disabled: busy }}
                  disabled={busy} onPress={() => model.choosePublisher(null)}
                  style={[styles.option, model.publisherId === null && styles.selected]}
                >
                  <Text style={base.text}>{text.notAssigned}</Text>
                </Pressable>
                {model.selectedUnavailable ? <Text style={styles.warning}>{text.currentUnavailable}</Text> : null}
                {model.eligible.length === 0 ? <Text style={base.secondary}>{text.noEligible}</Text> : null}
                {model.issue ? <>
                  <Text accessibilityRole="alert" style={base.error}>{model.issue}</Text>
                  <ActionButton label={text.reload} onPress={model.reload} disabled={busy} />
                </> : null}
                <ActionButton label={busy ? text.saving : text.save} onPress={model.save} disabled={busy} />
              </>}
            </> : null}
            {!model.context && !model.loadError ? <Text style={base.text}>{text.loading}</Text> : null}
            <ActionButton label={text.cancel} onPress={model.leave} disabled={busy} />
          </View>
        }
        renderItem={({ item }) => <Pressable
          accessibilityRole="radio" accessibilityLabel={item.displayName}
          accessibilityState={{ checked: model.publisherId === item.id, disabled: busy || model.loadError !== null }}
          disabled={busy || model.loadError !== null}
          onPress={() => model.choosePublisher(item.id)}
          style={[styles.option, model.publisherId === item.id && styles.selected]}
        >
          <Text style={base.text}>{item.displayName}</Text>
        </Pressable>}
      />
    </SafeAreaView>
  );
}
