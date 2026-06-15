import {
  ActionCodeSettings,
  Auth,
  AuthError,
  sendSignInLinkToEmail as fbSendSignInLinkToEmail,
} from 'firebase/auth';
import { useAction } from '../util';

export type SendSignInLinkToEmailHook = [
  (email: string, actionCodeSettings: ActionCodeSettings) => Promise<boolean>,
  boolean,
  AuthError | Error | undefined
];

export default (auth: Auth): SendSignInLinkToEmailHook => {
  const [sendSignInLinkToEmail, , loading, error] = useAction<
    [string, ActionCodeSettings],
    boolean,
    AuthError
  >(
    async (email: string, actionCodeSettings: ActionCodeSettings) => {
      await fbSendSignInLinkToEmail(auth, email, actionCodeSettings);
      return true;
    },
    [auth]
  );

  return [
    sendSignInLinkToEmail as (
      email: string,
      actionCodeSettings: ActionCodeSettings
    ) => Promise<boolean>,
    loading,
    error,
  ];
};
