import { Auth, AuthError } from 'firebase/auth';
import { useAction } from '../util';

export type DeleteUserHook = [
  () => Promise<boolean>,
  boolean,
  AuthError | Error | undefined
];

export default (auth: Auth): DeleteUserHook => {
  const { action, loading, error } = useAction<[], boolean, AuthError>(
    async () => {
      if (auth.currentUser) {
        await auth.currentUser.delete();
        return true;
      } else {
        throw new Error('No user is logged in');
      }
    },
    [auth]
  );

  return [action, loading, error];
};
