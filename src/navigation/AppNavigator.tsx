import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileBoundary from '../components/common/ProfileBoundary';
import { useLocalProfile } from '../hooks/useLocalProfile';
import ProfileScreen from '../screens/ProfileScreen';
import TimerSessionScreen from '../screens/TimerSessionScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import { runSqliteDiagnostics } from '../state/db/sqliteDiagnostics';
import TabNavigator from './TabNavigator';
import type { RootStackParamList } from './types';

const Root = createNativeStackNavigator<RootStackParamList>();
const getPracticeTimerId = () => 'local-practice-timer';

export default function AppNavigator() {
  const { state, reload } = useLocalProfile();
  if (state.status !== 'ready') return <ProfileBoundary state={state} onRetry={reload} />;
  const hasProfile = state.profile !== null;

  return <Root.Navigator screenOptions={{ headerShown: false }}>
    {hasProfile ? <Root.Group navigationKey="configured">
      <Root.Screen name="Main" component={TabNavigator} />
      <Root.Screen name="EditProfile" component={ProfileScreen} />
      <Root.Screen name="PracticeTimer" component={TimerSessionScreen} getId={getPracticeTimerId} />
      <Root.Screen name="Diagnostics">{() => <DiagnosticsScreen runChecks={runSqliteDiagnostics} />}</Root.Screen>
    </Root.Group> : <Root.Screen name="SetupProfile" component={ProfileScreen} />}
  </Root.Navigator>;
}
