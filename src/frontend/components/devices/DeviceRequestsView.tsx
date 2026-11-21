import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/ActionButton';
import { styles } from '../../styles/publishers/publishers.styles';
import { deviceRequestsEn as text } from '../../../constants/strings/deviceRequestsEn';

import type { useDeviceRequests } from '../../hooks/useDeviceRequests';

export default function DeviceRequestsView(
  model: ReturnType<typeof useDeviceRequests>,
) {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.text}>{text.description}</Text>

        <ActionButton
          label={text.refresh}
          disabled={model.busy}
          onPress={model.refresh}
        />

        <Text style={styles.heading}>{text.own}</Text>
        <Text selectable style={styles.text}>
          {model.ownInvitation}
        </Text>

        <Text style={styles.secondary}>{text.label}</Text>
        <TextInput
          accessibilityLabel={text.label}
          value={model.label}
          onChangeText={model.setLabel}
          editable={!model.busy}
          maxLength={100}
          style={styles.input}
        />

        <Text style={styles.secondary}>{text.invitation}</Text>
        <TextInput
          accessibilityLabel={text.invitation}
          value={model.invitation}
          onChangeText={model.setInvitation}
          editable={!model.busy}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={1024}
          style={styles.input}
        />

        <ActionButton
          label={text.add}
          disabled={model.busy || !model.ownInvitation}
          onPress={model.add}
        />

        {model.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {model.error}
          </Text>
        ) : null}

        {model.requests.map(request => (
          <View key={request.fingerprint} style={styles.publisher}>
            <Text style={styles.heading}>{request.label}</Text>
            <Text selectable style={styles.text}>
              {request.fingerprint}
            </Text>
            <Text style={styles.secondary}>
              {request.state === 'pending' ? text.pending : text.revoked}
            </Text>

            {request.state === 'pending' ? (
              <ActionButton
                label={text.revoke}
                disabled={model.busy}
                onPress={() => model.revoke(request.fingerprint)}
              />
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}