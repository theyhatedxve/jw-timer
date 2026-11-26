import WorkbookFileView from '../components/imports/WorkbookFileView';
import { useWorkbookFile } from '../hooks/useWorkbookFile';

import { downloadCurrentWorkbook } from '../../backend/files/jwWorkbookDownload';
import { workbookFileService } from '../../backend/files/workbookFileService';
import { workbookTextService } from '../../backend/files/workbookTextService';

export default function WorkbookImportScreen() {
  const model = useWorkbookFile(
    workbookFileService,
    workbookTextService,
    downloadCurrentWorkbook,
  );

  return <WorkbookFileView {...model} />;
}