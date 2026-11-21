import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Alert } from 'react-native';

import {
  CommonActions,
  useNavigation,
  usePreventRemove,
} from '@react-navigation/native';

import { publisherEn as text } from '../../constants/strings/publisherEn';

import type {
  PublisherDraft,
  PublisherIssue,
  PublisherRole,
} from '../../backend/domain/publishers/publisher';

import type {
  PublisherService,
  PublisherTarget,
} from '../../backend/services/publisherService';

export function usePublisherEditor(
  service: PublisherService,
  publisherId: string | undefined,
) {
  const navigation = useNavigation();
  const savingRef = useRef(false);

  const [draft, setDraft] = useState<PublisherDraft | null>(null);
  const [baseline, setBaseline] = useState('');
  const [target, setTarget] =
    useState<PublisherTarget | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [issue, setIssue] = useState<PublisherIssue | null>(null);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const load = useCallback(() => {
    let value: PublisherDraft = {
      displayName: '',
      isActive: true,
      roles: [],
    };

    let savedTarget: PublisherTarget | null = null;

    if (publisherId !== undefined) {
      const result = service.get(publisherId);

      if (!result.ok) {
        setLoadError(result.error.message);
        return;
      }

      if (!result.value) {
        setLoadError(text.unavailable);
        return;
      }

      value = {
        displayName: result.value.displayName,
        isActive: result.value.isActive,
        roles: [...result.value.roles],
      };

      savedTarget = {
        id: result.value.id,
        revision: result.value.revision,
      };
    }

    setDraft(value);
    setBaseline(JSON.stringify(value));
    setTarget(savedTarget);
    setLoadError(null);
    setIssue(null);
    setSaving(false);
    setCompleted(false);
    savingRef.current = false;
  }, [service, publisherId]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    draft !== null &&
    JSON.stringify(draft) !== baseline;

  usePreventRemove(dirty && !completed, ({ data }) => {
    Alert.alert(text.discardTitle, text.discardMessage, [
      { text: text.keepEditing, style: 'cancel' },
      {
        text: text.discard,
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const leave = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{
          name: 'Main',
          params: { screen: 'Assignments' },
        }],
      }),
    );
  }, [navigation]);

  useEffect(() => {
    if (completed) leave();
  }, [completed, leave]);

  function change(
    update: (current: PublisherDraft) => PublisherDraft,
  ) {
    if (savingRef.current || completed) return;

    setIssue(null);
    setDraft(current => current ? update(current) : current);
  }

  function setRole(role: PublisherRole, enabled: boolean) {
    change(current => ({
      ...current,
      roles: enabled
        ? current.roles.includes(role)
          ? current.roles
          : [...current.roles, role]
        : current.roles.filter(selected => selected !== role),
    }));
  }

  function reload() {
    if (!dirty) {
      load();
      return;
    }

    Alert.alert(text.reloadTitle, text.reloadMessage, [
      { text: text.keepEditing, style: 'cancel' },
      {
        text: text.reload,
        style: 'destructive',
        onPress: load,
      },
    ]);
  }

  function save() {
    if (!draft || savingRef.current || completed) return;

    savingRef.current = true;
    setSaving(true);
    setIssue(null);

    const result = service.save(draft, target);

    if (!result.ok) {
      savingRef.current = false;
      setSaving(false);
      setIssue(result.error);
      return;
    }

    setCompleted(true);
  }

  return {
    draft,
    dirty,
    loadError,
    issue,
    saving,
    completed,
    editing: publisherId !== undefined,
    reload,
    leave,
    save,
    setRole,
    setName: (displayName: string) =>
      change(current => ({ ...current, displayName })),
    setActive: (isActive: boolean) =>
      change(current => ({ ...current, isActive })),
  };
}