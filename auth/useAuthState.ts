import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useRef } from 'react';
import { LoadingHook, useLoadingValue } from '../util';

export type AuthStateHook = LoadingHook<User | null, Error>;

type AuthStateOptions = {
  onUserChanged?: (user: User | null) => Promise<void>;
};

export default (auth: Auth, options?: AuthStateOptions): AuthStateHook => {
  const { error, loading, setError, setValue, value } = useLoadingValue<
    User | null,
    Error
  >(() => auth.currentUser);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const listener = onAuthStateChanged(
      auth,
      async (user) => {
        if (optionsRef.current?.onUserChanged) {
          // onUserChanged function to process custom claims on any other trigger function
          try {
            await optionsRef.current.onUserChanged(user);
          } catch (e) {
            setError(e as Error);
          }
        }
        setValue(user);
      },
      setError
    );

    return () => {
      listener();
    };
  }, [auth]);

  return [value, loading, error];
};
