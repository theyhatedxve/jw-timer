import TimerSessionView from '../components/timer/TimerSessionView';
import { useTimerSession } from '../hooks/useTimerSession';

export default function TimerSessionScreen() {
  const model = useTimerSession();
  return <TimerSessionView {...model} />;
}
