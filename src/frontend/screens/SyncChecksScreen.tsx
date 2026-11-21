import BackupChecksView from '../components/backups/BackupChecksView';
import { useBackupChecks } from '../hooks/useBackupChecks';
import { runSyncStorageChecks } from '../../backend/database/diagnostics/syncDiagnostics';
import { syncChecksEn } from '../../constants/strings/syncChecksEn';

export default function SyncChecksScreen() {
  return <BackupChecksView {...useBackupChecks(runSyncStorageChecks, syncChecksEn)} copy={syncChecksEn} />;
}
