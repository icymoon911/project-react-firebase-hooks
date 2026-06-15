import {
  DocumentData,
  FirestoreError,
  getDocs,
  limit,
  onSnapshot,
  Query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  SnapshotListenOptions,
  SnapshotOptions,
  query,
  queryEqual,
  startAfter,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { PaginatedCollectionDataHook } from './types';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type PageEntry<T> = {
  docs: QueryDocumentSnapshot<T>[];
  unsubscribe: (() => void) | null;
};

type PaginatedState<T> = {
  pages: PageEntry<T>[];
  loading: boolean;
  loadingMore: boolean;
  error: FirestoreError | undefined;
  hasMore: boolean;
};

type PaginatedAction<T> =
  | { type: 'reset' }
  | { type: 'loading_start' }
  | { type: 'loading_more_start' }
  | {
      type: 'page_loaded';
      pageIndex: number;
      docs: QueryDocumentSnapshot<T>[];
      pageSize: number;
      unsubscribe: (() => void) | null;
    }
  | {
      type: 'page_updated';
      pageIndex: number;
      docs: QueryDocumentSnapshot<T>[];
      pageSize: number;
    }
  | { type: 'error'; error: FirestoreError }
  | { type: 'set_has_more'; hasMore: boolean };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const paginatedReducer = <T>() => (
  state: PaginatedState<T>,
  action: PaginatedAction<T>
): PaginatedState<T> => {
  switch (action.type) {
    case 'reset':
      return {
        pages: [],
        loading: true,
        loadingMore: false,
        error: undefined,
        hasMore: true,
      };
    case 'loading_start':
      return { ...state, loading: true, error: undefined };
    case 'loading_more_start':
      return { ...state, loadingMore: true, error: undefined };
    case 'page_loaded': {
      const nextPages = [...state.pages];
      nextPages[action.pageIndex] = {
        docs: action.docs,
        unsubscribe: action.unsubscribe,
      };
      return {
        ...state,
        pages: nextPages,
        loading: false,
        loadingMore: false,
        hasMore: action.docs.length >= action.pageSize,
      };
    }
    case 'page_updated': {
      const nextPages = [...state.pages];
      const existing = nextPages[action.pageIndex];
      nextPages[action.pageIndex] = {
        docs: action.docs,
        unsubscribe: existing?.unsubscribe ?? null,
      };
      const isLastPage = action.pageIndex === nextPages.length - 1;
      return {
        ...state,
        pages: nextPages,
        loading: false,
        loadingMore: false,
        hasMore: isLastPage
          ? action.docs.length >= action.pageSize
          : state.hasMore,
      };
    }
    case 'error':
      return {
        ...state,
        loading: false,
        loadingMore: false,
        error: action.error,
      };
    case 'set_has_more':
      return { ...state, hasMore: action.hasMore };
    default:
      return state;
  }
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildPageQuery = <T>(
  baseQuery: Query<T>,
  pageIndex: number,
  pages: PageEntry<T>[],
  pageSize: number
): Query<T> | null => {
  if (pageIndex === 0) {
    return query(baseQuery, limit(pageSize));
  }
  const prevPage = pages[pageIndex - 1];
  if (!prevPage || prevPage.docs.length === 0) {
    return null;
  }
  const lastDoc = prevPage.docs[prevPage.docs.length - 1];
  return query(baseQuery, startAfter(lastDoc), limit(pageSize));
};

const subscribeToPage = <T>(
  pageQuery: Query<T>,
  pageIndex: number,
  pageSize: number,
  dispatch: React.Dispatch<PaginatedAction<T>>,
  snapshotListenOptions?: SnapshotListenOptions
): (() => void) => {
  const onSnap = (snapshot: QuerySnapshot<T>) => {
    dispatch({
      type: 'page_updated',
      pageIndex,
      docs: snapshot.docs,
      pageSize,
    });
  };

  const onError = (err: FirestoreError) => {
    dispatch({ type: 'error', error: err });
  };

  if (snapshotListenOptions) {
    return onSnapshot(pageQuery, snapshotListenOptions, onSnap, onError);
  }
  return onSnapshot(pageQuery, onSnap, onError);
};

const unsubscribeAll = <T>(pages: PageEntry<T>[]) => {
  for (const page of pages) {
    page.unsubscribe?.();
  }
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * usePaginatedCollectionData
 *
 * Incrementally loads Firestore collection data in pages using cursor-based
 * pagination (`limit` + `startAfter`). Loading more data does NOT re-fetch
 * previously loaded pages.
 *
 * A per-page `onSnapshot` listener is set up so that changes to already-loaded
 * data are automatically reflected in real time.
 *
 * @param baseQuery  Firestore query to paginate over. Any `where` / `orderBy`
 *                   constraints should already be applied. Pagination
 *                   (`limit` / `startAfter`) is added automatically.
 * @param options    Pagination options.
 * @returns          `[data, loading, error, loadMore, hasMore, loadingMore, snapshots]`
 */
export const usePaginatedCollectionData = <T = DocumentData>(
  baseQuery?: Query<T> | null,
  options?: {
    pageSize?: number;
    initialValue?: T[];
    snapshotListenOptions?: SnapshotListenOptions;
    snapshotOptions?: SnapshotOptions;
  }
): PaginatedCollectionDataHook<T> => {
  const pageSize = options?.pageSize ?? 25;
  const initialValue = options?.initialValue;
  const snapshotListenOptions = options?.snapshotListenOptions;
  const snapshotOptions = options?.snapshotOptions;

  const [state, dispatch] = useReducer(paginatedReducer<T>(), {
    pages: [],
    loading: true,
    loadingMore: false,
    error: undefined,
    hasMore: true,
  } as PaginatedState<T>);

  // Use refs so closures (effects, callbacks) always see latest values
  const pagesRef = useRef(state.pages);
  pagesRef.current = state.pages;

  const nextPageIndexRef = useRef(0);
  const isMountedRef = useRef(true);
  const baseQueryRef = useRef<Query<T> | null | undefined>(undefined);

  // ---- Unmount cleanup ---------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      unsubscribeAll(pagesRef.current);
    };
  }, []);

  // ---- React to query changes: reset + load first page --------------------
  useEffect(() => {
    const prev = baseQueryRef.current;

    const isFirstRender = prev === undefined;
    const bothNull = !prev && !baseQuery;
    const oneNull = !prev || !baseQuery;
    const changed =
      isFirstRender ||
      (!bothNull && (oneNull || !queryEqual(prev as Query<T>, baseQuery as Query<T>)));

    baseQueryRef.current = baseQuery;

    if (!changed) return;

    // Tear down any existing listeners
    unsubscribeAll(pagesRef.current);
    nextPageIndexRef.current = 0;
    dispatch({ type: 'reset' });

    if (!baseQuery) return;

    const firstQuery = query(baseQuery, limit(pageSize));
    dispatch({ type: 'loading_start' });

    getDocs(firstQuery)
      .then((snapshot) => {
        if (!isMountedRef.current) return;

        const unsub = subscribeToPage<T>(
          firstQuery,
          0,
          pageSize,
          dispatch,
          snapshotListenOptions
        );

        dispatch({
          type: 'page_loaded',
          pageIndex: 0,
          docs: snapshot.docs,
          pageSize,
          unsubscribe: unsub,
        });

        nextPageIndexRef.current = 1;
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        dispatch({ type: 'error', error: err as FirestoreError });
      });

    // Cleanup when baseQuery changes again (before next effect runs)
    return () => {
      unsubscribeAll(pagesRef.current);
    };
  }, [baseQuery, pageSize, snapshotListenOptions]);

  // ---- loadMore -----------------------------------------------------------
  const loadMore = useCallback(() => {
    const bq = baseQueryRef.current;
    if (!bq || state.loading || state.loadingMore || !state.hasMore) return;

    const pageIndex = nextPageIndexRef.current;
    const pageQuery = buildPageQuery<T>(
      bq,
      pageIndex,
      pagesRef.current,
      pageSize
    );

    if (!pageQuery) {
      dispatch({ type: 'set_has_more', hasMore: false });
      return;
    }

    dispatch({ type: 'loading_more_start' });

    getDocs(pageQuery)
      .then((snapshot) => {
        if (!isMountedRef.current) return;

        const unsub = subscribeToPage<T>(
          pageQuery,
          pageIndex,
          pageSize,
          dispatch,
          snapshotListenOptions
        );

        dispatch({
          type: 'page_loaded',
          pageIndex,
          docs: snapshot.docs,
          pageSize,
          unsubscribe: unsub,
        });

        nextPageIndexRef.current = pageIndex + 1;
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        dispatch({ type: 'error', error: err as FirestoreError });
      });
  }, [state.loading, state.loadingMore, state.hasMore, pageSize, snapshotListenOptions]);

  // ---- Derived data -------------------------------------------------------

  const allDocs: QueryDocumentSnapshot<T>[] = useMemo(
    () => state.pages.flatMap((page) => page.docs),
    [state.pages]
  );

  const data: T[] | undefined = useMemo(() => {
    if (allDocs.length > 0) {
      return allDocs.map((doc) => doc.data(snapshotOptions) as T);
    }
    return initialValue;
  }, [allDocs, snapshotOptions, initialValue]);

  return [
    data,
    state.loading,
    state.error,
    loadMore,
    state.hasMore,
    state.loadingMore,
    allDocs,
  ];
};
