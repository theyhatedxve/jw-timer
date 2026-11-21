import { en } from '../../constants/strings/en';

import HomeScreen from '../screens/HomeScreen';
import AssignmentsScreen from '../screens/AssignmentsScreen';
import TimerScreen from '../screens/TimerScreen';

export const TABS = [
  {
    name: 'Home',
    label: en.navigation.home,
    component: HomeScreen,
  },
  {
    name: 'Assignments',
    label: en.navigation.assignments,
    component: AssignmentsScreen,
  },
  {
    name: 'Timer',
    label: en.navigation.timer,
    component: TimerScreen,
  },
] as const;