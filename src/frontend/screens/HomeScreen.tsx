import { useNavigation } from '@react-navigation/native';
import { useLocalProfile } from '../hooks/useLocalProfile';
import ProfileSetupPrompt from '../components/onboarding/ProfileSetupPrompt';
import { en } from '../../constants/strings/en';

import { homeService } from '../../bootstrap/homeDependencies';
import HomeView from '../components/home/HomeView';
import { useHomeDashboard } from '../hooks/useHomeDashboard';

export default function HomeScreen() {
  const navigation = useNavigation();
  const model = useHomeDashboard(homeService);
  const { state } = useLocalProfile();
  if (state.status === 'ready' && !state.profile) {
    return <ProfileSetupPrompt title={en.sections.home.title} />;
  }

  return (
    <HomeView
      {...model}
      openProgram={meetingId =>
        navigation.navigate('Main', { screen: 'Meetings', params: { meetingId, requestId: String(Date.now()) } })
      }
      openMeetings={() =>
        navigation.navigate('Main', { screen: 'Meetings' })
      }
      openTimer={() =>
        navigation.navigate('Main', { screen: 'Timer' })
      }
      openSettings={() =>
        navigation.navigate('Main', { screen: 'SettingsTab' })
      }
    />
  );
}
