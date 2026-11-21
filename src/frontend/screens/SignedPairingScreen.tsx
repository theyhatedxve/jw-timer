import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import SignedPairingView from '../components/devices/SignedPairingView';
import { useSignedPairing } from '../hooks/useSignedPairing';
import { createPairingService } from '../../bootstrap/signedPairingDependencies';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'SignedPairing'
>;

export default function SignedPairingScreen({ route }: Props) {
  const [service] = useState(createPairingService);

  return (
    <SignedPairingView
      {...useSignedPairing(service, route.params.fingerprint)}
    />
  );
}
