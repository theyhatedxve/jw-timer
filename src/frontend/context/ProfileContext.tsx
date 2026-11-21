import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { ProfileService } from '../../backend/services/profileService';
import type { LocalProfile, ProfileErrorCode, ProfileResult } from '../../backend/domain/profile/profile';

export type ProfileState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly profile: LocalProfile | null }
  | { readonly status: 'error'; readonly code: ProfileErrorCode };

interface ProfileContextValue {
  readonly state: ProfileState;
  readonly reload: () => void;
  save(input: unknown, expectedRevision: number | null): ProfileResult<LocalProfile>;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ service, children }: {
  readonly service: ProfileService;
  readonly children: ReactNode;
}) {
  const [state, setState] = useState<ProfileState>({ status: 'loading' });

  const reload = useCallback(() => {
    const result = service.load();
    setState(result.ok
      ? { status: 'ready', profile: result.value }
      : { status: 'error', code: result.code });
  }, [service]);

  useEffect(() => { reload(); }, [reload]);

  function save(input: unknown, expectedRevision: number | null): ProfileResult<LocalProfile> {
    const result = service.save(input, expectedRevision);
    if (result.ok) setState({ status: 'ready', profile: result.value });
    else if (result.code === 'conflict') reload();
    return result;
  }

  return <ProfileContext.Provider value={{ state, reload, save }}>{children}</ProfileContext.Provider>;
}
