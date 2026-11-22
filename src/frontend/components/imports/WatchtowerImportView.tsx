import { Text, View } from 'react-native';

import AppButton from '../common/AppButton';
import { MeetingField } from '../meetings/MeetingControls';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import type { useWatchtowerImport } from '../../hooks/useWatchtowerImport';

import { formatProgramDuration } from '../../../constants/strings/programFormatting';
import { workbookParsingEn } from '../../../constants/strings/workbookParsingEn';
import { watchtowerImportEn as text } from '../../../constants/strings/watchtowerImportEn';

interface Props {
  readonly model: ReturnType<typeof useWatchtowerImport>;
}

const fields = [
  'articleTitle',
  'openingSong',
  'middleSong',
  'closingSong',
  'meetingDate',
  'startLocalTime',
] as const;

export default function WatchtowerImportView({ model }: Props) {
  const styles = useDocumentStyles();
  const review = model.review;
  const parts = model.preview?.sections.flatMap(
    section => section.parts,
  ) ?? [];

  if (model.candidates.length === 0) return null;

  return (
    <View style={styles.group}>
      <Text accessibilityRole="header" style={styles.heading}>
        {text.title}
      </Text>
      <Text style={styles.secondary}>{text.scope}</Text>

      {model.timezone === null ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {text.profile}
        </Text>
      ) : null}

      {model.candidates.map(candidate => (
        <View key={candidate.key} style={styles.publisher}>
          <Text style={styles.heading}>{candidate.articleTitle}</Text>
          <Text style={styles.text}>{candidate.printedWeek}</Text>
          <Text style={styles.secondary}>
            {workbookParsingEn.page(candidate.page)}
          </Text>
          <AppButton
            label={text.choose}
            disabled={model.disabled || model.timezone === null}
            onPress={() => model.choose(candidate.key)}
          />
        </View>
      ))}

      {review ? (
        <View style={styles.publisher}>
          <Text accessibilityRole="header" style={styles.heading}>
            {text.review}
          </Text>
          <Text style={styles.text}>
            {review.candidate.printedWeek}
          </Text>
          <Text style={styles.secondary}>{text.openingHint}</Text>

          {fields.map(field => (
            <MeetingField
              key={field}
              label={text.fields[field]}
              value={review.fields[field]}
              editable={!model.disabled}
              keyboardType={
                field.endsWith('Song') ? 'number-pad' : 'default'
              }
              onChangeText={value => model.change(field, value)}
            />
          ))}

          {model.timezone !== null ? (
            <>
              <Text style={styles.text}>
                {text.timezone(model.timezone)}
              </Text>
              <Text style={styles.secondary}>
                {text.timezoneHint}
              </Text>
            </>
          ) : null}

          <Text accessibilityRole="header" style={styles.heading}>
            {text.preview}
          </Text>

          {model.preview ? (
            <>
              {parts.map((part, index) => (
                <Text key={index} style={styles.text}>
                  {part.title}: {formatProgramDuration(part.durationSeconds)}
                </Text>
              ))}
              <Text style={styles.heading}>
                {text.total(formatProgramDuration(
                  parts.reduce(
                    (total, part) => total + part.durationSeconds,
                    0,
                  ),
                ))}
              </Text>
            </>
          ) : (
            <Text style={styles.secondary}>{text.incomplete}</Text>
          )}

          {model.issue ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {model.issue}
            </Text>
          ) : null}

          <AppButton
            label={text.open}
            disabled={model.disabled || model.timezone === null}
            onPress={model.openEditor}
          />
          <AppButton
            label={text.cancel}
            disabled={model.disabled}
            onPress={model.cancel}
          />
        </View>
      ) : null}
    </View>
  );
}
