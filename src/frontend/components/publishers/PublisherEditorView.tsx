import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PUBLISHER_NAME_LIMIT,
  TECHNICAL_ROLE_CODES as PUBLISHER_ROLE_CODES,
} from '../../../backend/domain/publishers/publisher';

import { publisherEn as text } from '../../../constants/strings/publisherEn';

import ActionButton from '../common/ActionButton';
import { styles } from '../../styles/publishers/publishers.styles';

import type {
  usePublisherEditor,
} from '../../hooks/usePublisherEditor';

type Props = ReturnType<typeof usePublisherEditor>;

export default function PublisherEditorView(model: Props) {
  const { draft } = model;
  const busy = model.saving || model.completed;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text accessibilityRole="header" style={styles.title}>
            {model.editing ? text.edit : text.add}
          </Text>

          {model.loadError ? (
            <View style={styles.group}>
              <Text accessibilityRole="alert" style={styles.error}>
                {model.loadError}
              </Text>

              <ActionButton
                label={text.retry}
                onPress={model.reload}
                disabled={busy}
              />
            </View>
          ) : null}

          {!draft && !model.loadError ? (
            <Text style={styles.text}>
              {text.loadingEditor}
            </Text>
          ) : null}

          {draft ? (
            <>
              <Text style={styles.heading}>{text.name}</Text>

              <TextInput
                accessibilityLabel={text.name}
                value={draft.displayName}
                onChangeText={model.setName}
                maxLength={PUBLISHER_NAME_LIMIT}
                editable={!busy}
                autoCapitalize="words"
                style={styles.input}
              />

              <View style={styles.switchRow}>
                <View style={styles.flexible}>
                  <Text style={styles.text}>{text.active}</Text>
                  <Text style={styles.secondary}>
                    {text.activeHint}
                  </Text>
                </View>

                <Switch
                  accessibilityLabel={text.active}
                  value={draft.isActive}
                  onValueChange={model.setActive}
                  disabled={busy}
                />
              </View>

              <View style={styles.roleGroup}>
                <Text
                  accessibilityRole="header"
                  style={styles.heading}
                >
                  {text.responsibilities}
                </Text>

                <Text style={styles.secondary}>
                  {text.responsibilitiesHint}
                </Text>

                {PUBLISHER_ROLE_CODES.map(role => (
                  <View key={role} style={styles.switchRow}>
                    <Text style={[styles.text, styles.flexible]}>
                      {text.roles[role]}
                    </Text>

                    <Switch
                      accessibilityLabel={text.roles[role]}
                      value={draft.roles.includes(role)}
                      onValueChange={enabled =>
                        model.setRole(role, enabled)
                      }
                      disabled={busy}
                    />
                  </View>
                ))}
              </View>

              {model.issue ? (
                <View style={styles.group}>
                  <Text
                    accessibilityRole="alert"
                    style={styles.error}
                  >
                    {model.issue.message}
                  </Text>

                  {model.issue.field === 'conflict' ? (
                    <ActionButton
                      label={text.reload}
                      onPress={model.reload}
                      disabled={busy}
                    />
                  ) : null}
                </View>
              ) : null}

              <ActionButton
                label={busy ? text.saving : text.save}
                onPress={model.save}
                disabled={busy || !model.dirty}
              />
            </>
          ) : null}

          <ActionButton
            label={text.cancel}
            onPress={model.leave}
            disabled={busy}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
