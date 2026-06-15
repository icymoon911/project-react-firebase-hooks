import {
  Auth,
  AuthError,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { useAction } from '../util';
import { EmailAndPasswordActionHook } from './types';

export default (auth: Auth): EmailAndPasswordActionHook => {
  const { action, result, loading, error } = useAction<
    [string, string],
    UserCredential,
    AuthError
  >(
    async (email: string, password: string) => {
      return await firebaseSignInWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  return [action, result, loading, error];
};
