import { useNavigation } from '@react-navigation/native';
import DeviceRequestsView from '../components/devices/DeviceRequestsView';
import { useDeviceRequests } from '../hooks/useDeviceRequests';
import { deviceRequestService } from '../../bootstrap/deviceRequestDependencies';

export default function DeviceRequestsScreen() {
  const navigation = useNavigation();
  const model = useDeviceRequests(deviceRequestService);

  return (
    <DeviceRequestsView
      {...model}
      onPair={fingerprint =>
        navigation.navigate('SignedPairing', { fingerprint })
      }
    />
  );
}
