import { useContext } from 'react';
import { ProfileContext } from '../context/ProfileContext';

export function useLocalProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('ProfileProvider is missing.');
  return context;
}
