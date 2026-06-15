import { useCallback, useMemo, useReducer } from 'react';

export type ActionState<T, E> = {
  error?: E;
  loading: boolean;
  result?: T;
};

type ActionReducerAction<T, E> =
  | { type: 'start' }
  | { type: 'success'; result: T }
  | { type: 'error'; error: E };

const actionReducer = <T, E>() =>
(
  state: ActionState<T, E>,
  action: ActionReducerAction<T, E>
): ActionState<T, E> => {
  switch (action.type) {
    case 'start':
      return { ...state, loading: true, error: undefined };
    case 'success':
      return { loading: false, result: action.result, error: undefined };
    case 'error':
      return { loading: false, result: undefined, error: action.error };
    default:
      return state;
  }
};

/**
 * Generic action hook that manages loading, error, and result state
 * for async operations using a reducer for consistent state transitions.
 *
 * @param actionFn The async function to wrap with state management
 * @param deps Dependency array for the action callback (same as useCallback deps)
 * @returns A tuple of [action, result, loading, error]
 */
export default function useAction<A extends any[], R, E = Error>(
  actionFn: (...args: A) => Promise<R>,
  deps: React.DependencyList
): [(...args: A) => Promise<R | undefined>, R | undefined, boolean, E | undefined] {
  const [state, dispatch] = useReducer(
    actionReducer<R, E>(),
    { loading: false } as ActionState<R, E>
  );

  const action = useCallback(
    async (...args: A): Promise<R | undefined> => {
      dispatch({ type: 'start' });
      try {
        const result = await actionFn(...args);
        dispatch({ type: 'success', result });
        return result;
      } catch (err) {
        dispatch({ type: 'error', error: err as E });
        return undefined;
      }
    },
    deps // eslint-disable-line react-hooks/exhaustive-deps
  );

  return useMemo(
    () => [action, state.result, state.loading, state.error] as [
      (...args: A) => Promise<R | undefined>,
      R | undefined,
      boolean,
      E | undefined
    ],
    [action, state.result, state.loading, state.error]
  );
}
