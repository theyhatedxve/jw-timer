import { useCallback, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import type {
  MeetingService,
  MeetingSummary,
} from '../state/meetings/meetingService';

type ListState =
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly meetings: readonly MeetingSummary[];
    }
  | {
      readonly status: 'error';
      readonly message: string;
    };

export function useMeetings(service: MeetingService) {
  const navigation = useNavigation();

  const [state, setState] = useState<ListState>({
    status: 'loading',
  });

  const reload = useCallback(() => {
    const result = service.list();

    setState(
      result.ok
        ? { status: 'ready', meetings: result.value }
        : { status: 'error', message: result.error.message },
    );
  }, [service]);

  useFocusEffect(
    useCallback(() => {
      reload();
      AccessibilityInfo.announceForAccessibility('Meetings');
    }, [reload]),
  );

  return {
    state,
    reload,
    createMeeting: () => {
      navigation.navigate('MeetingEditor', {});
    },
    openMeeting: (meetingId: string) => {
      navigation.navigate('MeetingEditor', { meetingId });
    },
  };
}