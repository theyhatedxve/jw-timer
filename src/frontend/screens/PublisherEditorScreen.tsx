import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import PublisherEditorView from '../components/publishers/PublisherEditorView';

import { usePublisherEditor } from '../hooks/usePublisherEditor';
import { publisherService } from '../../bootstrap/publisherDependencies';

import type {
  RootStackParamList,
} from '../navigation/types';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PublisherEditor'
>;

export default function PublisherEditorScreen({ route }: Props) {
  const model = usePublisherEditor(
    publisherService,
    route.params?.publisherId,
  );

  return <PublisherEditorView {...model} />;
}