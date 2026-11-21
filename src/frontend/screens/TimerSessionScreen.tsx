import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import TimerSessionView from '../components/timer/TimerSessionView';
import { useTimerSession } from '../hooks/useTimerSession';
import { timerSessionService } from '../../bootstrap/timerDependencies';

import type {
  RootStackParamList,
} from '../navigation/types';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PracticeTimer'
>;

export default function TimerSessionScreen({ route }: Props) {
  const model = useTimerSession(
    timerSessionService,
    route.params,
  );

  return <TimerSessionView {...model} />;
}