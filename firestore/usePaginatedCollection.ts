import {
  DocumentData,
  DocumentSnapshot,
  FirestoreError,
  limit,
  onSnapshot,
  Query,
  query as firestoreQuery,
  QueryConstraint,
  QuerySnapshot,
  startAfter,
} from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import useIsMounted from '../util/useIsMounted';
import { useIsFirestoreQueryEqual } from './helpers';
import {
  PaginatedCollectionDataHook,
  PaginatedDataOptions,
} from './types';

/**
 * A hook that paginates a Firestore collection query using cursor-based
 * pagination (limit + startAfter). Each page is loaded incrementally and
 * subscribed to via onSnapshot for real-time updates on the current page.
 *
 * Accumulated data from previously loaded pages is preserved and never
 * re-fetched when loading subsequent pages.
 *
 * @template T - The type of the document data (defaults to DocumentData)
 * @param baseQuery - A Firestore Query (may include where/orderBy constraints).
 *                    limit/startAfter will be appended automatically.
 * @param options - Pagination and snapshot options
 * @returns A tuple of [data, loading, error, loadMore, hasMore, snapshot]
 */
export const usePaginatedCollectionData = <T = DocumentData>(
  baseQuery?: Query<T> | null,
  options?: PaginatedDataOptions<T>
): PaginatedCollectionDataHook<T> => {
  const pageSize = options?.pageSize ?? 10;
  const initialValue = options?.initialValue;

  const isMounted = useIsMounted();

  // ── Render-safe state ──────────────────────────────────────────────
  const [data, setData] = useState<T[] | undefined>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | undefined>();
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [latestSnapshot, setLatestSnapshot] = useState<
    QuerySnapshot<T> | undefined
  >();

  // ── Mutable refs (avoids stale closures inside onSnapshot) ─────────
  // Each entry is the array of deserialised docs for one loaded page.
  const pagesRef = useRef<T[][]>([]);
  const lastDocRef = useRef<DocumentSnapshot<T> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const loadingRef = useRef<boolean>(false);
  const hasMoreRef = useRef<boolean>(true);

  // Mirror frequently-changing options in refs so the snapshot callback
  // always sees the latest values without needing re-subscription.
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;
  const snapshotListenOptionsRef = useRef(options?.snapshotListenOptions);
  snapshotListenOptionsRef.current = options?.snapshotListenOptions;
  const snapshotOptionsRef = useRef(options?.snapshotOptions);
  snapshotOptionsRef.current = options?.snapshotOptions;
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  // ── Reset helper (called when the base query changes) ──────────────
  const resetPagination = useCallback(() => {
    pagesRef.current = [];
    lastDocRef.current = null;
    loadingRef.current = false;
    hasMoreRef.current = true;
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  const queryRef = useIsFirestoreQueryEqual<Query<T>>(
    baseQuery,
    resetPagination
  );

  // ── Core subscription logic ────────────────────────────────────────
  const subscribeToPage = useCallback(
    (pageIndex: number, cursor: DocumentSnapshot<T> | null) => {
      const q = queryRef.current;
      if (!q) {
        setData(initialValueRef.current);
        setLoading(false);
        loadingRef.current = false;
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }

      // Build the page-specific query with cursor + limit constraints.
      const constraints: QueryConstraint[] = [];
      if (cursor) {
        constraints.push(startAfter(cursor));
      }
      constraints.push(limit(pageSizeRef.current));

      const pageQuery = firestoreQuery(q, ...constraints);

      // Tear down the previous page's listener before subscribing to the
      // new one.  Only the *current* page is kept live; data from older
      // pages is frozen in `pagesRef`.
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Tracks whether the first snapshot for this subscription has
      // arrived yet.  The first snapshot is the initial page load; any
      // subsequent snapshots are real-time updates for the same page.
      let initialSnapshotReceived = false;

      const onSnap = (snap: QuerySnapshot<T>) => {
        if (!isMounted) return;

        const docs = snap.docs.map((d) =>
          d.data(snapshotOptionsRef.current)
        );

        // First snapshot = initial page load.  Subsequent snapshots for
        // the same subscription are real-time updates and replace the
        // page in-place (no duplicate appending).
        pagesRef.current[pageIndex] = docs;

        // The cursor for the *next* page is always the last document of
        // the latest snapshot of the current (most recent) page.
        if (snap.docs.length > 0) {
          lastDocRef.current = snap.docs[snap.docs.length - 1];
        }

        // Flatten all page arrays into a single data array.
        const allDocs: T[] = [];
        for (const page of pagesRef.current) {
          for (const doc of page) {
            allDocs.push(doc);
          }
        }

        setData(allDocs);
        setLoading(false);
        loadingRef.current = false;
        setError(undefined);
        setLatestSnapshot(snap);

        if (!initialSnapshotReceived) {
          initialSnapshotReceived = true;
          const more = snap.docs.length >= pageSizeRef.current;
          hasMoreRef.current = more;
          setHasMore(more);
        }
      };

      const onError = (err: FirestoreError) => {
        if (!isMounted) return;
        setLoading(false);
        loadingRef.current = false;
        setError(err);
      };

      const listenOpts = snapshotListenOptionsRef.current;
      const unsub = listenOpts
        ? onSnapshot(pageQuery, listenOpts, onSnap, onError)
        : onSnapshot(pageQuery, onSnap, onError);

      unsubscribeRef.current = unsub;
    },
    // queryRef is a stable ref object; reading .current at call-time
    // always yields the latest value.  isMounted is a stable boolean.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryRef, isMounted]
  );

  // ── Initial load / query change ────────────────────────────────────
  useEffect(() => {
    pagesRef.current = [];
    lastDocRef.current = null;
    loadingRef.current = true;
    hasMoreRef.current = true;
    setLoading(true);
    setError(undefined);
    setHasMore(true);

    subscribeToPage(0, null);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryRef.current]);

  // ── Load-more handler ──────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const nextPageIndex = pagesRef.current.length;
    subscribeToPage(nextPageIndex, lastDocRef.current);
  }, [subscribeToPage]);

  return [data, loading, error, loadMore, hasMore, latestSnapshot];
};
