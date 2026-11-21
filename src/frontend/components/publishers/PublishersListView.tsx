import {
  FlatList,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { publisherEn as text } from '../../../constants/strings/publisherEn';

import ActionButton from '../common/ActionButton';

import {
  publisherColors,
  styles,
} from '../../styles/publishers/publishers.styles';

import type { usePublishers } from '../../hooks/usePublishers';

type Props = ReturnType<typeof usePublishers>;

export default function PublishersListView(model: Props) {
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 700 && fontScale <= 1.3;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <FlatList
        data={model.publishers}
        keyExtractor={publisher => publisher.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.group}>
            <Text accessibilityRole="header" style={styles.title}>
              {text.title}
            </Text>

            <TextInput
              accessibilityLabel={text.filter}
              placeholder={text.filter}
              placeholderTextColor={publisherColors.secondary}
              value={model.filter}
              onChangeText={model.setFilter}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <ActionButton
              label={text.add}
              onPress={model.addPublisher}
            />

            <Text style={styles.secondary}>
              {text.responsibilities}
            </Text>

            {model.state.status === 'error' ? (
              <>
                <Text
                  accessibilityRole="alert"
                  style={styles.error}
                >
                  {model.state.message}
                </Text>

                <ActionButton
                  label={text.retry}
                  onPress={model.reload}
                />
              </>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          model.state.status === 'loading' ? (
            <Text style={styles.text}>{text.loading}</Text>
          ) : model.state.status === 'ready' ? (
            <Text style={styles.text}>
              {model.state.publishers.length === 0
                ? text.empty
                : text.noMatches}
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.publisher,
              wide && styles.wideRow,
            ]}
          >
            <View style={styles.flexible}>
              <Text style={styles.heading}>
                {item.displayName}
              </Text>

              {!item.isActive ? (
                <Text style={styles.secondary}>
                  {text.inactive}
                </Text>
              ) : null}
            </View>

            <View style={styles.flexible}>
              {item.roles.length === 0 ? (
                <Text style={styles.secondary}>
                  {text.noRoles}
                </Text>
              ) : (
                <View style={styles.roles}>
                  {item.roles.map(role => (
                    <Text key={role} style={styles.badge}>
                      {text.roles[role]}
                    </Text>
                  ))}
                </View>
              )}

              <ActionButton
                label={`${text.edit}: ${item.displayName}`}
                onPress={() => model.editPublisher(item.id)}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}