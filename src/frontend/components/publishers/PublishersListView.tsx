import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TECHNICAL_ROLE_CODES } from '../../../backend/domain/publishers/publisher';
import { publisherEn as text } from '../../../constants/strings/publisherEn';
import { dimensions, spacing } from '../../../constants/theme';

import { useAppTheme } from '../../context/AppearanceContext';
import type { usePublishers } from '../../hooks/usePublishers';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppInput from '../common/AppInput';

type Props = ReturnType<typeof usePublishers>;

export default function PublishersListView(model: Props) {
  const { palette } = useAppTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.canvas }}
      edges={['left', 'right', 'bottom']}
    >
      <FlatList
        data={model.publishers}
        keyExtractor={publisher => publisher.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          width: '100%',
          maxWidth: dimensions.contentWidth,
          alignSelf: 'center',
          padding: spacing.large,
          gap: spacing.medium,
        }}
        ListHeaderComponent={
          <View className="gap-app-medium">
            <Text
              accessibilityRole="header"
              className="text-app-title font-bold text-app-text"
            >
              {text.title}
            </Text>
            <AppInput
              accessibilityLabel={text.filter}
              placeholder={text.filter}
              value={model.filter}
              onChangeText={model.setFilter}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AppButton label={text.add} onPress={model.addPublisher} />
            <Text className="text-app-body text-app-secondary">
              {text.responsibilities}
            </Text>
            {model.state.status === 'error' ? (
              <AppCard>
                <Text accessibilityRole="alert" className="text-app-body text-app-danger">
                  {model.state.message}
                </Text>
                <AppButton label={text.retry} onPress={model.reload} />
              </AppCard>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          model.state.status === 'loading' ? (
            <Text
              accessibilityLiveRegion="polite"
              className="text-app-body text-app-secondary"
            >
              {text.loading}
            </Text>
          ) : model.state.status === 'ready' ? (
            <AppCard>
              <Text className="text-app-body text-app-secondary">
                {model.state.publishers.length === 0 ? text.empty : text.noMatches}
              </Text>
            </AppCard>
          ) : undefined
        }
        renderItem={({ item }) => {
          const roles = TECHNICAL_ROLE_CODES.filter(role => item.roles.includes(role));

          return (
            <AppCard>
              <Text
                accessibilityRole="header"
                className="text-app-body font-bold text-app-text"
              >
                {item.displayName}
              </Text>
              {!item.isActive ? (
                <Text className="text-app-body text-app-secondary">
                  {text.inactive}
                </Text>
              ) : null}
              {roles.length === 0 ? (
                <Text className="text-app-body text-app-secondary">
                  {text.noRoles}
                </Text>
              ) : (
                <View className="gap-app-small">
                  {roles.map(role => (
                    <View
                      key={role}
                      className="self-start rounded-app-button border border-app-border px-app-small py-app-small"
                    >
                      <Text className="text-app-body text-app-text">
                        {text.roles[role]}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <AppButton
                label={`${text.edit}: ${item.displayName}`}
                onPress={() => model.editPublisher(item.id)}
              />
            </AppCard>
          );
        }}
      />
    </SafeAreaView>
  );
}
