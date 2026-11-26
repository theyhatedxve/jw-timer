import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AccessibilityInfo,
  Alert,
} from 'react-native';

import {
  CommonActions,
  useNavigation,
  usePreventRemove,
} from '@react-navigation/native';

import { useLocalProfile } from './useLocalProfile';

import type {
  MeetingDraft,
  MeetingPartKind,
  MeetingValidationError,
} from '../../backend/domain/meetings/meeting.types';

import type {
  MeetingService,
  MeetingTarget,
} from '../../backend/services/meetingService';

import { MEETING_LIMITS } from '../../backend/domain/meetings/meetingValidation';
import { validateMeetingDraft } from '../../backend/domain/meetings/meetingValidation';
import type { WorkbookSource } from '../../backend/domain/imports/workbookSource';
import { workbookParsingEn } from '../../constants/strings/workbookParsingEn';

interface EditorPart {
  readonly key: string;
  readonly id?: string;
  readonly title: string;
  readonly kind: MeetingPartKind;
  readonly durationText: string;
  readonly isTimed: boolean;
}

interface EditorSection {
  readonly key: string;
  readonly id?: string;
  readonly title: string;
  readonly parts: readonly EditorPart[];
}

interface EditorForm {
  readonly importSource?: WorkbookSource;
  readonly title: string;
  readonly meetingType: MeetingDraft['meetingType'];
  readonly meetingDate: string;
  readonly startLocalTime: string;
  readonly endLocalTime: string;
  readonly timezone: string;
  readonly programLanguage: MeetingDraft['programLanguage'];
  readonly sections: readonly EditorSection[];
}

type HeaderField = Exclude<
  keyof EditorForm,
  'sections' | 'importSource'
>;

type PartChanges = Partial<
  Pick<
    EditorPart,
    'title' | 'kind' | 'durationText' | 'isTimed'
  >
>;

function localDate(): string {
  const now = new Date();

  return [
    String(now.getFullYear()).padStart(4, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function toForm(
  draft: MeetingDraft,
  nextKey: () => string,
): EditorForm {
  return {
    ...draft,
    startLocalTime: draft.startLocalTime ?? '',
    endLocalTime: draft.endLocalTime ?? '',
    sections: draft.sections.map(section => ({
      key: nextKey(),
      id: section.id,
      title: section.title,
      parts: section.parts.map(part => ({
        key: nextKey(),
        id: part.id,
        title: part.title,
        kind: part.kind,
        durationText: String(part.durationSeconds),
        isTimed: part.isTimed,
      })),
    })),
  };
}

function toDraft(form: EditorForm): MeetingDraft {
  return {
    importSource: form.importSource,
    title: form.title,
    meetingType: form.meetingType,
    meetingDate: form.meetingDate,
    startLocalTime: form.startLocalTime.trim() || null,
    endLocalTime: form.endLocalTime.trim() || null,
    timezone: form.timezone.trim(),
    programLanguage: form.programLanguage,
    sections: form.sections.map(section => ({
      id: section.id,
      title: section.title,
      parts: section.parts.map(part => ({
        id: part.id,
        title: part.title,
        kind: part.kind,
        durationSeconds: /^\d+$/.test(part.durationText)
          ? Number(part.durationText)
          : Number.NaN,
        isTimed: part.isTimed,
      })),
    })),
  };
}

function moveItem<T>(
  items: readonly T[],
  index: number,
  direction: -1 | 1,
): readonly T[] {
  const destination = index + direction;
  const item = items[index];

  if (
    item === undefined ||
    destination < 0 ||
    destination >= items.length
  ) {
    return items;
  }

  const result = [...items];
  result.splice(index, 1);
  result.splice(destination, 0, item);

  return result;
}

export function useMeetingEditor(
  service: MeetingService,
  meetingId: string | undefined,
  importDraft: unknown = undefined,
) {
  const navigation = useNavigation();
  const { state: profileState } = useLocalProfile();

  const [defaultTimezone] = useState(() => {
    if (
      profileState.status === 'ready' &&
      profileState.profile
    ) {
      return profileState.profile.timezone;
    }

    return 'UTC';
  });

  const keyCounter = useRef(0);
  const savingRef = useRef(false);

  const [form, setForm] = useState<EditorForm | null>(null);
  const [baseline, setBaseline] = useState('');
  const [target, setTarget] = useState<MeetingTarget | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [issue, setIssue] =
    useState<MeetingValidationError | null>(null);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const nextKey = useCallback(() => {
    keyCounter.current += 1;
    return `editor-${keyCounter.current}`;
  }, []);

  const load = useCallback(() => {
    let draft: MeetingDraft;
    let savedTarget: MeetingTarget | null = null;

    if (importDraft !== undefined) {
      const parsed = validateMeetingDraft(importDraft);

      if (
        meetingId !== undefined ||
        !parsed.ok ||
        !parsed.value.importSource
      ) {
        setLoadError(workbookParsingEn.invalidDraft);
        return;
      }

      draft = parsed.value;
    } else if (meetingId !== undefined) {
      const result = service.get(meetingId);

      if (!result.ok) {
        setLoadError(result.error.message);
        return;
      }

      if (!result.value) {
        setLoadError('This meeting is no longer available.');
        return;
      }

      draft = result.value.draft;
      savedTarget = {
        id: result.value.id,
        revision: result.value.revision,
      };
    } else {
      draft = {
        title: '',
        meetingType: 'midweek',
        meetingDate: localDate(),
        startLocalTime: null,
        timezone: defaultTimezone,
        programLanguage: 'en',
        sections: [],
      };
    }

    const loadedForm = toForm(draft, nextKey);

    const preparedForm = importDraft === undefined
      ? loadedForm
      : {
          ...loadedForm,
          sections: loadedForm.sections.map(section => ({
            ...section,
            parts: section.parts.map(part => ({
              ...part,
              isTimed: part.durationText === '0'
                ? true
                : part.isTimed,
            })),
          })),
        };

    setForm(preparedForm);
    setBaseline(
      importDraft === undefined
        ? JSON.stringify(preparedForm)
        : '',
    );
    setTarget(savedTarget);
    setLoadError(null);
    setIssue(null);
    setCompleted(false);
    setSaving(false);
    savingRef.current = false;
  }, [
    service,
    meetingId,
    importDraft,
    defaultTimezone,
    nextKey,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    form !== null &&
    JSON.stringify(form) !== baseline;

  usePreventRemove(dirty && !completed, ({ data }) => {
    Alert.alert(
      'Discard changes?',
      'Your unsaved meeting changes will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
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
        params: { screen: 'Meetings' },
      }],
    }),
  );
}, [navigation]);

  // Leave after the successful render disables removal prevention.
  useEffect(() => {
    if (completed) leave();
  }, [completed, leave]);

  function edit(
    change: (current: EditorForm) => EditorForm,
  ) {
    if (savingRef.current || completed) return;

    setIssue(null);
    setForm(current => current ? change(current) : current);
  }

  function updateHeader<K extends HeaderField>(
    field: K,
    value: EditorForm[K],
  ) {
    edit(current => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSectionTitle(
    sectionKey: string,
    title: string,
  ) {
    edit(current => ({
      ...current,
      sections: current.sections.map(section =>
        section.key === sectionKey
          ? { ...section, title }
          : section,
      ),
    }));
  }

  function updatePart(
    sectionKey: string,
    partKey: string,
    changes: PartChanges,
  ) {
    edit(current => ({
      ...current,
      sections: current.sections.map(section =>
        section.key === sectionKey
          ? {
              ...section,
              parts: section.parts.map(part =>
                part.key === partKey
                  ? { ...part, ...changes }
                  : part,
              ),
            }
          : section,
      ),
    }));
  }

  function addSection() {
    const section: EditorSection = {
      key: nextKey(),
      title: '',
      parts: [],
    };

    edit(current => (
      current.sections.length >= MEETING_LIMITS.sectionCount
        ? current
        : {
            ...current,
            sections: [...current.sections, section],
          }
    ));
  }

  function addPart(sectionKey: string) {
    const part: EditorPart = {
      key: nextKey(),
      title: '',
      kind: 'custom',
      durationText: '300',
      isTimed: true,
    };

    edit(current => ({
      ...current,
      sections: current.sections.map(section =>
        section.key === sectionKey &&
        section.parts.length < MEETING_LIMITS.partsPerSection
          ? {
              ...section,
              parts: [...section.parts, part],
            }
          : section,
      ),
    }));
  }

  function removeSection(sectionKey: string) {
    Alert.alert(
      'Remove section?',
      'This also removes its parts from the draft.',
      [
        { text: 'Keep section', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => edit(current => ({
            ...current,
            sections: current.sections.filter(
              section => section.key !== sectionKey,
            ),
          })),
        },
      ],
    );
  }

  function removePart(sectionKey: string, partKey: string) {
    Alert.alert(
      'Remove part?',
      'The part will be removed when you save the draft.',
      [
        { text: 'Keep part', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => edit(current => ({
            ...current,
            sections: current.sections.map(section =>
              section.key === sectionKey
                ? {
                    ...section,
                    parts: section.parts.filter(
                      part => part.key !== partKey,
                    ),
                  }
                : section,
            ),
          })),
        },
      ],
    );
  }

  function moveSection(
    sectionKey: string,
    direction: -1 | 1,
  ) {
    edit(current => ({
      ...current,
      sections: moveItem(
        current.sections,
        current.sections.findIndex(
          section => section.key === sectionKey,
        ),
        direction,
      ),
    }));
  }

  function movePart(
    sectionKey: string,
    partKey: string,
    direction: -1 | 1,
  ) {
    edit(current => ({
      ...current,
      sections: current.sections.map(section =>
        section.key === sectionKey
          ? {
              ...section,
              parts: moveItem(
                section.parts,
                section.parts.findIndex(
                  part => part.key === partKey,
                ),
                direction,
              ),
            }
          : section,
      ),
    }));
  }

  function reload() {
    if (!dirty) {
      load();
      return;
    }

    Alert.alert(
      'Reload saved meeting?',
      'Your unsaved changes will be discarded.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Reload',
          style: 'destructive',
          onPress: load,
        },
      ],
    );
  }

  function save() {
    if (!form || savingRef.current || completed) return;

    savingRef.current = true;
    setSaving(true);
    setIssue(null);

    const result = service.save(toDraft(form), target);

    if (!result.ok) {
      savingRef.current = false;
      setSaving(false);
      setIssue(result.error);
      AccessibilityInfo.announceForAccessibility(
        result.error.message,
      );
      return;
    }

    AccessibilityInfo.announceForAccessibility(
      'Meeting saved.',
    );
    setCompleted(true);
  }

  return {
    form,
    loadError,
    issue,
    saving,
    completed,
    editing: meetingId !== undefined,
    reload,
    leave,
    save,
    updateHeader,
    updateSectionTitle,
    updatePart,
    addSection,
    addPart,
    removeSection,
    removePart,
    moveSection,
    movePart,
  };
}
