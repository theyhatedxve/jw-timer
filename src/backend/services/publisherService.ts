import {
  validPublisherId,
  validatePublisherDraft,
  type PublisherDraft,
  type PublisherResult,
} from '../domain/publishers/publisher';

export interface SavedPublisher extends PublisherDraft {
  readonly id: string;
  readonly revision: number;
  readonly updatedAt: number;
}

export interface PublisherTarget {
  readonly id: string;
  readonly revision: number;
}

export interface PublisherRepository {
  list(): PublisherResult<readonly SavedPublisher[]>;
  get(id: string): PublisherResult<SavedPublisher | null>;
  save(
    draft: PublisherDraft,
    target: PublisherTarget | null,
  ): PublisherResult<SavedPublisher>;
}

export function createPublisherService(
  repository: PublisherRepository,
) {
  return {
    list: () => repository.list(),

    get(id: string): PublisherResult<SavedPublisher | null> {
      if (!validPublisherId(id)) {
        return {
          ok: false,
          error: {
            field: 'id',
            message: 'Invalid publisher identifier.',
          },
        };
      }

      return repository.get(id);
    },

    save(
      input: unknown,
      target: PublisherTarget | null,
    ): PublisherResult<SavedPublisher> {
      const result = validatePublisherDraft(input);

      if (!result.ok) return result;

      if (
        target !== null &&
        (
          !validPublisherId(target.id) ||
          !Number.isSafeInteger(target.revision) ||
          target.revision < 1 ||
          target.revision >= Number.MAX_SAFE_INTEGER
        )
      ) {
        return {
          ok: false,
          error: {
            field: 'revision',
            message: 'Invalid saved publisher version.',
          },
        };
      }

      return repository.save(result.value, target);
    },
  };
}

export type PublisherService =
  ReturnType<typeof createPublisherService>;