import {
  ActionCodeSettings,
  Auth,
  AuthError,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
} from 'firebase/auth';
import { useAction } from '../util';

export type SendPasswordResetEmailHook = [
  (email: string, actionCodeSettings?: ActionCodeSettings) => Promise<boolean>,
  boolean,
  AuthError | Error | undefined
];

export default (auth: Auth): SendPasswordResetEmailHook => {
  const [sendPasswordResetEmail, , loading, error] = useAction<
    [string, ActionCodeSettings | undefined],
    boolean,
    AuthError
  >(
    async (email: string, actionCodeSettings?: ActionCodeSettings) => {
      await fbSendPasswordResetEmail(auth, email, actionCodeSettings);
      return true;
    },
    [auth]
  );

  return [
    sendPasswordResetEmail as (
      email: string,
      actionCodeSettings?: ActionCodeSettings
    ) => Promise<boolean>,
    loading,
    error,
  ];
};
