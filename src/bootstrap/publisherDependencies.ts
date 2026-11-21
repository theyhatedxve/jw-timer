import {
  localPublisherRepository,
} from '../backend/database/repositories/publisherRepository';

import {
  createPublisherService,
} from '../backend/services/publisherService';

export const publisherService = createPublisherService(
  localPublisherRepository,
);