import {
  Auth,
  AuthError,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
} from 'firebase/auth';
import { useAction } from '../util';
import { EmailAndPasswordActionHook } from './types';

export default (auth: Auth): EmailAndPasswordActionHook => {
  const [signInWithEmailAndPassword, user, loading, error] = useAction<
    [string, string],
    Awaited<ReturnType<typeof firebaseSignInWithEmailAndPassword>>,
    AuthError
  >(
    (email: string, password: string) =>
      firebaseSignInWithEmailAndPassword(auth, email, password),
    [auth]
  );

  return [signInWithEmailAndPassword, user, loading, error];
};
