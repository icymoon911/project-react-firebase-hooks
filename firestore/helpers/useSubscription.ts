import { FirestoreError, onSnapshot, SnapshotListenOptions } from 'firebase/firestore';
import { useEffect } from 'react';
import { useLoadingValue } from '../../util';
import { RefHook } from '../../util/refHooks';

/**
 * Shared subscription hook that manages onSnapshot subscriptions for Firestore
 * references (DocumentReference, CollectionReference, Query).
 *
 * Handles:
 * - useLoadingValue state management (error/loading/value via useReducer)
 * - Ref equality checking via the provided ref hook
 * - onSnapshot subscription lifecycle with optional SnapshotListenOptions
 * - Cleanup on unmount or ref change
 */
export const useSubscription = <T, R>(
  source: T | null | undefined,
  snapshotListenOptions: SnapshotListenOptions | undefined,
  useIsRefEqual: (
    value: T | null | undefined,
    onChange?: () => void
  ) => RefHook<T | null | undefined>
): {
  ref: RefHook<T | null | undefined>;
  error: FirestoreError | undefined;
  loading: boolean;
  value: R | undefined;
} => {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    R,
    FirestoreError
  >();
  const ref = useIsRefEqual(source, reset);

  useEffect(() => {
    if (!ref.current) {
      setValue(undefined);
      return;
    }
    const unsubscribe = snapshotListenOptions
      ? onSnapshot(
          ref.current as any,
          snapshotListenOptions,
          setValue as any,
          setError
        )
      : onSnapshot(ref.current as any, setValue as any, setError);

    return () => {
      unsubscribe();
    };
  }, [ref.current]);

  return { ref, error, loading, value: value as R | undefined };
};
