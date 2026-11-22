import { Text, View } from 'react-native';
import type { SyncPreview } from '../../../backend/domain/sync/syncTypes';
import { syncEn as text } from '../../../constants/strings/syncEn';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import ReceivedScheduleView from '../devices/ReceivedScheduleView';
import SyncDatasetDetails from './SyncDatasetDetails';

export default function SyncPreviewView({ preview }: { readonly preview: SyncPreview }) {
  const styles = useDocumentStyles();
  return <View style={styles.group}>
    <Text accessibilityRole="alert" style={styles.text}>{text.previewNotice}</Text>
    <Text accessibilityRole="header" style={styles.heading}>{text.current}</Text>
    {preview.current ? <ReceivedScheduleView schedule={preview.current} /> : <Text style={styles.secondary}>{text.none}</Text>}
    {preview.currentDataset ? <SyncDatasetDetails dataset={preview.currentDataset} /> : null}
    <Text accessibilityRole="header" style={styles.heading}>{text.candidate}</Text>
    <ReceivedScheduleView schedule={preview.candidate} />
    <SyncDatasetDetails dataset={preview.candidateDataset} />
  </View>;
}
