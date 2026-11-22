import { KeyboardAvoidingView, Text } from 'react-native';

import {
  PUBLISHER_NAME_LIMIT,
  TECHNICAL_ROLE_CODES,
} from '../../../backend/domain/publishers/publisher';

import { publisherEn as text } from '../../../constants/strings/publisherEn';
import type { usePublisherEditor } from '../../hooks/usePublisherEditor';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppInput from '../common/AppInput';
import AppScreen from '../common/AppScreen';
import AppToggleRow from '../common/AppToggleRow';

type Props = ReturnType<typeof usePublisherEditor>;

export default function PublisherEditorView(model: Props) {
  const { draft } = model;
  const busy = model.saving || model.completed;

  return (
    <KeyboardAvoidingView className="flex-1 bg-app-canvas" behavior="height">
      <AppScreen>
        <Text
          accessibilityRole="header"
          className="text-app-title font-bold text-app-text"
        >
          {model.editing ? text.edit : text.add}
        </Text>
        {model.loadError ? (
          <AppCard>
            <Text accessibilityRole="alert" className="text-app-body text-app-danger">
              {model.loadError}
            </Text>
            <AppButton label={text.retry} onPress={model.reload} disabled={busy} />
          </AppCard>
        ) : null}
        {!draft && !model.loadError ? (
          <Text
            accessibilityLiveRegion="polite"
            className="text-app-body text-app-secondary"
          >
            {text.loadingEditor}
          </Text>
        ) : null}
        {draft ? (
          <>
            <AppCard>
              <Text className="text-app-body font-bold text-app-text">
                {text.name}
              </Text>
              <AppInput
                accessibilityLabel={text.name}
                value={draft.displayName}
                onChangeText={model.setName}
                maxLength={PUBLISHER_NAME_LIMIT}
                editable={!busy}
                autoCapitalize="words"
              />
              <AppToggleRow
                label={text.active}
                hint={text.activeHint}
                value={draft.isActive}
                onValueChange={model.setActive}
                disabled={busy}
              />
            </AppCard>
            <AppCard>
              <Text
                accessibilityRole="header"
                className="text-app-body font-bold text-app-text"
              >
                {text.responsibilities}
              </Text>
              <Text className="text-app-body text-app-secondary">
                {text.responsibilitiesHint}
              </Text>
              {TECHNICAL_ROLE_CODES.map(role => (
                <AppToggleRow
                  key={role}
                  label={text.roles[role]}
                  value={draft.roles.includes(role)}
                  onValueChange={enabled => model.setRole(role, enabled)}
                  disabled={busy}
                />
              ))}
            </AppCard>
            {model.issue ? (
              <AppCard>
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  className="text-app-body text-app-danger"
                >
                  {model.issue.message}
                </Text>
                {model.issue.field === 'conflict' ? (
                  <AppButton
                    label={text.reload}
                    onPress={model.reload}
                    disabled={busy}
                  />
                ) : null}
              </AppCard>
            ) : null}
            <AppButton
              label={busy ? text.saving : text.save}
              onPress={model.save}
              disabled={busy || !model.dirty}
            />
          </>
        ) : null}
        <AppButton label={text.cancel} onPress={model.leave} disabled={busy} />
      </AppScreen>
    </KeyboardAvoidingView>
  );
}
