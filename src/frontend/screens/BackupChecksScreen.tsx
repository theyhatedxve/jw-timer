import BackupChecksView from '../components/backups/BackupChecksView';
import { useBackupChecks } from '../hooks/useBackupChecks';

import type {
  RunBackupChecks,
} from '../../backend/services/diagnostics.types';

export default function BackupChecksScreen({
  runChecks,
}: {
  readonly runChecks: RunBackupChecks;
}) {
  return <BackupChecksView {...useBackupChecks(runChecks)} />;
}