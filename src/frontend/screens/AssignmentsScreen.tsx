import PublishersListView from '../components/publishers/PublishersListView';
import { usePublishers } from '../hooks/usePublishers';
import { publisherService } from '../../bootstrap/publisherDependencies';

export default function AssignmentsScreen() {
  const model = usePublishers(publisherService);

  return <PublishersListView {...model} />;
}