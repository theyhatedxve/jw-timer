import ProfileForm from '../components/profile/ProfileForm';
import { useProfileForm } from '../hooks/useProfileForm';

export default function ProfileScreen() {
  const model = useProfileForm();
  return <ProfileForm {...model} />;
}
