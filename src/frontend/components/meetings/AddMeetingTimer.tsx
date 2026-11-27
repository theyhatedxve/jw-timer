import { useState } from 'react';
import { Text, View } from 'react-native';

import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import { MeetingField } from './MeetingControls';

export default function AddMeetingTimer({
  save, close,
}: {
  readonly save: (title: string, minutes: string) => string | null;
  readonly close: () => void;
}) {
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [error, setError] = useState('');

  return (
    <AppCard>
      <Text accessibilityRole="header" className="text-xl font-bold text-app-text">{text.addTimer}</Text>
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
