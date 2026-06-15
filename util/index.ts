export { default as useLoadingValue } from './useLoadingValue';
export { default as useAction } from './useAction';
export * from './refHooks';

export type LoadingHook<T, E> = [T | undefined, boolean, E | undefined];
export type ActionHook<M, E> = [M, boolean, E | undefined];
