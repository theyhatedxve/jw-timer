import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/ActionButton';

import { MeetingChoices, MeetingField } from './MeetingControls';
import { meetingStyles as styles } from '../../styles/meetings/meetings.styles';

import { MEETING_PLANNING_EN } from '../../../constants/strings/meetingPlanningEn';

import { MEETING_LIMITS } from '../../../backend/domain/meetings/meetingValidation';

import type {
  MeetingLanguage,
  MeetingPartKind,
  MeetingType,
} from '../../../backend/domain/meetings/meeting.types';

import type {
  useMeetingEditor,
} from '../../hooks/useMeetingEditor';

const MEETING_TYPES: readonly {
  value: MeetingType;
  label: string;
}[] = [
  { value: 'midweek', label: 'Midweek' },
  { value: 'weekend', label: 'Weekend' },
];

const LANGUAGES: readonly {
  value: MeetingLanguage;
  label: string;
}[] = [
  { value: 'en', label: 'English' },
  { value: 'war', label: 'Waray-Waray' },
];

const PART_KINDS: readonly {
  value: MeetingPartKind;
  label: string;
}[] = [
  { value: 'song', label: 'Song' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'talk', label: 'Talk' },
  { value: 'study', label: 'Study' },
  { value: 'comments', label: 'Comments' },
  { value: 'custom', label: 'Custom' },
  { value: 'other', label: 'Other' },
];

type Props = ReturnType<typeof useMeetingEditor>;

export default function MeetingEditorView(model: Props) {
  const { form } = model;
  const busy = model.saving || model.completed;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            accessibilityRole="header"
            style={styles.title}
          >
            {model.editing ? 'Edit meeting' : 'Create meeting'}
          </Text>

          <ActionButton
            label="Back to meetings"
            onPress={model.leave}
            disabled={busy}
          />

          {model.loadError ? (
            <View style={styles.group}>
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={styles.error}
              >
                {model.loadError}
              </Text>

              <ActionButton
                label="Retry loading"
                onPress={model.reload}
                disabled={busy}
              />
            </View>
          ) : null}

          {!form && !model.loadError ? (
            <Text style={styles.body}>Loading meeting…</Text>
          ) : null}

          {form ? (
            <>
              <Text style={styles.supporting}>
                Local draft. Changes are stored when you press
                Save meeting.
              </Text>

              <MeetingField
                label="Meeting title"
                value={form.title}
                editable={!busy}
                onChangeText={value =>
                  model.updateHeader('title', value)
                }
              />

              <MeetingChoices
                label="Meeting type"
                value={form.meetingType}
                options={MEETING_TYPES}
                disabled={busy}
                onChange={value =>
                  model.updateHeader('meetingType', value)
                }
              />

              <MeetingField
                label="Meeting date"
                hint="Use YYYY-MM-DD, for example 2026-11-25."
                value={form.meetingDate}
                editable={!busy}
                onChangeText={value =>
                  model.updateHeader('meetingDate', value)
                }
              />

              <MeetingField
                label="Start time"
                hint="Optional. Use 24-hour HH:mm, for example 18:30."
                value={form.startLocalTime}
                editable={!busy}
                onChangeText={value =>
                  model.updateHeader('startLocalTime', value)
                }
              />

              <MeetingField
                label={MEETING_PLANNING_EN.endTimeLabel}
                hint={MEETING_PLANNING_EN.endTimeHint}
                value={form.endLocalTime}
                editable={!busy}
                onChangeText={value =>
                  model.updateHeader('endLocalTime', value)
                }
              />

              <MeetingField
                label="Time zone"
                hint="For example, Asia/Manila."
                value={form.timezone}
                editable={!busy}
                onChangeText={value =>
                  model.updateHeader('timezone', value)
                }
              />

              <MeetingChoices
                label="Program language"
                value={form.programLanguage}
                options={LANGUAGES}
                disabled={busy}
                onChange={value =>
                  model.updateHeader('programLanguage', value)
                }
              />

              <Text
                accessibilityRole="header"
                style={styles.heading}
              >
                Sections and parts
              </Text>

              {form.sections.length === 0 ? (
                <Text style={styles.body}>
                  No sections yet. You can save an empty draft
                  and finish it later.
                </Text>
              ) : null}

              {form.sections.map((section, sectionIndex) => (
                <View key={section.key} style={styles.card}>
                  <Text
                    accessibilityRole="header"
                    style={styles.heading}
                  >
                    Section {sectionIndex + 1}
                  </Text>

                  <MeetingField
                    label={`Section ${sectionIndex + 1} title`}
                    value={section.title}
                    editable={!busy}
                    onChangeText={value =>
                      model.updateSectionTitle(section.key, value)
                    }
                  />

                  <View style={styles.actions}>
                    <ActionButton
                      label={`Move section ${sectionIndex + 1} up`}
                      disabled={busy || sectionIndex === 0}
                      onPress={() =>
                        model.moveSection(section.key, -1)
                      }
                    />

                    <ActionButton
                      label={`Move section ${sectionIndex + 1} down`}
                      disabled={
                        busy ||
                        sectionIndex === form.sections.length - 1
                      }
                      onPress={() =>
                        model.moveSection(section.key, 1)
                      }
                    />

                    <ActionButton
                      label={`Remove section ${sectionIndex + 1}`}
                      disabled={busy}
                      onPress={() =>
                        model.removeSection(section.key)
                      }
                    />
                  </View>

                  {section.parts.map((part, partIndex) => {
                    const partLabel =
                      `Section ${sectionIndex + 1}, part ${partIndex + 1}`;

                    return (
                      <View key={part.key} style={styles.part}>
                        <Text
                          accessibilityRole="header"
                          style={styles.heading}
                        >
                          Part {partIndex + 1}
                        </Text>

                        <MeetingField
                          label={`${partLabel} title`}
                          value={part.title}
                          editable={!busy}
                          onChangeText={value =>
                            model.updatePart(
                              section.key,
                              part.key,
                              { title: value },
                            )
                          }
                        />

                        <MeetingChoices
                          label={`${partLabel} type`}
                          value={part.kind}
                          options={PART_KINDS}
                          disabled={busy}
                          onChange={value =>
                            model.updatePart(
                              section.key,
                              part.key,
                              { kind: value },
                            )
                          }
                        />

                        <Text style={styles.label}>
                          Include this part in timing
                        </Text>

                        <Switch
                          accessibilityLabel={`${partLabel}: include in timing`}
                          value={part.isTimed}
                          disabled={busy}
                          onValueChange={value =>
                            model.updatePart(
                              section.key,
                              part.key,
                              { isTimed: value },
                            )
                          }
                        />

                        <MeetingField
                          label={`${partLabel} duration in seconds`}
                          hint="For example, 300 seconds is 5 minutes."
                          value={part.durationText}
                          keyboardType="number-pad"
                          editable={!busy}
                          onChangeText={value =>
                            model.updatePart(
                              section.key,
                              part.key,
                              { durationText: value },
                            )
                          }
                        />

                        <View style={styles.actions}>
                          <ActionButton
                            label={`Move ${partLabel} up`}
                            disabled={busy || partIndex === 0}
                            onPress={() =>
                              model.movePart(
                                section.key,
                                part.key,
                                -1,
                              )
                            }
                          />

                          <ActionButton
                            label={`Move ${partLabel} down`}
                            disabled={
                              busy ||
                              partIndex === section.parts.length - 1
                            }
                            onPress={() =>
                              model.movePart(
                                section.key,
                                part.key,
                                1,
                              )
                            }
                          />

                          <ActionButton
                            label={`Remove ${partLabel}`}
                            disabled={busy}
                            onPress={() =>
                              model.removePart(section.key, part.key)
                            }
                          />
                        </View>
                      </View>
                    );
                  })}

                  <ActionButton
                    label={`Add part to section ${sectionIndex + 1}`}
                    disabled={
                      busy ||
                      section.parts.length >=
                        MEETING_LIMITS.partsPerSection
                    }
                    onPress={() => model.addPart(section.key)}
                  />
                </View>
              ))}

              <ActionButton
                label="Add section"
                disabled={
                  busy ||
                  form.sections.length >= MEETING_LIMITS.sectionCount
                }
                onPress={model.addSection}
              />

              {model.issue ? (
                <View style={styles.group}>
                  <Text
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                    style={styles.error}
                  >
                    {model.issue.message}
                  </Text>

                  {model.issue.field === 'conflict' ? (
                    <ActionButton
                      label="Reload saved meeting"
                      onPress={model.reload}
                      disabled={busy}
                    />
                  ) : null}
                </View>
              ) : null}

              <ActionButton
                label={busy ? 'Saving…' : 'Save meeting'}
                disabled={busy}
                onPress={model.save}
              />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}