import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { CommonActions, useNavigation, usePreventRemove } from '@react-navigation/native';
import { PROFILE_TEXT } from '../constants/strings/profileEn';
import { validateProfile, type ProfileDraft, type ProfileErrorCode } from '../state/profile/profile';
import { useLocalProfile } from './useLocalProfile';

function deviceTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
  catch { return 'UTC'; }
}

export function useProfileForm() {
  const navigation = useNavigation();
  const { state, save } = useLocalProfile();
  const [original] = useState(state.status === 'ready' ? state.profile : null);
  const [initialDraft] = useState<ProfileDraft>(() => ({
    name: original?.name ?? '',
    timezone: original?.timezone ?? deviceTimezone(),
    programLanguage: original?.programLanguage ?? 'war',
  }));
  const [draft, setDraft] = useState<ProfileDraft>(initialDraft);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<ProfileErrorCode | null>(null);
  const savingRef = useRef(false);
  const dirty = draft.name !== initialDraft.name || draft.timezone !== initialDraft.timezone || draft.programLanguage !== initialDraft.programLanguage;

  usePreventRemove(dirty && !completed, ({ data }) => {
    Alert.alert(PROFILE_TEXT.discardTitle, PROFILE_TEXT.discardMessage, [
      { text: PROFILE_TEXT.keepEditing, style: 'cancel' },
      { text: PROFILE_TEXT.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const leave = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Settings' } }],
    }));
  }, [navigation]);

  // Navigate only after the completed render has disabled removal prevention.
  useEffect(() => {
    if (completed && original) leave();
  }, [completed, original, leave]);

  function review() {
    const result = validateProfile(draft);
    if (!result.ok) { setError(result.code); return; }
    setDraft(result.value);
    setError(null);
    setReviewing(true);
  }

  function confirmSave() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const result = save(draft, original?.revision ?? null);
    if (!result.ok) {
      savingRef.current = false;
      setSaving(false);
      setError(result.code);
      return;
    }
    setCompleted(true);
  }

  return {
    original, draft, setDraft, reviewing, setReviewing, saving, error, review, confirmSave, leave,
    languageLabel: draft.programLanguage === 'war' ? PROFILE_TEXT.waray : PROFILE_TEXT.english,
  };
}
