import WorkbookFileView from '../components/imports/WorkbookFileView';
import { useWorkbookFile } from '../hooks/useWorkbookFile';
import { workbookFileService } from '../../backend/files/workbookFileService';

export default function WorkbookImportScreen() {
  const model = useWorkbookFile(workbookFileService);

  return <WorkbookFileView {...model} />;
}