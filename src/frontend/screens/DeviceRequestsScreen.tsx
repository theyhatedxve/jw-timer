import DeviceRequestsView from '../components/devices/DeviceRequestsView';
import { useDeviceRequests } from '../hooks/useDeviceRequests';
import { deviceRequestService } from '../../bootstrap/deviceRequestDependencies';

export default function DeviceRequestsScreen() {
  return (
    <DeviceRequestsView
      {...useDeviceRequests(deviceRequestService)}
    />
  );
}