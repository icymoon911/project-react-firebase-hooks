import { FirestoreError, onSnapshot, SnapshotListenOptions } from 'firebase/firestore';
import { useEffect } from 'react';

/**
 * Shared hook that manages a Firestore `onSnapshot` subscription.
 * Extracts the common subscribe / unsubscribe effect logic used by
 * both `useDocument` and `useCollection`.
 *
 * @param ref The Firestore DocumentReference or Query to subscribe to (or null/undefined)
 * @param setValue Callback invoked with each new snapshot
 * @param setError Callback invoked on subscription errors
 * @param snapshotListenOptions Optional snapshot listener options
 */
export default function useFirestoreSubscription<T>(
  ref: T | null | undefined,
  setValue: (value?: any) => void,
  setError: (error: FirestoreError) => void,
  snapshotListenOptions?: SnapshotListenOptions
): void {
  useEffect(() => {
    if (!ref) {
      setValue(undefined);
      return;
    }
    const unsubscribe = snapshotListenOptions
      ? onSnapshot(ref as any, snapshotListenOptions, setValue, setError)
      : onSnapshot(ref as any, setValue, setError);

    return () => {
      unsubscribe();
    };
  }, [ref, snapshotListenOptions]);
}
