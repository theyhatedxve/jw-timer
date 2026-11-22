import { ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/AppButton';
import CodeExchange from './CodeExchange';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import { signedPairingEn as text } from '../../../constants/strings/signedPairingEn';

import type { useSignedPairing } from '../../hooks/useSignedPairing';

export default function SignedPairingView(
  model: ReturnType<typeof useSignedPairing>,
) {
  const styles = useDocumentStyles();
  const state = model.snapshot;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.text}>{text.instructions}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.heading}>
          {text.status[state.phase]}
        </Text>

        <ActionButton
          label={text.start}
          disabled={model.busy || state.phase === 'trusted'}
          onPress={model.start}
        />

        {state.ownFingerprint ? (
          <>
            <Text style={styles.secondary}>{text.ownFingerprint}</Text>
            <Text selectable style={styles.text}>
              {state.ownFingerprint}
            </Text>
            <Text style={styles.secondary}>{text.peerFingerprint}</Text>
            <Text selectable style={styles.text}>
              {state.peerFingerprint}
            </Text>
          </>
        ) : null}

        {state.challenge ? (
          <>
            <Text style={styles.heading}>{text.challenge}</Text>
            <Text selectable style={styles.text}>{state.challenge}</Text>
            <CodeExchange value={state.challenge} disabled={model.busy} />
          </>
        ) : null}

        {state.approval ? (
          <>
            <Text style={styles.heading}>{text.approval}</Text>
            <Text selectable style={styles.text}>{state.approval}</Text>
            <CodeExchange value={state.approval} disabled={model.busy} />
          </>
        ) : null}

        <Text style={styles.secondary}>{text.incoming}</Text>
        <TextInput
          accessibilityLabel={text.incoming}
          value={model.incoming}
          onChangeText={model.setIncoming}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={2048}
          editable={!model.busy && state.phase !== 'trusted'}
          style={styles.input}
        />

        <CodeExchange onChange={model.setIncoming} disabled={model.busy || state.phase === 'trusted'} />
        <ActionButton
          label={text.receive}
          disabled={
            model.busy ||
            state.phase === 'idle' ||
            state.phase === 'trusted' ||
            !model.incoming
          }
          onPress={model.receive}
        />

        {state.phase === 'review' ? (
          <ActionButton
            label={text.approve}
            disabled={model.busy}
            onPress={model.approve}
          />
        ) : null}

        {model.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {model.error}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
