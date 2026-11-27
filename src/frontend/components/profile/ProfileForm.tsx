import { useRef, useState, type ReactNode } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PROFILE_TEXT as text } from '../../../constants/strings/profileEn';
import { PROFILE_LIMITS } from '../../../backend/domain/profile/profile';
import type { useProfileForm } from '../../hooks/useProfileForm';
import { useAppTheme } from '../../context/AppearanceContext';
import { useProfileStyles } from '../../styles/profile/profileForm.styles';

import AppIcon, { type AppIconName } from '../common/AppIcon';
import AppInput from '../common/AppInput';
import { OnboardingWaves } from '../onboarding/OnboardingArtwork';
import TimezonePicker from './TimezonePicker';

type Model = ReturnType<typeof useProfileForm>;

function ProfileSection({ title, icon, children }: {
  readonly title: string;
  readonly icon: AppIconName;
  readonly children: ReactNode;
}) {
  const styles = useProfileStyles();
  const { palette } = useAppTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <AppIcon name={icon} color={palette.brand} size={25} />
        <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ProfileAction({ label, icon, disabled, onPress, secondary = false }: {
  readonly label: string;
  readonly icon?: AppIconName;
  readonly disabled: boolean;
  readonly onPress: () => void;
  readonly secondary?: boolean;
}) {
  const styles = useProfileStyles();
  const { palette } = useAppTheme();
  const color = secondary ? palette.text : palette.onBrand;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, secondary && { backgroundColor: palette.surface, borderColor: palette.border }, { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 }]}
    >
      {icon ? <AppIcon name={icon} color={color} size={23} /> : null}
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function ReviewDetail({ label, value, icon }: {
  readonly label: string;
  readonly value: string;
  readonly icon: AppIconName;
}) {
  const styles = useProfileStyles();
  const { palette } = useAppTheme();
  return (
    <View style={styles.summary}>
      <AppIcon name={icon} color={palette.brand} size={24} />
      <View style={styles.summaryText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileForm(model: Model) {
  const { draft, saving, reviewing } = model;
  const { palette } = useAppTheme();
  const styles = useProfileStyles();
  const { width, fontScale } = useWindowDimensions();
  const stackedHero = width < 360 || fontScale > 1.25;
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const fieldError = model.error === 'name' || model.error === 'timezone' || model.error === 'language';

  function toTop() {
    Keyboard.dismiss();
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function back() {
    if (reviewing) {
      model.setReviewing(false);
      toTop();
    } else model.leave();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.fill} behavior="height">
        <ScrollView ref={scroll} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={reviewing ? text.edit : text.back}
                accessibilityState={{ disabled: saving }}
                disabled={saving}
                onPress={back}
                style={({ pressed }) => [styles.back, { opacity: saving ? 0.5 : pressed ? 0.75 : 1 }]}
              >
                <AppIcon name="arrowLeft" color={palette.text} size={26} />
              </Pressable>
              <Text accessibilityRole="header" style={styles.navigationTitle}>{reviewing ? text.reviewTitle : text.title}</Text>
              <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.badge}>
                <AppIcon name="settings" color={palette.brand} size={25} />
              </View>
            </View>

            <View style={styles.hero}>
              <View style={[styles.heroCopy, stackedHero && styles.stackedHeroCopy]}>
                <Text accessibilityRole="header" style={styles.heroTitle}>{reviewing ? text.reviewTitle : text.title}</Text>
                <Text style={styles.body}>{text.introduction}</Text>
              </View>
              <Image source={require('../../assets/onboarding/meeting-hall.png')} resizeMode="contain" accessible={false} style={[styles.hall, stackedHero && styles.stackedHall]} />
              <View accessible={false} pointerEvents="none" style={styles.waves}><OnboardingWaves /></View>
            </View>

            <View style={styles.form}>
              {model.error && (reviewing || !fieldError) ? (
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{text.errors[model.error]}</Text>
              ) : null}
              {reviewing ? (
                <>
                  <ProfileSection title={text.details} icon="assignments">
                    <ReviewDetail label={text.name} value={draft.name} icon="home" />
                    <ReviewDetail label={text.timezone} value={draft.timezone} icon="clock" />
                  </ProfileSection>
                  <ProfileSection title={text.meetingLanguage} icon="globe">
                    <ReviewDetail label={text.selectedLanguage} value={model.languageLabel} icon="check" />
                    <Text style={styles.footnote}>{text.interfaceLanguage}</Text>
                  </ProfileSection>
                  <View style={styles.actions}>
                    <ProfileAction label={saving ? text.saving : text.save} icon="check" disabled={saving} onPress={model.confirmSave} />
                    <ProfileAction label={text.edit} disabled={saving} onPress={() => { model.setReviewing(false); toTop(); }} secondary />
                  </View>
                </>
              ) : (
                <>
                  <ProfileSection title={text.details} icon="assignments">
                    <View style={styles.field}>
                      <Text style={styles.label}>{text.name}</Text>
                      <View style={[styles.inputRow, (nameFocused || model.error === 'name') && { borderColor: model.error === 'name' ? palette.danger : palette.brand }]}>
                        <AppIcon name="home" color={palette.brand} size={23} />
                        <AppInput
                          accessibilityLabel={text.name}
                          value={draft.name}
                          placeholder={text.namePlaceholder}
                          onChangeText={name => model.setDraft(current => ({ ...current, name }))}
                          onFocus={() => setNameFocused(true)}
                          onBlur={() => setNameFocused(false)}
                          maxLength={PROFILE_LIMITS.name}
                          autoCapitalize="words"
                          editable={!saving}
                          returnKeyType="next"
                          onSubmitEditing={() => { Keyboard.dismiss(); setTimezoneOpen(true); }}
                          style={styles.input}
                        />
                      </View>
                      {model.error === 'name' ? <Text accessibilityRole="alert" style={styles.error}>{text.errors.name}</Text> : null}
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>{text.timezone}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={text.timezone + ', ' + draft.timezone}
                        accessibilityHint={text.timezoneHint}
                        accessibilityState={{ expanded: timezoneOpen, disabled: saving }}
                        disabled={saving}
                        onPress={() => { Keyboard.dismiss(); setTimezoneOpen(true); }}
                        style={({ pressed }) => [styles.inputRow, model.error === 'timezone' && { borderColor: palette.danger }, { opacity: pressed ? 0.75 : 1 }]}
                      >
                        <AppIcon name="clock" color={palette.brand} size={24} />
                        <Text style={styles.value}>{draft.timezone}</Text>
                        <AppIcon name="chevronDown" color={palette.secondary} size={22} />
                      </Pressable>
                      <Text style={styles.body}>{text.timezoneHint}</Text>
                      {model.error === 'timezone' ? <Text accessibilityRole="alert" style={styles.error}>{text.errors.timezone}</Text> : null}
                    </View>
                  </ProfileSection>

                  <ProfileSection title={text.meetingLanguage} icon="globe">
                    <View accessibilityRole="radiogroup" accessibilityLabel={text.meetingLanguage} style={styles.options}>
                      {(['war', 'en'] as const).map(language => {
                        const selected = draft.programLanguage === language;
                        const color = selected ? palette.onBrand : palette.text;
                        return (
                          <Pressable
                            key={language}
                            accessibilityRole="radio"
                            accessibilityLabel={language === 'war' ? text.waray : text.english}
                            accessibilityState={{ checked: selected, disabled: saving }}
                            disabled={saving}
                            onPress={() => model.setDraft(current => ({ ...current, programLanguage: language }))}
                            style={({ pressed }) => [styles.option, selected && { backgroundColor: palette.brand, borderColor: palette.brand }, { opacity: saving ? 0.5 : pressed ? 0.75 : 1 }]}
                          >
                            <View style={styles.checkSlot}>{selected ? <AppIcon name="check" color={color} size={23} /> : null}</View>
                            <Text style={[styles.optionText, { color }]}>{language === 'war' ? text.waray : text.english}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {model.error === 'language' ? <Text accessibilityRole="alert" style={styles.error}>{text.errors.language}</Text> : null}
                    <Text style={styles.footnote}>{text.interfaceLanguage}</Text>
                  </ProfileSection>

                  <View style={styles.actions}>
                    <ProfileAction label={text.review} icon="arrowRight" disabled={saving} onPress={() => { model.review(); toTop(); }} />
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {timezoneOpen ? <TimezonePicker value={draft.timezone} select={timezone => model.setDraft(current => ({ ...current, timezone }))} close={() => setTimezoneOpen(false)} /> : null}
    </SafeAreaView>
  );
}
