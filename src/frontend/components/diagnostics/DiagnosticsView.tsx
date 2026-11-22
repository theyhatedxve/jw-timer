import { ActivityIndicator, Text } from 'react-native';

import { diagnosticsEn as text } from '../../../constants/strings/diagnosticsEn';

import { useAppTheme } from '../../context/AppearanceContext';
import type { useSqliteChecks } from '../../hooks/useSqliteChecks';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppScreen from '../common/AppScreen';

export default function DiagnosticsView({
  results,
  busy,
  run,
  onBack,
}: ReturnType<typeof useSqliteChecks>) {
  const { palette } = useAppTheme();

  return (
    <AppScreen>
      <Text
        accessibilityRole="header"
        className="text-app-title font-bold text-app-text"
      >
        {text.title}
      </Text>
      <Text className="text-app-body text-app-secondary">
        {text.description}
      </Text>
      <AppButton
        label={busy ? text.running : text.run}
        disabled={busy}
        onPress={run}
      />
      {busy ? (
        <ActivityIndicator
          accessibilityLabel={text.running}
          color={palette.brand}
        />
      ) : null}
      {results ? (
        <>
          <Text
            accessibilityLiveRegion="polite"
            className="text-app-body font-bold text-app-text"
          >
            {results.length > 0 && results.every(result => result.passed)
              ? text.passed
              : text.failed}
          </Text>
          {results.map((result, index) => (
            <AppCard key={`${index}:${result.name}`}>
              <Text
                selectable
                className={
                  result.passed
                    ? 'text-app-body text-app-text'
                    : 'text-app-body text-app-danger'
                }
              >
                {result.passed ? text.pass : text.fail}
                {': '}
                {result.name}
                {'\n'}
                {result.detail}
              </Text>
            </AppCard>
          ))}
        </>
      ) : null}
      <Text className="text-app-body text-app-secondary">
        {text.limitation}
      </Text>
      <AppButton label={text.back} disabled={busy} onPress={onBack} />
    </AppScreen>
  );
}
