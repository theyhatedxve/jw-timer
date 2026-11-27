import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dimensions, spacing } from '../../../constants/theme';
import { PROFILE_LIMITS } from '../../../backend/domain/profile/profile';
import { PROFILE_TEXT as text } from '../../../constants/strings/profileEn';
import { useAppTheme } from '../../context/AppearanceContext';
import { useProfileStyles } from '../../styles/profile/profileForm.styles';
import AppButton from '../common/AppButton';
import AppIcon from '../common/AppIcon';
import AppInput from '../common/AppInput';

const FALLBACK_TIMEZONES = [
  'Africa/Johannesburg', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/New_York', 'America/Sao_Paulo',
  'Asia/Hong_Kong', 'Asia/Kolkata', 'Asia/Manila', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney', 'Europe/London', 'Europe/Paris',
  'Pacific/Auckland', 'UTC',
];

function availableTimezones(current: string): readonly string[] {
  let supported: readonly string[] = FALLBACK_TIMEZONES;
  try {
    const intl = Intl as typeof Intl & {
      supportedValuesOf?: (key: 'timeZone') => readonly string[];
    };
    supported = intl.supportedValuesOf?.('timeZone') ?? FALLBACK_TIMEZONES;
  } catch {
    // Some Android Intl runtimes omit timezone enumeration; manual entry remains available.
  }
  return [...new Set([current, 'Asia/Manila', 'Asia/Singapore', 'UTC', ...supported])].filter(Boolean);
}

export default function TimezonePicker({ value, select, close }: {
  readonly value: string;
  readonly select: (timezone: string) => void;
  readonly close: () => void;
}) {
  const [query, setQuery] = useState('');
  const { palette } = useAppTheme();
  const styles = useProfileStyles();
  const options = useMemo(() => availableTimezones(value), [value]);
  const normalized = query.trim().replace(/_/g, ' ').toLowerCase();
  const matches = options.filter(option => option.replace(/_/g, ' ').toLowerCase().includes(normalized));

  function choose(timezone: string) {
    select(timezone);
    close();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close} supportedOrientations={['portrait', 'landscape']}>
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.canvas + 'E6' }}>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', padding: spacing.medium }} behavior="height">
          <View accessibilityViewIsModal style={[styles.section, { width: '100%', maxWidth: dimensions.contentWidth, height: '90%', alignSelf: 'center' }]}>
            <View style={styles.sectionHeading}>
              <AppIcon name="clock" color={palette.brand} size={24} />
              <Text accessibilityRole="header" style={styles.sectionTitle}>{text.chooseTimezone}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={text.closeTimezone} onPress={close} style={styles.back}>
                <AppIcon name="close" color={palette.secondary} size={24} />
              </Pressable>
            </View>
            <View style={[styles.sectionBody, { flex: 1 }]}>
              <AppInput
                accessibilityLabel={text.searchTimezone}
                placeholder={text.searchTimezone}
                value={query}
                onChangeText={setQuery}
                maxLength={PROFILE_LIMITS.timezone}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <FlatList
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                data={matches}
                keyExtractor={item => item}
                extraData={value}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityLabel={item}
                    accessibilityState={{ checked: item === value }}
                    onPress={() => choose(item)}
                    style={({ pressed }) => [styles.option, { marginBottom: spacing.small, backgroundColor: item === value ? palette.selection : palette.surface, opacity: pressed ? 0.75 : 1 }]}
                  >
                    <Text style={styles.optionText}>{item}</Text>
                    {item === value ? <AppIcon name="check" color={palette.brand} size={22} /> : null}
                  </Pressable>
                )}
                ListEmptyComponent={<Text style={styles.body}>{text.noTimezones}</Text>}
              />
              {query.trim() && !options.includes(query.trim()) ? (
                <AppButton label={text.useTimezone(query.trim())} onPress={() => choose(query.trim())} />
              ) : null}
              <Text style={styles.footnote}>{text.timezoneHint}</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
