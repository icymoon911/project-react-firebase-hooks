import { Auth, AuthError } from 'firebase/auth';
import { useAction } from '../util';

export type SignOutHook = [
  () => Promise<boolean>,
  boolean,
  AuthError | Error | undefined
];

export default (auth: Auth): SignOutHook => {
  const { action, loading, error } = useAction<[], boolean, AuthError>(
    async () => {
      await auth.signOut();
      return true;
    },
    [auth]
  );

  return [action, loading, error];
};
