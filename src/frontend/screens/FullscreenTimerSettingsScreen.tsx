import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import {
  DEFAULT_FULLSCREEN_TIMER,
  FULLSCREEN_TIMER_SIZES,
  FULLSCREEN_TIMER_DISPLAYS,
  isFullscreenTimerPreferences,
  isTimerColor,
  type FullscreenTimerPreferences,
} from '../../backend/domain/timer/fullscreenTimer';
import { fullscreenTimerEn as text } from '../../constants/strings/fullscreenTimerEn';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import ColorPickerField from '../components/common/ColorPickerField';
import AppScreen from '../components/common/AppScreen';
import FullscreenTimerFace from '../components/timer/FullscreenTimerFace';
import { fullscreenColors } from '../utils/timerPresentation';
import { useFullscreenTimer } from '../context/FullscreenTimerContext';

const colorFields = ['background', 'digits', 'overtime', 'remaining'] as const;
const switches = ['showCurrentPart', 'showProgress'] as const;

export default function FullscreenTimerSettingsScreen() {
  const model = useFullscreenTimer();
  const [draft, setDraft] = useState(model.preferences);
  const [overtime, setOvertime] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  const preview: FullscreenTimerPreferences = {
    ...draft,
    background: isTimerColor(draft.background) ? draft.background : model.preferences.background,
    digits: isTimerColor(draft.digits) ? draft.digits : model.preferences.digits,
    overtime: isTimerColor(draft.overtime) ? draft.overtime : model.preferences.overtime,
    remaining: isTimerColor(draft.remaining) ? draft.remaining : model.preferences.remaining,
  };
  const colors = fullscreenColors(preview);
  const defaults = fullscreenColors(DEFAULT_FULLSCREEN_TIMER);

  function apply(value: FullscreenTimerPreferences) {
    if (!isFullscreenTimerPreferences(value)) {
      setMessage(text.invalid);
      setFailed(true);
      return;
    }
    const saved = model.save(value);
    setFailed(!saved);
    setMessage(saved ? text.saved : text.saveError);
    if (saved) setDraft(value);
  }

  return (
    <AppScreen>
      <Text accessibilityRole="header" className="text-app-body font-bold text-app-text">{text.preview}</Text>
      <View className="rounded-app-card p-app-medium" style={{ backgroundColor: colors.background }}>
        <FullscreenTimerFace
          preferences={preview}
          digits={overtime ? '+00:12' : '04:42'}
          remainingMs={overtime ? -12_000 : 282_000}
          durationMs={300_000}
          stateLabel={overtime ? text.sampleOvertime : text.sampleState}
          durationLabel="05:00"
          partTitle={text.samplePart}
          progress={overtime ? 100 : 6}
          overtime={overtime}
          fontSize={56}
          meetingTitle={text.sampleMeeting}
          layout="preview"
          status="running"
        />
      </View>
      <View className="flex-row items-center gap-app-small">
        <Text className="flex-1 text-app-body text-app-text">{text.previewOvertime}</Text>
        <Switch accessibilityLabel={text.previewOvertime} value={overtime} onValueChange={setOvertime} />
      </View>

      <Text accessibilityRole="header" className="text-app-body font-bold text-app-text">{text.displayMode}</Text>
      <View className="gap-app-small">
        {FULLSCREEN_TIMER_DISPLAYS.map(displayMode => (
          <AppButton
            key={displayMode}
            label={text.displays[displayMode]}
            selected={draft.displayMode === displayMode}
            onPress={() => setDraft(current => ({ ...current, displayMode }))}
          />
        ))}
      </View>
      {draft.displayMode !== 'digital' ? (
        <Text className="text-app-body text-app-secondary">{text.dialHint}</Text>
      ) : null}

      <Text accessibilityRole="header" className="text-app-body font-bold text-app-text">{text.size}</Text>
      <View className="flex-row gap-app-small">
        {FULLSCREEN_TIMER_SIZES.map(size => (
          <View key={size} className="flex-1">
            <AppButton
              label={text.sizes[size]}
              selected={draft.textSize === size}
              onPress={() => setDraft(current => ({ ...current, textSize: size }))}
            />
          </View>
        ))}
      </View>

      <Text className="text-app-body text-app-secondary">{text.colorHint}</Text>
      <AppCard>
        {colorFields.map(field => (
          <ColorPickerField
            key={field}
            label={text[field]}
            value={draft[field]}
            themeColor={defaults[field]}
            onChange={value => {
              setDraft(current => ({ ...current, [field]: value }));
              setMessage('');
              setFailed(false);
            }}
          />
        ))}
      </AppCard>

      {switches.map(field => {
        const label = field === 'showCurrentPart' ? text.currentPart : text.progress;
        return (
          <View key={field} className="flex-row items-center gap-app-medium">
            <Text className="flex-1 text-app-body text-app-text">{label}</Text>
            <Switch
              accessibilityLabel={label}
              value={draft[field]}
              onValueChange={value => setDraft(current => ({ ...current, [field]: value }))}
            />
          </View>
        );
      })}

      {model.loadFailed ? <Text accessibilityRole="alert" className="text-app-body text-app-danger">{text.loadError}</Text> : null}
      {message ? (
        <Text
          accessibilityRole={failed ? 'alert' : undefined}
          accessibilityLiveRegion="polite"
          className={failed ? 'text-app-body text-app-danger' : 'text-app-body text-app-text'}
        >
          {message}
        </Text>
      ) : null}
      <AppButton label={text.save} onPress={() => apply(draft)} />
      <AppButton label={text.reset} onPress={() => apply(DEFAULT_FULLSCREEN_TIMER)} />
      {model.loadFailed ? (
        <AppButton label={text.retry} onPress={() => {
          const restored = model.reload();
          if (restored) {
            setDraft(restored);
            setFailed(false);
            setMessage('');
          } else {
            setFailed(true);
            setMessage(text.loadError);
          }
        }} />
      ) : null}
    </AppScreen>
  );
}
