import WorkbookFileView from '../components/imports/WorkbookFileView';
import { useWorkbookFile } from '../hooks/useWorkbookFile';

import { workbookFileService } from '../../backend/files/workbookFileService';
import { workbookTextService } from '../../backend/files/workbookTextService';

export default function WorkbookImportScreen() {
  const model = useWorkbookFile(
    workbookFileService,
    workbookTextService,
  );

  return <WorkbookFileView {...model} />;
}