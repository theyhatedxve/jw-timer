import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LanProbeView from '../components/devices/LanProbeView';
import { useLanProbe } from '../hooks/useLanProbe';
import { createLanService } from '../../bootstrap/lanProbeDependencies';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LanProbe'>;

export default function LanProbeScreen({ route }: Props) {
  const [service] = useState(createLanService);
  return <LanProbeView {...useLanProbe(service, route.params.fingerprint)} />;
}
