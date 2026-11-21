import DeviceIdentityView from '../components/devices/DeviceIdentityView';
import { useDeviceIdentity } from '../hooks/useDeviceIdentity';
import { deviceIdentityService } from '../../bootstrap/deviceIdentityDependencies';

export default function DeviceIdentityScreen() {
  return (
    <DeviceIdentityView
      {...useDeviceIdentity(deviceIdentityService)}
    />
  );
}