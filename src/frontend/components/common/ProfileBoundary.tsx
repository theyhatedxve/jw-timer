import { styles } from '../../styles/common/profileBoundary.styles';
import { ActivityIndicator, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from './ActionButton';
import { colors } from '../../../constants/theme';
import { PROFILE_TEXT } from '../../../constants/strings/profileEn';
import type { ProfileState } from '../../context/ProfileContext';

export default function ProfileBoundary({ state, onRetry }: {
  readonly state: ProfileState;
  readonly onRetry: () => void;
}) {
  if (state.status === 'ready') return null;
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{PROFILE_TEXT.title}</Text>
      {state.status === 'loading' ? <>
        <ActivityIndicator color={colors.brand} />
        <Text style={styles.text}>{PROFILE_TEXT.loading}</Text>
      </> : <>
        <Text accessibilityRole="alert" style={styles.text}>{PROFILE_TEXT.errors[state.code]}</Text>
        <ActionButton label={PROFILE_TEXT.retry} onPress={onRetry} />
      </>}
    </ScrollView>
  </SafeAreaView>;
}


