import { ScrollView, Text } from 'react-native';
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>{text.empty}</Text>

        <ActionButton
          label={model.busy ? text.selecting : text.select}
          onPress={model.select}
        />

        {model.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {model.error}
          </Text>
        ) : null}

        {model.file ? (
          <>
            <Text style={styles.heading}>{model.file.name}</Text>
            <Text style={styles.secondary}>
              {text.size(model.file.size)}
            </Text>
            <Text style={styles.text}>{text.selected}</Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}