import { useCallback, useEffect } from 'react';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import TimerSessionView from '../components/timer/TimerSessionView';
import { useTimerSession } from '../hooks/useTimerSession';
import { useTabLayout } from '../hooks/useTabLayout';
import { timerSessionService } from '../../bootstrap/timerDependencies';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

export default function TimerScreen() {
  const route = useRoute<RouteProp<MainTabParamList, 'Timer'>>();
  const navigation = useNavigation();
  const { barStyle } = useTabLayout();
  const model = useTimerSession(timerSessionService, route.params);

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: model.fullscreen ? { display: 'none' } : barStyle });
  }, [model.fullscreen, navigation, barStyle]);

  useFocusEffect(useCallback(() => {
    const stack = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    stack?.setOptions({ orientation: model.fullscreen ? 'all' : 'portrait' });

    return () => {
      stack?.setOptions({ orientation: 'default' });
    };
  }, [navigation, model.fullscreen]));

  return <TimerSessionView {...model} />;
}
