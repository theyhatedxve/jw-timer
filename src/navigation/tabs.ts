import { en } from '../constants/strings/en';
import HomeScreen from '../screens/HomeScreen';
import MeetingsScreen from '../screens/MeetingsScreen';
import AssignmentsScreen from '../screens/AssignmentsScreen';
import TimerScreen from '../screens/TimerScreen';
import SettingsScreen from '../screens/SettingsScreen';

export const TABS = [
  { name: 'Home', label: en.navigation.home, component: HomeScreen },
  { name: 'Meetings', label: en.navigation.meetings, component: MeetingsScreen },
  { name: 'Assignments', label: en.navigation.assignments, component: AssignmentsScreen },
  { name: 'Timer', label: en.navigation.timer, component: TimerScreen },
  { name: 'Settings', label: en.navigation.settings, component: SettingsScreen },
] as const;
