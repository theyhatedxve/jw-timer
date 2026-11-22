import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/AppButton';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import { devicePermissionsEn as text } from '../../../constants/strings/devicePermissionsEn';

import type { useDevicePermissions } from '../../hooks/useDevicePermissions';

export default function DevicePermissionsView(
  model: ReturnType<typeof useDevicePermissions>,
) {
  const styles = useDocumentStyles();
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ActionButton
          label={text.refresh}
          disabled={model.busy}
          onPress={model.refresh}
        />

        {model.busy ? (
          <Text style={styles.text}>{text.loading}</Text>
        ) : null}

        {model.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {model.error}
          </Text>
        ) : null}

        {model.data ? (
          <>
            <Text accessibilityRole="header" style={styles.heading}>
              {model.data.label}
            </Text>
            <Text style={styles.text}>
              {model.data.congregationName}
            </Text>
            <Text style={styles.secondary}>{text.scope}</Text>
            <Text accessibilityLiveRegion="polite" style={styles.text}>
              {model.data.allowed ? text.allowed : text.denied}
            </Text>

            {model.data.peerState !== 'trusted' ? (
              <Text style={styles.error}>{text.untrusted}</Text>
            ) : null}

            <ActionButton
              label={model.data.allowed ? text.disable : text.grant}
              disabled={
                model.busy ||
                model.data.peerState !== 'trusted'
              }
              onPress={model.toggle}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
