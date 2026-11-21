import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import type {
  PublisherService,
  SavedPublisher,
} from '../../backend/services/publisherService';

type ListState =
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready';
      readonly publishers: readonly SavedPublisher[];
    }
  | {
      readonly status: 'error';
      readonly message: string;
    };

export function usePublishers(service: PublisherService) {
  const navigation = useNavigation();

  const [state, setState] = useState<ListState>({
    status: 'loading',
  });

  const [filter, setFilter] = useState('');

  const reload = useCallback(() => {
    const result = service.list();

    setState(result.ok
      ? { status: 'ready', publishers: result.value }
      : { status: 'error', message: result.error.message });
  }, [service]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const publishers = useMemo(() => {
    if (state.status !== 'ready') return [];

    const query = filter.trim().toLocaleLowerCase('en');

    return state.publishers.filter(publisher =>
      publisher.displayName
        .toLocaleLowerCase('en')
        .includes(query),
    );
  }, [state, filter]);

  return {
    state,
    publishers,
    filter,
    setFilter,
    reload,
    addPublisher: () =>
      navigation.navigate('PublisherEditor', {}),
    editPublisher: (publisherId: string) =>
      navigation.navigate('PublisherEditor', { publisherId }),
  };
}