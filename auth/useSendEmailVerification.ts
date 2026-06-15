import {
  Auth,
  AuthError,
  sendEmailVerification as fbSendEmailVerification,
} from 'firebase/auth';
import { useAction } from '../util';

export type SendEmailVerificationHook = [
  () => Promise<boolean>,
  boolean,
  AuthError | Error | undefined
];

export default (auth: Auth): SendEmailVerificationHook => {
  const [sendEmailVerification, , loading, error] = useAction<
    [],
    boolean,
    AuthError
  >(
    async () => {
      if (auth.currentUser) {
        await fbSendEmailVerification(auth.currentUser);
        return true;
      } else {
        throw new Error('No user is logged in');
      }
    },
    [auth]
  );

  return [sendEmailVerification as () => Promise<boolean>, loading, error];
};
