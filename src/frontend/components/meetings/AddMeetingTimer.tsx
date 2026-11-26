import { useState } from 'react';
import { Text, View } from 'react-native';

import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import { MeetingField } from './MeetingControls';

export default function AddMeetingTimer({
  save,
}: {
  readonly save: (title: string, minutes: string) => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [error, setError] = useState('');

  function close() {
    setOpen(false);
    setTitle('');
    setMinutes('');
    setError('');
  }

  if (!open) return <AppButton label={text.addTimer} onPress={() => setOpen(true)} />;

  return (
    <AppCard>
      <MeetingField label={text.timerName} value={title} onChangeText={setTitle} />
      <MeetingField label={text.timerMinutes} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
      {error ? (
        <Text accessibilityRole="alert" className="text-app-body text-app-danger">{error}</Text>
      ) : null}
      <View className="gap-app-small">
        <AppButton label={text.saveTimer} onPress={() => {
          const message = save(title, minutes);
          if (message) setError(message);
          else close();
        }} />
        <AppButton label={text.cancel} onPress={close} />
      </View>
    </AppCard>
  );
}
