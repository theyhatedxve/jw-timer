import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/ActionButton';
import CodeExchange from './CodeExchange';
import { styles } from '../../styles/publishers/publishers.styles';
import { deviceRequestsEn as text } from '../../../constants/strings/deviceRequestsEn';

import type { useDeviceRequests } from '../../hooks/useDeviceRequests';

export default function DeviceRequestsView(
  model: ReturnType<typeof useDeviceRequests> & {
    readonly onPair: (fingerprint: string) => void;
    readonly onPermissions: (fingerprint: string) => void;
    readonly onLan: (fingerprint: string) => void;
  },
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
        <CodeExchange value={model.ownInvitation} maxLength={1024} disabled={model.busy} />

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

        <CodeExchange onChange={model.setInvitation} maxLength={1024} disabled={model.busy} />
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
              {request.state === 'pending'
                ? text.pending
                : request.state === 'trusted'
                  ? text.trusted
                  : text.revoked}
            </Text>

            {request.state === 'trusted' ? (
              <ActionButton
                label={text.permissions}
                disabled={model.busy}
                onPress={() =>
                  model.onPermissions(request.fingerprint)
                }
              />
            ) : null}

            {request.state === 'pending' ? (
              <ActionButton
                label={text.pair}
                disabled={model.busy}
                onPress={() => model.onPair(request.fingerprint)}
              />
            ) : null}

            {request.state === 'trusted' ? (
              <ActionButton
                label={text.lan}
                disabled={model.busy}
                onPress={() => model.onLan(request.fingerprint)}
              />
            ) : null}

            {request.state !== 'revoked' ? (
              <ActionButton
                label={text.revoke}
                disabled={model.busy}
                onPress={() => model.revoke(request.fingerprint)}
              />
            ) : (
              <ActionButton
                label={text.requestAgain}
                disabled={model.busy}
                onPress={() => model.requestAgain(request.fingerprint)}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
