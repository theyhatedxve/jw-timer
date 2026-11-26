import WorkbookFileView from '../components/imports/WorkbookFileView';
import { useWorkbookFile } from '../hooks/useWorkbookFile';

import { workbookFileService } from '../../backend/files/workbookFileService';
import { workbookTextService } from '../../backend/files/workbookTextService';
import { meetingService } from '../../bootstrap/meetingDependencies';

export default function WorkbookImportScreen() {
  const model = useWorkbookFile(
    workbookFileService,
    workbookTextService,
    meetingService,
  );

  return <WorkbookFileView {...model} />;
}
