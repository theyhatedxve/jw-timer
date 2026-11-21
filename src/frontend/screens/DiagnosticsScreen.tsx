import DiagnosticsView from '../components/diagnostics/DiagnosticsView';
import { useSqliteChecks } from '../hooks/useSqliteChecks';
import type { RunSqliteChecks } from '../../backend/services/diagnostics.types';

export default function DiagnosticsScreen({ runChecks }: { readonly runChecks: RunSqliteChecks }) {
  const model = useSqliteChecks(runChecks);
  return <DiagnosticsView {...model} />;
}
