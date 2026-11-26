import { en } from '../../constants/strings/en';
import { homeEn } from '../../constants/strings/homeEn';

import HomeScreen from '../screens/HomeScreen';
import MeetingsScreen from '../screens/MeetingsScreen';
import TimerScreen from '../screens/TimerScreen';
import SettingsScreen from '../screens/SettingsScreen';

export const TABS = [
  {
    name: 'Home',
    label: en.navigation.home,
    icon: 'home',
    component: HomeScreen,
  },
  {
    name: 'Meetings',
    label: homeEn.meetings,
    icon: 'meetings',
    component: MeetingsScreen,
  },
  {
    name: 'Timer',
    label: en.navigation.timer,
    icon: 'timer',
    component: TimerScreen,
  },
  {
    name: 'SettingsTab',
    label: en.navigation.settings,
    icon: 'settings',
    component: SettingsScreen,
  },
] as const;
