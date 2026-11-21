import BackupsView from '../components/backups/BackupsView';
import { useBackups } from '../hooks/useBackups';
import { backupService } from '../../bootstrap/backupDependencies';

export default function BackupsScreen() {
  return <BackupsView {...useBackups(backupService)} />;
}