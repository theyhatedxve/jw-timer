import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import type { MeetingPartDraft } from '../../../backend/domain/meetings/meeting.types';
import { MEETING_LIMITS } from '../../../backend/domain/meetings/meetingValidation';
import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import AppButton from '../common/AppButton';
import { MeetingField } from './MeetingControls';

export default function MeetingPartEditor({
  part,
  save,
  remove,
  close,
}: {
  readonly part: MeetingPartDraft;
  readonly save: (part: MeetingPartDraft) => string | null;
  readonly remove: () => string | null;
  readonly close: () => void;
}) {
  const [title, setTitle] = useState(part.title);
  const [duration, setDuration] = useState(text.clock(part.durationSeconds));
  const [error, setError] = useState('');

  function apply() {
    const match = /^(\d{1,4}):([0-5]\d)$/.exec(duration.trim());
    const seconds = match ? Number(match[1]) * 60 + Number(match[2]) : -1;
    if (seconds < 0 || seconds > MEETING_LIMITS.durationSeconds || (part.isTimed && seconds === 0)) {
      setError(text.invalidPartDuration);
      return;
    }
    const message = save({ ...part, title: title.trim(), durationSeconds: seconds, isTimed: seconds > 0 });
    if (message) setError(message);
    else close();
  }

  function confirmDelete() {
    Alert.alert(text.deletePart, text.deletePartPrompt(part.title), [
      { text: text.cancel, style: 'cancel' },
      { text: text.deletePart, style: 'destructive', onPress: () => {
        const message = remove();
        if (message) setError(message);
        else close();
      } },
    ]);
  }

  return (
    <View className="gap-app-small border-t border-app-border bg-app-canvas p-app-medium">
      <MeetingField label={text.timerName} value={title} onChangeText={setTitle} />
      <MeetingField label={text.partDuration} value={duration} onChangeText={setDuration} />
      {error ? <Text accessibilityRole="alert" className="text-app-body text-app-danger">{error}</Text> : null}
      <AppButton label={text.savePart} onPress={apply} />
      <AppButton label={text.deletePart} onPress={confirmDelete} />
      <AppButton label={text.cancel} onPress={close} />
    </View>
  );
}
