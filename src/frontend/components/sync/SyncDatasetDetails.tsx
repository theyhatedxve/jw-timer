import { Text, View } from 'react-native';
import type { SyncDataset } from '../../../backend/domain/sync/syncTypes';
import { syncEn as text } from '../../../constants/strings/syncEn';
import { publisherEn } from '../../../constants/strings/publisherEn';
import { styles } from '../../styles/publishers/publishers.styles';
import { meetingDutyEn } from '../../../constants/strings/meetingDutyEn';

export default function SyncDatasetDetails({ dataset }: { readonly dataset: SyncDataset }) {
  const repeatedNames = new Set(dataset.publishers.filter(person => dataset.publishers.some(other => other.id !== person.id && other.displayName === person.displayName)).map(person => person.displayName));
  const people = new Map(dataset.publishers.map(person => [person.id, person]));
  return <View style={styles.group}>
    <Text style={styles.heading}>{text.publisherDetails}</Text>
    {!dataset.publishers.length ? <Text style={styles.secondary}>{text.noPublishers}</Text> : null}
    {dataset.publishers.map(publisher => <View key={publisher.id} style={styles.publisher}>
      <Text style={styles.text}>{publisher.displayName}</Text>
      {repeatedNames.has(publisher.displayName) ? <Text selectable style={styles.secondary}>{text.duplicateIdentity}: {publisher.id}</Text> : null}
      <Text style={styles.secondary}>{publisher.isActive ? publisherEn.active : publisherEn.inactive}</Text>
      <Text style={styles.secondary}>{publisher.roles.length ? publisher.roles.map(role => publisherEn.roles[role]).join(', ') : publisherEn.noRoles}</Text>
    </View>)}
    <Text style={styles.heading}>{text.programDetails}</Text>
    {dataset.meetings.map(meeting => <View key={meeting.id} style={styles.publisher}>
      <Text style={styles.heading}>{meeting.draft.title}</Text>
      <Text style={styles.secondary}>{text.meetingTypes[meeting.draft.meetingType]} · {text.languages[meeting.draft.programLanguage]}</Text>
      <Text style={styles.secondary}>{text.end}: {meeting.draft.endLocalTime ?? '—'}</Text>
      {meeting.duties.map(duty => {
        const person = duty.publisherId ? people.get(duty.publisherId) : undefined;
        return person && repeatedNames.has(person.displayName) ? <Text key={duty.key} selectable style={styles.secondary}>{meetingDutyEn.labels[duty.key]}: {person.displayName} ({person.id})</Text> : null;
      })}
      {meeting.draft.importSource ? <Text style={styles.secondary}>{text.source}: {meeting.draft.importSource.filename} · {text.page} {meeting.draft.importSource.page}</Text> : null}
      {meeting.draft.sections.map((section, sectionIndex) => <View key={section.id ?? `${meeting.id}:${sectionIndex}`} style={styles.group}>
        <Text style={styles.text}>{section.title}</Text>
        {section.parts.map((part, partIndex) => <Text key={part.id ?? `${meeting.id}:${sectionIndex}:${partIndex}`} style={styles.secondary}>{part.title} · {text.partKinds[part.kind]}</Text>)}
      </View>)}
    </View>)}
  </View>;
}
