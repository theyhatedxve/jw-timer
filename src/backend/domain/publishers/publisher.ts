export const PUBLISHER_NAME_LIMIT = 100;

export const PUBLISHER_ROLE_CODES = [
  'prayer',
  'chairperson',
  'bible-reading',
  'demonstration',
  'assistant',
  'talk',
  'study',
  'reader',
  'sound',
  'microphones',
  'timer',
  'attendant',
] as const;

export type PublisherRole =
  typeof PUBLISHER_ROLE_CODES[number];

export interface PublisherDraft {
  readonly displayName: string;
  readonly isActive: boolean;
  readonly roles: readonly PublisherRole[];
}

export interface PublisherIssue {
  readonly field: string;
  readonly message: string;
}

export type PublisherResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: PublisherIssue };

export function validPublisherId(
  input: unknown,
): input is string {
  return (
    typeof input === 'string' &&
    /^[a-f0-9]{32}$/.test(input)
  );
}

function isRecord(
  input: unknown,
): input is Record<string, unknown> {
  return (
    typeof input === 'object' &&
    input !== null &&
    !Array.isArray(input)
  );
}

function isPublisherRole(
  input: unknown,
): input is PublisherRole {
  return PUBLISHER_ROLE_CODES.some(code => code === input);
}

function failure(
  field: string,
  message: string,
): PublisherResult<never> {
  return { ok: false, error: { field, message } };
}

export function validatePublisherDraft(
  input: unknown,
): PublisherResult<PublisherDraft> {
  if (!isRecord(input)) {
    return failure('publisher', 'Invalid publisher information.');
  }

  if (typeof input.displayName !== 'string') {
    return failure('displayName', 'Enter a publisher name.');
  }

  const displayName = input.displayName.trim();

  if (
    displayName.length === 0 ||
    displayName.length > PUBLISHER_NAME_LIMIT ||
    /[\u0000-\u001f\u007f]/.test(displayName)
  ) {
    return failure(
      'displayName',
      `Use a name between 1 and ${PUBLISHER_NAME_LIMIT} characters without control characters.`,
    );
  }

  if (typeof input.isActive !== 'boolean') {
    return failure('isActive', 'Choose the publisher’s active status.');
  }

  if (
    !Array.isArray(input.roles) ||
    input.roles.length > PUBLISHER_ROLE_CODES.length
  ) {
    return failure('roles', 'Choose valid responsibilities.');
  }

  const selected = new Set<PublisherRole>();

  for (const role of input.roles) {
    if (!isPublisherRole(role) || selected.has(role)) {
      return failure(
        'roles',
        'Responsibilities must be valid and cannot be repeated.',
      );
    }

    selected.add(role);
  }

  return {
    ok: true,
    value: {
      displayName,
      isActive: input.isActive,
      roles: PUBLISHER_ROLE_CODES.filter(code =>
        selected.has(code),
      ),
    },
  };
}