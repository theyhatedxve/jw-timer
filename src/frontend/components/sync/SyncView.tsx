import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { useSync } from '../../hooks/useSync';
import { syncEn as text } from '../../../constants/strings/syncEn';
import { styles } from '../../styles/publishers/publishers.styles';
import ActionButton from '../common/ActionButton';
import CodeExchange from '../devices/CodeExchange';
import LanDiscovery from '../devices/LanDiscovery';
import SyncPreviewView from './SyncPreviewView';

type Props = ReturnType<typeof useSync> & { readonly onDevices: () => void; readonly onHosting: (fingerprint: string) => void };
export default function SyncView(model: Props) {
  const status = model.status;
  const frozen = !status?.binding || status.binding.frozen;
  return <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.text}>{text.offline}</Text>
      <Text style={styles.secondary}>{text.recovery}</Text>
      <ActionButton label={text.refresh} disabled={model.busy} onPress={model.refresh} />
      {model.message ? <Text accessibilityRole="alert" style={styles.text}>{model.message}</Text> : null}
      {status ? <>
        <Text style={styles.heading}>{text.own}</Text><Text selectable style={styles.text}>{status.ownFingerprint}</Text>
        <Text style={styles.secondary}>{text.scope}: {status.localScope}</Text>
        <Text style={styles.heading}>{text.leader}</Text>
        <Text selectable style={styles.text}>{status.binding?.leader ?? text.unbound}</Text>
        <Text selectable style={styles.secondary}>{text.head}: {status.head.sequence} · {status.head.hash}</Text>
        {status.binding?.frozen ? <Text accessibilityRole="alert" style={styles.error}>{text.frozen}</Text> : null}
        <ActionButton label={text.bind} disabled={model.busy || (!!status.binding && !model.isLeader)} onPress={model.bindSelf} />
        <Text style={styles.heading}>{text.peers}</Text>
        {!status.peers.length ? <Text style={styles.text}>{text.noPeers}</Text> : null}
        <ActionButton label={text.devices} disabled={model.busy} onPress={model.onDevices} />
        {status.peers.map(peer => <View key={peer.fingerprint} style={styles.publisher}>
          <Text style={styles.heading}>{peer.label}</Text><Text selectable style={styles.text}>{peer.fingerprint}</Text>
          <ActionButton label={model.selected === peer.fingerprint ? text.selected : text.select} disabled={model.busy || model.selected === peer.fingerprint} onPress={() => model.setSelected(peer.fingerprint)} />
          {model.isLeader ? <ActionButton label={peer.draftAllowed ? text.revoke : text.grant} disabled={model.busy || frozen} onPress={() => model.setEditor(peer.fingerprint, !peer.draftAllowed)} /> : null}
        </View>)}
        {model.selected ? <>
          <Text style={styles.heading}>{text.selected}</Text><Text selectable style={styles.text}>{model.selected}</Text>
          <Text style={styles.secondary}>{text.code}</Text>
          <TextInput accessibilityLabel={text.code} style={styles.input} value={model.code} onChangeText={model.setCode} editable={!model.busy} maxLength={512} multiline autoCapitalize="none" autoCorrect={false} />
          <CodeExchange onChange={model.setCode} maxLength={512} disabled={model.busy} />
          <LanDiscovery fingerprint={model.selected} onChange={model.setCode} disabled={model.busy} />
          <ActionButton label={text.adopt} disabled={model.busy || !model.connectionMatches || (!!status.binding && status.binding.leader !== model.selected)} onPress={model.adopt} />
          <ActionButton label={text.synchronize} disabled={model.busy || frozen || !model.connectionMatches} onPress={model.synchronize} />
          <ActionButton label={text.retry} disabled={model.busy || frozen || !model.connectionMatches} onPress={model.retry} />
          <Text style={styles.secondary}>{text.receiving}</Text>
          <ActionButton label={text.hosting} disabled={model.busy} onPress={() => model.onHosting(model.selected)} />
        </> : null}
        {!status.binding ? <Text style={styles.secondary}>{text.noBinding}</Text> : null}
        <ActionButton label={text.previewLocal} disabled={model.busy} onPress={model.previewLocal} />
        {status.restored.length ? <Text style={styles.heading}>{text.restored}</Text> : null}
        {status.restored.map(draft => <View key={draft.index} style={styles.group}>
          <Text style={styles.text}>{draft.title}</Text>
          <ActionButton label={text.previewRestored} disabled={model.busy} onPress={() => model.previewRestored(draft.index)} />
        </View>)}
        {model.isLeader ? <>
          <Text style={styles.heading}>{text.proposals}</Text>
          {status.proposals.map(proposal => <View key={proposal.id} style={styles.publisher}>
            <Text selectable style={styles.text}>{proposal.peer}</Text><Text style={styles.secondary}>{proposal.id} · {text.proposalStates[proposal.state]}</Text>
            {proposal.state === 'pending' || proposal.state === 'conflict' ? <>
              <ActionButton label={text.previewProposal} disabled={model.busy} onPress={() => model.previewProposal(proposal.id)} />
              <ActionButton label={text.reject} disabled={model.busy || frozen} onPress={() => model.reject(proposal.id)} />
            </> : null}
          </View>)}
        </> : null}
        {model.preview ? <>
          <SyncPreviewView preview={model.preview} />
          <ActionButton label={model.isLeader ? text.publish : text.submit} disabled={model.busy || frozen} onPress={model.isLeader ? model.publish : model.submit} />
          <ActionButton label={text.discard} disabled={model.busy} onPress={model.discard} />
        </> : null}
        <Text style={styles.heading}>{text.jobs}</Text>
        {!status.jobs.length ? <Text style={styles.secondary}>{text.noJobs}</Text> : null}
        {status.jobs.map(job => <View key={job.id} style={styles.group}>
          <Text selectable style={styles.text}>{job.id} · {text.jobKinds[job.kind]} · {text.jobStates[job.state]}</Text>
          <Text style={styles.secondary}>{text.attempts}: {job.attempts}</Text>
          {job.state === 'pending' && job.notBefore > Date.now() ? <Text style={styles.secondary}>{text.retryAfter}: {new Date(job.notBefore).toLocaleTimeString()}</Text> : null}
        </View>)}
        <Text style={styles.heading}>{text.events}</Text>
        {!status.events.length ? <Text style={styles.secondary}>{text.noEvents}</Text> : null}
        {status.events.map(event => <View key={event.id} style={styles.group}>
          <Text style={styles.text}>{new Date(event.at).toLocaleString()} · {text.eventActions[event.action] ?? text.eventRecorded}</Text>
          {event.peer ? <Text selectable style={styles.secondary}>{event.peer}</Text> : null}
          {event.hash ? <Text selectable style={styles.secondary}>{event.hash}</Text> : null}
        </View>)}
      </> : null}
    </ScrollView>
  </SafeAreaView>;
}
