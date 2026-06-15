import {
  DocumentData,
  DocumentSnapshot,
  FirestoreError,
  QueryDocumentSnapshot,
  QuerySnapshot,
  SnapshotListenOptions,
  SnapshotOptions,
} from 'firebase/firestore';
import { LoadingHook } from '../util';

export type IDOptions<T> = {
  snapshotOptions?: SnapshotOptions;
};
export type Options = {
  snapshotListenOptions?: SnapshotListenOptions;
};
export type InitialValueOptions<T> = {
  initialValue?: T;
};
export type DataOptions<T> = Options & IDOptions<T>;
export type OnceOptions = {
  getOptions?: GetOptions;
};
export type GetOptions = {
  source?: 'default' | 'server' | 'cache';
};
export type OnceDataOptions<T> = OnceOptions & IDOptions<T>;

export type CollectionHook<T = DocumentData> = LoadingHook<
  QuerySnapshot<T>,
  FirestoreError
>;
export type CollectionOnceHook<T = DocumentData> = [
  ...CollectionHook<T>,
  () => Promise<void>
];
export type CollectionDataHook<T = DocumentData> = [
  ...LoadingHook<T[], FirestoreError>,
  QuerySnapshot<T> | undefined
];
export type CollectionDataOnceHook<T = DocumentData> = [
  ...CollectionDataHook<T>,
  () => Promise<void>
];

export type PaginatedOptions<T> = Options &
  IDOptions<T> & {
    pageSize: number;
  };

export type PaginatedInitialValueOptions<T> = PaginatedOptions<T> &
  InitialValueOptions<T[]>;

export type PaginatedCollectionDataHook<T = DocumentData> = [
  /** The accumulated data array across all loaded pages */
  T[] | undefined,
  /** True while the first page is loading */
  boolean,
  /** The most recent error from any page load */
  FirestoreError | undefined,
  /** Load the next page of results */
  () => void,
  /** Whether more pages are available (true if the last page was full) */
  boolean,
  /** True while a "load more" request is in flight */
  boolean,
  /** The document snapshots across all loaded pages */
  QueryDocumentSnapshot<T>[]
];

export type DocumentHook<T = DocumentData> = LoadingHook<
  DocumentSnapshot<T>,
  FirestoreError
>;
export type DocumentOnceHook<T = DocumentData> = [
  ...DocumentHook<T>,
  () => Promise<void>
];
export type DocumentDataHook<T = DocumentData> = [
  ...LoadingHook<T, FirestoreError>,
  DocumentSnapshot<T> | undefined
];
export type DocumentDataOnceHook<T = DocumentData> = [
  ...DocumentDataHook<T>,
  () => Promise<void>
];
