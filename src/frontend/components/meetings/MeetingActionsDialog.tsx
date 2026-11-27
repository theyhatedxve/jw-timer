import { useState } from 'react';
import { Modal, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SavedMeeting } from '../../../backend/services/meetingService';
import { dimensions } from '../../../constants/theme';
import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import { workbookImportEn as importText } from '../../../constants/strings/workbookImportEn';
import { useAppTheme } from '../../context/AppearanceContext';
import type { useMeetings } from '../../hooks/useMeetings';
import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AddMeetingTimer from './AddMeetingTimer';

export default function MeetingActionsDialog({
  model, meeting, close,
}: {
  readonly model: ReturnType<typeof useMeetings>;
  readonly meeting: SavedMeeting | null;
  readonly close: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const { palette } = useAppTheme();
  return (
    <Modal visible transparent animationType="fade" supportedOrientations={['portrait', 'landscape']} onRequestClose={close}>
      <SafeAreaView className="flex-1 justify-center p-app-large" style={{ backgroundColor: palette.canvas + 'CC' }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ width: '100%', maxWidth: dimensions.contentWidth, alignSelf: 'center', flexGrow: 0 }}
        >
          {adding && meeting ? (
            <AddMeetingTimer
              save={(title, minutes) => model.addTimer(meeting, title, minutes)}
              close={close}
            />
          ) : (
            <AppCard>
              <Text accessibilityRole="header" className="text-xl font-bold text-app-text">{text.addOrImport}</Text>
              <AppButton label={text.addTimer} disabled={!meeting || model.online.busy} onPress={() => setAdding(true)} />
              <AppButton
                label={importText.wolShort}
                disabled={!model.online.ready || model.online.busy}
                onPress={() => { close(); model.online.run(); }}
              />
              <AppButton
                label={importText.localPdfShort}
                disabled={model.online.busy}
                onPress={() => { close(); model.importPdf(); }}
              />
              <AppButton label={text.cancel} onPress={close} />
            </AppCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
