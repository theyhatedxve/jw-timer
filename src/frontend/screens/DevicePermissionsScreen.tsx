import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import DevicePermissionsView from '../components/devices/DevicePermissionsView';
import { useDevicePermissions } from '../hooks/useDevicePermissions';
import { devicePermissionService } from '../../bootstrap/devicePermissionDependencies';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'DevicePermissions'
>;

export default function DevicePermissionsScreen({ route }: Props) {
  return (
    <DevicePermissionsView
      {...useDevicePermissions(
        devicePermissionService,
        route.params.fingerprint,
      )}
    />
  );
}