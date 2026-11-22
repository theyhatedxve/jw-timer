import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  useNavigation,
  usePreventRemove,
} from '@react-navigation/native';

import type { WorkbookFile } from '../../backend/domain/imports/workbookFile';
import {
  buildWatchtowerCandidates,
  type WatchtowerCandidate,
} from '../../backend/domain/imports/watchtowerParser';
import { buildWeekendProgram } from '../../backend/domain/imports/weekendProgram';
import { watchtowerImportEn as text } from '../../constants/strings/watchtowerImportEn';
import { useLocalProfile } from './useLocalProfile';

interface ReviewFields {
  readonly articleTitle: string;
  readonly openingSong: string;
  readonly middleSong: string;
  readonly closingSong: string;
  readonly meetingDate: string;
  readonly startLocalTime: string;
}

interface Review {
  readonly fileUri: string;
  readonly candidate: WatchtowerCandidate;
  readonly fields: ReviewFields;
}

function songNumber(value: string): number {
  const trimmed = value.trim();
  return /^\d{1,3}$/.test(trimmed) ? Number(trimmed) : NaN;
}

function buildDraft(
  review: Review,
  file: WorkbookFile,
  timezone: string,
) {
  return buildWeekendProgram({
    ...review.fields,
    openingSong: songNumber(review.fields.openingSong),
    middleSong: songNumber(review.fields.middleSong),
    closingSong: songNumber(review.fields.closingSong),
    timezone,
    programLanguage: review.candidate.programLanguage,
    importSource: {
      filename: file.name,
      page: review.candidate.page,
      parser: 'watchtower-v1',
    },
  });
}

export function useWatchtowerImport(
  pages: readonly string[],
  file: WorkbookFile | null,
  disabled: boolean,
) {
  const navigation = useNavigation();
  const { state } = useLocalProfile();
  const [review, setReview] = useState<Review | null>(null);
  const [issue, setIssue] = useState('');
  const opening = useRef(false);

  const timezone = state.status === 'ready'
    ? state.profile?.timezone ?? null
    : null;

  const candidates = useMemo(
    () => buildWatchtowerCandidates(pages),
    [pages],
  );

  useEffect(() => {
    setReview(null);
    setIssue('');
    opening.current = false;
  }, [pages, file]);

  usePreventRemove(review !== null, ({ data }) => {
    Alert.alert(text.discardTitle, text.discardMessage, [
      { text: text.keep, style: 'cancel' },
      {
        text: text.discard,
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  function confirmDiscard(action: () => void) {
    if (disabled) return;

    if (!review) {
      action();
      return;
    }

    Alert.alert(text.discardTitle, text.discardMessage, [
      { text: text.keep, style: 'cancel' },
      {
        text: text.discard,
        style: 'destructive',
        onPress: () => {
          setReview(null);
          setIssue('');
          action();
        },
      },
    ]);
  }

  function choose(key: string) {
    if (disabled || !file || timezone === null) return;

    const candidate = candidates.find(item => item.key === key);
    if (!candidate) return;

    confirmDiscard(() => {
      opening.current = false;
      setIssue('');
      setReview({
        fileUri: file.uri,
        candidate,
        fields: {
          articleTitle: candidate.articleTitle,
          openingSong: '',
          middleSong: candidate.middleSong?.toString() ?? '',
          closingSong: candidate.closingSong?.toString() ?? '',
          meetingDate: '',
          startLocalTime: '',
        },
      });
    });
  }

  function change(field: keyof ReviewFields, value: string) {
    if (disabled) return;

    setReview(current => current ? {
      ...current,
      fields: { ...current.fields, [field]: value },
    } : null);
    setIssue('');
  }

  const result =
    review && file && timezone !== null && review.fileUri === file.uri
      ? buildDraft(review, file, timezone)
      : null;

  function openEditor() {
    if (disabled || opening.current) return;

    if (!review || !file || !result) {
      setIssue(text.unavailable);
      return;
    }

    if (!result.ok) {
      setIssue(result.error.message);
      return;
    }

    opening.current = true;
    setReview(null);
    setIssue('');

    navigation.navigate('MeetingEditor', {
      importDraft: result.value,
      importKey: `${file.uri}:${review.candidate.key}`,
    });
  }

  return {
    candidates,
    review,
    issue,
    timezone,
    disabled,
    preview: result?.ok ? result.value : null,
    choose,
    change,
    openEditor,
    confirmDiscard,
    cancel: () => confirmDiscard(() => {
      setReview(null);
      setIssue('');
    }),
  };
}
