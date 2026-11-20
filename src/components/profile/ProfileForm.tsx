import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../common/ActionButton';
import { colors, dimensions, spacing, typography } from '../../constants/theme';
import { PROFILE_TEXT } from '../../constants/strings/profileEn';
import { PROFILE_LIMITS } from '../../state/profile/profile';
import type { useProfileForm } from '../../hooks/useProfileForm';

export default function ProfileForm({ original, draft, setDraft, reviewing, setReviewing, saving, error, review, confirmSave, leave, languageLabel }: ReturnType<typeof useProfileForm>) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior="height"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text accessibilityRole="header" style={styles.title}>
            {reviewing
              ? PROFILE_TEXT.reviewTitle
              : PROFILE_TEXT.title}
          </Text>

          <Text style={styles.body}>
            {PROFILE_TEXT.introduction}
          </Text>

          <Text style={styles.body}>
            {PROFILE_TEXT.interfaceLanguage}
          </Text>

          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {PROFILE_TEXT.errors[error]}
            </Text>
          )}

          {reviewing ? (
            <>
              <Text style={styles.label}>
                {PROFILE_TEXT.name}
              </Text>
              <Text style={styles.body}>{draft.name}</Text>

              <Text style={styles.label}>
                {PROFILE_TEXT.timezone}
              </Text>
              <Text style={styles.body}>{draft.timezone}</Text>

              <Text style={styles.label}>
                {PROFILE_TEXT.meetingLanguage}
              </Text>
              <Text style={styles.body}>{languageLabel}</Text>

              <ActionButton
                label={
                  saving
                    ? PROFILE_TEXT.saving
                    : PROFILE_TEXT.save
                }
                disabled={saving}
                onPress={confirmSave}
              />

              <ActionButton
                label={PROFILE_TEXT.edit}
                disabled={saving}
                onPress={() => setReviewing(false)}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>
                {PROFILE_TEXT.name}
              </Text>

              <TextInput
                accessibilityLabel={PROFILE_TEXT.name}
                value={draft.name}
                onChangeText={(name) =>
                  setDraft((current) => ({
                    ...current,
                    name,
                  }))
                }
                maxLength={PROFILE_LIMITS.name}
                autoCapitalize="words"
                style={styles.input}
              />

              <Text style={styles.label}>
                {PROFILE_TEXT.timezone}
              </Text>

              <TextInput
                accessibilityLabel={PROFILE_TEXT.timezone}
                accessibilityHint={PROFILE_TEXT.timezoneHint}
                value={draft.timezone}
                onChangeText={(timezone) =>
                  setDraft((current) => ({
                    ...current,
                    timezone,
                  }))
                }
                maxLength={PROFILE_LIMITS.timezone}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <Text style={styles.body}>
                {PROFILE_TEXT.timezoneHint}
              </Text>

              <Text style={styles.label}>
                {PROFILE_TEXT.meetingLanguage}
              </Text>

              {(['war', 'en'] as const).map((language) => {
                const selected =
                  draft.programLanguage === language;

                const label =
                  language === 'war'
                    ? PROFILE_TEXT.waray
                    : PROFILE_TEXT.english;

                return (
                  <Pressable
                    key={language}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityState={{ checked: selected }}
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        programLanguage: language,
                      }))
                    }
                    style={[
                      styles.option,
                      selected && styles.selectedOption,
                    ]}
                  >
                    <Text style={styles.body}>
                      {label}
                      {selected
                        ? ` — ${PROFILE_TEXT.selected}`
                        : ''}
                    </Text>
                  </Pressable>
                );
              })}

              <ActionButton
                label={PROFILE_TEXT.review}
                onPress={review}
              />
            </>
          )}

          {original && (
            <ActionButton
              label={PROFILE_TEXT.back}
              disabled={saving}
              onPress={leave}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    width: '100%',
    maxWidth: dimensions.contentWidth,
    alignSelf: 'center',
    padding: spacing.large,
    gap: spacing.medium,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  body: {
    color: colors.secondary,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  input: {
    minHeight: dimensions.minimumTouchTarget,
    padding: spacing.medium,
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.buttonRadius,
    fontSize: typography.body,
  },
  option: {
    minHeight: dimensions.minimumTouchTarget,
    justifyContent: 'center',
    padding: spacing.medium,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.buttonRadius,
  },
  selectedOption: {
    borderColor: colors.brand,
    backgroundColor: colors.surface,
  },
});
