import { useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { en, type MainSection } from '../constants/strings/en';

interface SectionAction { readonly id: string; readonly label: string; readonly onPress: () => void; }

export function useSectionScreen(section: MainSection) {
  const navigation = useNavigation();
  const content = en.sections[section];
  useFocusEffect(useCallback(() => { AccessibilityInfo.announceForAccessibility(content.title); }, [content.title]));
  const actions: Record<MainSection, readonly SectionAction[]> = {
    home: [
      { id: 'meetings', label: en.actions.openMeetings, onPress: () => navigation.navigate('Main', { screen: 'Meetings' }) },
      { id: 'timer', label: en.actions.openTimer, onPress: () => navigation.navigate('Main', { screen: 'Timer' }) },
    ],
    meetings: [],
    assignments: [],
    timer: [{ id: 'practice-timer', label: en.actions.openPracticeTimer, onPress: () => navigation.navigate('PracticeTimer') }],
    settings: [
      { id: 'profile', label: en.actions.openProfile, onPress: () => navigation.navigate('EditProfile') },
      { id: 'diagnostics', label: en.actions.openDiagnostics, onPress: () => navigation.navigate('Diagnostics') },
    ],
  };
  return { content, actions: actions[section] };
}
