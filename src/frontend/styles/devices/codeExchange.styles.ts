import { StyleSheet } from 'react-native';
import { spacing } from '../../../constants/theme';
import { publisherColors } from '../publishers/publishers.styles';

export const styles = StyleSheet.create({
  group: { gap: spacing.small },
  qr: { padding: spacing.medium, alignSelf: 'flex-start', backgroundColor: publisherColors.background },
  camera: { width: '100%', height: 300 },
});
