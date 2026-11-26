import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../common/AppButton';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import { workbookImportEn as text } from '../../../constants/strings/workbookImportEn';
import type { useWorkbookFile } from '../../hooks/useWorkbookFile';

type Props = ReturnType<typeof useWorkbookFile>;

export default function WorkbookFileView(model: Props) {
  const styles = useDocumentStyles();
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.group}>
          <Text style={styles.text}>{text.pdfAutomatic}</Text>
          <AppButton
            label={model.busy === 'selecting' ? text.selecting : text.select}
            disabled={model.busy !== null || !model.ready}
            onPress={model.select}
          />
          {!model.ready ? <Text style={styles.error}>{text.pdfProfileRequired}</Text> : null}
          {model.file ? (
            <Text style={styles.heading}>{model.file.name}</Text>
          ) : null}
          {model.busy === 'extracting' ? (
            <View style={styles.group}>
              <ActivityIndicator />
              <Text accessibilityLiveRegion="polite" style={styles.text}>{text.pdfImporting}</Text>
            </View>
          ) : null}
          {model.error ? (
            <Text accessibilityRole="alert" style={styles.error}>{model.error}</Text>
          ) : null}
          {model.report ? (
            <View style={styles.group}>
              <Text accessibilityLiveRegion="polite" style={styles.heading}>
                {text.importSummary(model.report.imported, model.report.skipped)}
              </Text>
              {model.report.issues.map((issue, index) => (
                <Text key={index} accessibilityRole="alert" style={styles.error}>{issue}</Text>
              ))}
              {model.report.meetingId ? (
                <AppButton label={text.openMeetings} onPress={model.openMeetings} />
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
