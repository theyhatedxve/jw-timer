import { useEffect } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import TimerSessionView from '../components/timer/TimerSessionView';
import { useTimerSession } from '../hooks/useTimerSession';
import { useTabLayout } from '../hooks/useTabLayout';
import { timerSessionService } from '../../bootstrap/timerDependencies';
import type { MainTabParamList } from '../navigation/types';

export default function TimerScreen() {
  const route = useRoute<RouteProp<MainTabParamList, 'Timer'>>();
  const navigation = useNavigation();
  const { barStyle } = useTabLayout();
  const model = useTimerSession(timerSessionService, route.params);

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: model.fullscreen ? { display: 'none' } : barStyle });
  }, [model.fullscreen, navigation, barStyle]);

  return <TimerSessionView {...model} />;
}
