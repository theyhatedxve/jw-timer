import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createSyncService } from '../../bootstrap/syncDependencies';
import { useSync } from '../hooks/useSync';
import SyncView from '../components/sync/SyncView';

export default function SyncScreen() {
  const service = useMemo(() => createSyncService(), []);
  const model = useSync(service);
  const navigation = useNavigation();
  return <SyncView {...model} onDevices={() => navigation.navigate('DeviceRequests')} onHosting={fingerprint => navigation.navigate('LanProbe', { fingerprint })} />;
}
