import {
  DocumentData,
  FirestoreError,
  getDocs,
  getDocsFromCache,
  getDocsFromServer,
  Query,
  QuerySnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo } from 'react';
import { useLoadingValue } from '../util';
import useIsMounted from '../util/useIsMounted';
import { useIsFirestoreQueryEqual, useSubscription } from './helpers';
import {
  CollectionDataHook,
  CollectionDataOnceHook,
  CollectionHook,
  CollectionOnceHook,
  DataOptions,
  GetOptions,
  InitialValueOptions,
  OnceDataOptions,
  OnceOptions,
  Options,
} from './types';

export const useCollection = <T = DocumentData>(
  query?: Query<T> | null,
  options?: Options
): CollectionHook<T> => {
  const { value, loading, error } = useSubscription<Query<T>, QuerySnapshot<T>>(
    query ?? null,
    options?.snapshotListenOptions,
    useIsFirestoreQueryEqual
  );

  return [value as QuerySnapshot<T>, loading, error];
};

export const useCollectionOnce = <T = DocumentData>(
  query?: Query<T> | null,
  options?: OnceOptions
): CollectionOnceHook<T> => {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    QuerySnapshot<T>,
    FirestoreError
  >();
  const isMounted = useIsMounted();
  const ref = useIsFirestoreQueryEqual<Query<T>>(query, reset);

  const loadData = useCallback(
    async (query?: Query<T> | null, options?: Options & OnceOptions) => {
      if (!query) {
        setValue(undefined);
        return;
      }
      const get = getDocsFnFromGetOptions(options?.getOptions);

      try {
        const result = await get(query);
        if (isMounted) {
          setValue(result);
        }
      } catch (error) {
        if (isMounted) {
          setError(error as FirestoreError);
        }
      }
    },
    []
  );

  const reloadData = useCallback(() => loadData(ref.current, options), [
    loadData,
    ref.current,
  ]);

  useEffect(() => {
    loadData(ref.current, options);
  }, [ref.current]);

  return [value as QuerySnapshot<T>, loading, error, reloadData];
};

export const useCollectionData = <T = DocumentData>(
  query?: Query<T> | null,
  options?: DataOptions<T> & InitialValueOptions<T[]>
): CollectionDataHook<T> => {
  const [snapshots, loading, error] = useCollection<T>(query, options);

  const values = getValuesFromSnapshots<T>(
    snapshots,
    options?.snapshotOptions,
    options?.initialValue
  );

  return [values, loading, error, snapshots];
};

export const useCollectionDataOnce = <T = DocumentData>(
  query?: Query<T> | null,
  options?: OnceDataOptions<T> & InitialValueOptions<T[]>
): CollectionDataOnceHook<T> => {
  const [snapshots, loading, error, reloadData] = useCollectionOnce<T>(
    query,
    options
  );

  const values = getValuesFromSnapshots<T>(
    snapshots,
    options?.snapshotOptions,
    options?.initialValue
  );

  return [values, loading, error, snapshots, reloadData];
};

const getValuesFromSnapshots = <T>(
  snapshots: QuerySnapshot<T> | undefined,
  options?: SnapshotOptions,
  initialValue?: T[]
): T[] | undefined => {
  return useMemo(
    () =>
      (snapshots?.docs.map((doc) => doc.data(options)) ?? initialValue) as
        | T[]
        | undefined,
    [snapshots, options]
  );
};

const getDocsFnFromGetOptions = (
  { source }: GetOptions = { source: 'default' }
) => {
  switch (source) {
    default:
    case 'default':
      return getDocs;
    case 'cache':
      return getDocsFromCache;
    case 'server':
      return getDocsFromServer;
  }
};
