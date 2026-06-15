import {
  Auth,
  AuthError,
  signInWithEmailLink as firebaseSignInWithEmailLink,
} from 'firebase/auth';
import { useAction } from '../util';
import { SignInWithEmailLinkHook } from './types';

export default (auth: Auth): SignInWithEmailLinkHook => {
  const [signInWithEmailLink, user, loading, error] = useAction<
    [string, string | undefined],
    Awaited<ReturnType<typeof firebaseSignInWithEmailLink>>,
    AuthError
  >(
    (email: string, emailLink?: string) =>
      firebaseSignInWithEmailLink(auth, email, emailLink),
    [auth]
  );

  return [signInWithEmailLink, user, loading, error];
};
