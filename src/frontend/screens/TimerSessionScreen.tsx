import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PracticeTimer'>;

// Preserve old timer links while keeping a single timer screen instance.
export default function TimerSessionScreen({ route, navigation }: Props) {
  useEffect(() => {
    navigation.popTo('Main', { screen: 'Timer', params: route.params });
  }, [navigation, route.params]);
  return null;
}
