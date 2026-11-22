import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/AppButton';
import WatchtowerImportView from './WatchtowerImportView';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import { workbookImportEn as text } from '../../../constants/strings/workbookImportEn';

import { MeetingField } from '../meetings/MeetingControls';
import { workbookParsingEn as parsingText } from '../../../constants/strings/workbookParsingEn';

import type { useWorkbookFile } from '../../hooks/useWorkbookFile';

type Props = ReturnType<typeof useWorkbookFile>;

export default function WorkbookFileView(model: Props) {
  const styles = useDocumentStyles();

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={model.pages}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.content}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        ListHeaderComponent={
          <View style={styles.group}>
            <Text style={styles.text}>{text.empty}</Text>

            <WatchtowerImportView model={model.watchtower} />

            {model.pages.length > 0 &&
            model.watchtower.candidates.length === 0 ? (
              <>
                <MeetingField
                  label={parsingText.year}
                  hint={parsingText.yearHint}
                  value={model.year}
                  editable={model.busy === null}
                  keyboardType="number-pad"
                  onChangeText={model.setYear}
                />

                <Text accessibilityRole="header" style={styles.heading}>
                  {parsingText.candidates}
                </Text>
                <Text style={styles.secondary}>
                  {parsingText.scope}
                </Text>

                {model.candidates.length === 0 ? (
                  <Text style={styles.error}>{parsingText.none}</Text>
                ) : null}

                {model.candidates.map(candidate => (
                  <View key={candidate.key} style={styles.publisher}>
                    <Text style={styles.heading}>
                      {candidate.draft.title}
                    </Text>
                    <Text style={styles.secondary}>
                      {parsingText.page(candidate.page)}
                    </Text>

                    {candidate.warnings.map(warning => (
                      <Text key={warning} style={styles.error}>
                        {warning}
                      </Text>
                    ))}

                    <ActionButton
                      label={parsingText.open}
                      disabled={model.busy !== null}
                      onPress={() =>
                        model.openCandidate(candidate.key)
                      }
                    />
                  </View>
                ))}
              </>
            ) : null}
            <ActionButton
              label={
                model.busy === 'selecting'
                  ? text.selecting
                  : text.select
              }
              disabled={model.busy !== null}
              onPress={model.select}
            />

            {model.file ? (
              <>
                <Text style={styles.heading}>
                  {model.file.name}
                </Text>
                <Text style={styles.secondary}>
                  {text.size(model.file.size)}
                </Text>
                <Text style={styles.text}>{text.selected}</Text>

                <ActionButton
                  label={
                    model.busy === 'extracting'
                      ? text.extracting
                      : text.extract
                  }
                  disabled={model.busy !== null}
                  onPress={model.extract}
                />
              </>
            ) : null}

            {model.error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {model.error}
              </Text>
            ) : null}

            {model.pages.length > 0 ? (
              <>
                <Text accessibilityRole="header" style={styles.heading}>
                  {text.preview}
                </Text>
                <Text style={styles.secondary}>{text.review}</Text>
              </>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.publisher}>
            <Text accessibilityRole="header" style={styles.heading}>
              {text.page(index + 1)}
            </Text>
            <Text selectable style={styles.text}>
              {item || text.blankPage}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
