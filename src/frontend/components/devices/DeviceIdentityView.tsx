import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/AppButton';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import { deviceIdentityEn as text } from '../../../constants/strings/deviceIdentityEn';

import type { useDeviceIdentity } from '../../hooks/useDeviceIdentity';

export default function DeviceIdentityView(
  model: ReturnType<typeof useDeviceIdentity>,
) {
  const styles = useDocumentStyles();
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.text}>{text.description}</Text>

        <ActionButton
          label={text.refresh}
          disabled={model.busy}
          onPress={model.refresh}
        />

        {model.busy ? (
          <Text accessibilityLiveRegion="polite" style={styles.text}>
            {text.busy}
          </Text>
        ) : null}

        {model.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {model.error}
          </Text>
        ) : null}

        {model.loaded && !model.identity ? (
          <>
            <Text style={styles.text}>{text.missing}</Text>
            <ActionButton
              label={text.create}
              disabled={model.busy}
              onPress={model.create}
            />
          </>
        ) : null}

        {model.identity ? (
          <>
            <Text accessibilityRole="header" style={styles.heading}>
              {text.fingerprint}
            </Text>
            <Text selectable style={styles.text}>
              {model.identity.fingerprint}
            </Text>
            <Text style={styles.secondary}>
              {text.protection[model.identity.protection]}
            </Text>
            <ActionButton
              label={text.check}
              disabled={model.busy}
              onPress={model.check}
            />
          </>
        ) : null}

        {model.verified ? (
          <Text accessibilityLiveRegion="polite" style={styles.text}>
            {text.verified}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
