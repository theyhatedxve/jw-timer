import { KeyboardAvoidingView, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PROFILE_TEXT as text } from '../../../constants/strings/profileEn';
import { PROFILE_LIMITS } from '../../../backend/domain/profile/profile';

import type { useProfileForm } from '../../hooks/useProfileForm';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppInput from '../common/AppInput';
import AppScreen from '../common/AppScreen';

export default function ProfileForm(
  model: ReturnType<typeof useProfileForm>,
) {
  const { draft, saving } = model;

  return (
    <SafeAreaView
      className="flex-1 bg-app-canvas"
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView className="flex-1" behavior="height">
        <AppScreen>
          <Text
            accessibilityRole="header"
            className="text-app-title font-bold text-app-text"
          >
            {model.reviewing ? text.reviewTitle : text.title}
          </Text>
          <Text className="text-app-body text-app-secondary">
            {text.introduction}
          </Text>
          <Text className="text-app-body text-app-secondary">
            {text.interfaceLanguage}
          </Text>
          {model.error ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              className="text-app-body text-app-danger"
            >
              {text.errors[model.error]}
            </Text>
          ) : null}
          {model.reviewing ? (
            <>
              <AppCard>
                <Text className="text-app-body font-bold text-app-text">
                  {text.name}
                </Text>
                <Text className="text-app-body text-app-text">{draft.name}</Text>
                <Text className="text-app-body font-bold text-app-text">
                  {text.timezone}
                </Text>
                <Text className="text-app-body text-app-text">{draft.timezone}</Text>
                <Text className="text-app-body font-bold text-app-text">
                  {text.meetingLanguage}
                </Text>
                <Text className="text-app-body text-app-text">
                  {model.languageLabel}
                </Text>
              </AppCard>
              <AppButton
                label={saving ? text.saving : text.save}
                disabled={saving}
                onPress={model.confirmSave}
              />
              <AppButton
                label={text.edit}
                disabled={saving}
                onPress={() => model.setReviewing(false)}
              />
            </>
          ) : (
            <>
              <AppCard>
                <Text className="text-app-body font-bold text-app-text">
                  {text.name}
                </Text>
                <AppInput
                  accessibilityLabel={text.name}
                  value={draft.name}
                  onChangeText={name =>
                    model.setDraft(current => ({ ...current, name }))
                  }
                  maxLength={PROFILE_LIMITS.name}
                  autoCapitalize="words"
                  editable={!saving}
                />
                <Text className="text-app-body font-bold text-app-text">
                  {text.timezone}
                </Text>
                <AppInput
                  accessibilityLabel={text.timezone}
                  accessibilityHint={text.timezoneHint}
                  value={draft.timezone}
                  onChangeText={timezone =>
                    model.setDraft(current => ({ ...current, timezone }))
                  }
                  maxLength={PROFILE_LIMITS.timezone}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                />
                <Text className="text-app-body text-app-secondary">
                  {text.timezoneHint}
                </Text>
              </AppCard>
              <AppCard>
                <Text
                  accessibilityRole="header"
                  className="text-app-body font-bold text-app-text"
                >
                  {text.meetingLanguage}
                </Text>
                {(['war', 'en'] as const).map(language => {
                  const selected = draft.programLanguage === language;
                  const label = language === 'war' ? text.waray : text.english;

                  return (
                    <Pressable
                      key={language}
                      accessibilityRole="radio"
                      accessibilityLabel={label}
                      accessibilityState={{ checked: selected, disabled: saving }}
                      disabled={saving}
                      onPress={() =>
                        model.setDraft(current => ({
                          ...current,
                          programLanguage: language,
                        }))
                      }
                      className={
                        'min-h-app-touch rounded-app-button border p-app-medium active:opacity-75 ' +
                        (selected
                          ? 'border-app-brand bg-app-brand'
                          : 'border-app-border bg-app-surface')
                      }
                    >
                      <Text
                        className={
                          'text-app-body font-semibold ' +
                          (selected ? 'text-app-onBrand' : 'text-app-text')
                        }
                      >
                        {label}
                        {selected ? ` — ${text.selected}` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </AppCard>
              <AppButton
                label={text.review}
                disabled={saving}
                onPress={model.review}
              />
            </>
          )}
          {model.original ? (
            <AppButton
              label={text.back}
              disabled={saving}
              onPress={model.leave}
            />
          ) : null}
        </AppScreen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
