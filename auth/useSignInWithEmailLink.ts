import {
  Auth,
  AuthError,
  signInWithEmailLink as firebaseSignInWithEmailLink,
  UserCredential,
} from 'firebase/auth';
import { useAction } from '../util';
import { SignInWithEmailLinkHook } from './types';

export default (auth: Auth): SignInWithEmailLinkHook => {
  const { action, result, loading, error } = useAction<
    [string, string?],
    UserCredential,
    AuthError
  >(
    async (email: string, emailLink?: string) => {
      return await firebaseSignInWithEmailLink(auth, email, emailLink);
    },
    [auth]
  );

  return [action, result, loading, error];
};
