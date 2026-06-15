import { useCallback, useReducer } from 'react';

export type LoadingActionValue<T, E> = {
  action: (...args: any[]) => Promise<T>;
  error?: E;
  loading: boolean;
  reset: () => void;
  setError: (error: E) => void;
  setValue: (value?: T) => void;
  result?: T;
};

type ActionReducerState<T, E> = {
  error?: E;
  loading: boolean;
  result?: T;
};

type StartAction = { type: 'start' };
type ResetAction = { type: 'reset' };
type ValueAction<T> = { type: 'value'; value: T };
type ErrorAction<E> = { type: 'error'; error: E };
type ActionReducerAction<T, E> =
  | StartAction
  | ResetAction
  | ValueAction<T>
  | ErrorAction<E>;

const actionReducer = <T, E>() => (
  state: ActionReducerState<T, E>,
  action: ActionReducerAction<T, E>
): ActionReducerState<T, E> => {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        error: undefined,
        loading: true,
      };
    case 'reset':
      return { loading: false };
    case 'value':
      return {
        loading: false,
        result: action.value,
        error: undefined,
      };
    case 'error':
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    default:
      return state;
  }
};

/**
 * Generic action hook that manages loading/error/result state for async operations.
 * Uses useReducer internally for consistent state management with data subscription hooks.
 */
export default <A extends any[], R, E>(
  action: (...args: A) => Promise<R>,
  deps: any[]
): LoadingActionValue<R, E> => {
  const [state, dispatch] = useReducer(
    actionReducer<R, E>(),
    { loading: false } as ActionReducerState<R, E>
  );

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  const setError = useCallback((error: E) => {
    dispatch({ type: 'error', error });
  }, []);

  const setValue = useCallback((value?: R) => {
    if (value !== undefined) {
      dispatch({ type: 'value', value });
    }
  }, []);

  const wrappedAction = useCallback(
    async (...args: A): Promise<R> => {
      dispatch({ type: 'start' });
      try {
        const result = await action(...args);
        dispatch({ type: 'value', value: result });
        return result;
      } catch (err) {
        dispatch({ type: 'error', error: err as E });
        return undefined as unknown as R;
      }
    },
    deps
  );

  return {
    action: wrappedAction as (...args: any[]) => Promise<R>,
    error: state.error,
    loading: state.loading,
    reset,
    setError,
    setValue,
    result: state.result,
  };
};
