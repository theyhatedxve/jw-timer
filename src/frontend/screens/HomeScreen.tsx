import { useNavigation } from '@react-navigation/native';

import { homeService } from '../../bootstrap/homeDependencies';
import HomeView from '../components/home/HomeView';
import { useHomeDashboard } from '../hooks/useHomeDashboard';

export default function HomeScreen() {
  const navigation = useNavigation();
  const model = useHomeDashboard(homeService);

  return (
    <HomeView
      {...model}
      openProgram={meetingId =>
        navigation.navigate('Main', { screen: 'Meetings', params: { meetingId, requestId: String(Date.now()) } })
      }
      openMeetings={() =>
        navigation.navigate('Main', { screen: 'Meetings' })
      }
    />
  );
}
