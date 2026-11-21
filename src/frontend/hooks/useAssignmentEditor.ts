import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { CommonActions, useNavigation, usePreventRemove } from '@react-navigation/native';
import { canAssign } from '../../backend/domain/assignments/assignment';
import { isPublisherRole, type PublisherRole } from '../../backend/domain/publishers/publisher';
import type { ScheduleContext, ScheduleService } from '../../backend/services/scheduleService';
import { scheduleEn as text } from '../../constants/strings/scheduleEn';

export function useAssignmentEditor(
  service: ScheduleService,
  meetingId: string,
  partId: string,
  initialRole: PublisherRole | undefined,
) {
  const navigation = useNavigation();
  const savingRef = useRef(false);
  const [context, setContext] = useState<ScheduleContext | null>(null);
  const [role, setRole] = useState<PublisherRole | null>(null);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [issue, setIssue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const load = useCallback(() => {
    const result = service.loadMeeting(meetingId);
    if (!result.ok) { setLoadError(result.error.message); return; }
    const part = result.value.meeting.draft.sections.flatMap(section => section.parts).find(item => item.id === partId);
    if (!part || (initialRole !== undefined && !isPublisherRole(initialRole))) {
      setLoadError(text.partUnavailable);
      return;
    }
    const slot = result.value.assignments.find(item => item.partId === partId && item.role === initialRole);
    const loadedRole = initialRole ?? null;
    const person = slot?.publisherId ?? null;
    setContext(result.value);
    setRole(loadedRole);
    setPublisherId(person);
    setBaseline(JSON.stringify([loadedRole, person]));
    setLoadError(null);
    setIssue(null);
    setSaving(false);
    setCompleted(false);
    savingRef.current = false;
  }, [service, meetingId, partId, initialRole]);

  useEffect(() => { load(); }, [load]);
  const dirty = context !== null && JSON.stringify([role, publisherId]) !== baseline;
  usePreventRemove(dirty && !completed, ({ data }) => {
    Alert.alert(text.discardTitle, text.discardMessage, [
      { text: text.keepEditing, style: 'cancel' },
      { text: text.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const leave = useCallback(() => {
    if (navigation.canGoBack()) { navigation.goBack(); return; }
    navigation.dispatch(CommonActions.reset({
      index: 0, routes: [{ name: 'Main', params: { screen: 'Assignments' } }],
    }));
  }, [navigation]);
  useEffect(() => { if (completed) leave(); }, [completed, leave]);

  function chooseRole(value: PublisherRole) {
    if (!context || role !== null || savingRef.current) return;
    const existing = context.assignments.find(slot => slot.partId === partId && slot.role === value);
    setRole(value);
    setPublisherId(existing?.publisherId ?? null);
    setIssue(null);
  }

  function reload() {
    if (!dirty) { load(); return; }
    Alert.alert(text.discardTitle, text.discardMessage, [
      { text: text.keepEditing, style: 'cancel' },
      { text: text.reload, onPress: load },
    ]);
  }

  function save() {
    if (!context || !role || loadError || savingRef.current || completed) return;
    const previous = context.assignments.find(slot => slot.partId === partId && slot.role === role);
    savingRef.current = true;
    setSaving(true);
    setIssue(null);
    const result = service.save({
      meetingId, partId, role, publisherId,
      meetingRevision: context.meeting.revision,
      expectedRevision: previous?.revision ?? 0,
    });
    if (!result.ok) {
      savingRef.current = false;
      setSaving(false);
      setIssue(result.error.message);
      return;
    }
    setCompleted(true);
  }

  const assignments = context?.assignments ?? [];
  const eligible = context?.publishers.filter(person =>
    role !== null && canAssign(person, role) &&
    !assignments.some(slot => slot.partId === partId && slot.role !== role && slot.publisherId === person.id),
  ) ?? [];

  return {
    context, role, publisherId, eligible, loadError, issue, saving, completed,
    partTitle: context?.meeting.draft.sections.flatMap(section => section.parts).find(part => part.id === partId)?.title ?? '',
    selectedUnavailable: publisherId !== null && !eligible.some(person => person.id === publisherId),
    chooseRole,
    choosePublisher: (id: string | null) => {
      if (savingRef.current || completed) return;
      setPublisherId(id);
      setIssue(null);
    },
    reload, leave, save,
  };
}
