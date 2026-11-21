import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/ActionButton';
import { styles } from '../../styles/publishers/publishers.styles';
import { workbookImportEn as text } from '../../../constants/strings/workbookImportEn';

import type { useWorkbookFile } from '../../hooks/useWorkbookFile';

type Props = ReturnType<typeof useWorkbookFile>;

export default function WorkbookFileView(model: Props) {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <FlatList
        data={model.pages}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.content}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        ListHeaderComponent={
          <View style={styles.group}>
            <Text style={styles.text}>{text.empty}</Text>

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