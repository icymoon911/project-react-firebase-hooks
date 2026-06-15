import {
  ActionCodeSettings,
  Auth,
  AuthError,
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile,
  verifyBeforeUpdateEmail as fbVerifyBeforeUpdateEmail,
} from 'firebase/auth';
import { useAction } from '../util';

type Profile = {
  displayName?: string | null;
  photoURL?: string | null;
};

export type UpdateUserHook<M> = [M, boolean, AuthError | Error | undefined];

export type UpdateEmailHook = UpdateUserHook<
  (email: string) => Promise<boolean>
>;
export type UpdatePasswordHook = UpdateUserHook<
  (password: string) => Promise<boolean>
>;
export type UpdateProfileHook = UpdateUserHook<
  (profile: Profile) => Promise<boolean>
>;
export type VerifyBeforeUpdateEmailHook = UpdateUserHook<
  (
    email: string,
    actionCodeSettings: ActionCodeSettings | null
  ) => Promise<boolean>
>;

export const useUpdateEmail = (auth: Auth): UpdateEmailHook => {
  const { action, loading, error } = useAction<[string], boolean, AuthError>(
    async (email: string) => {
      if (auth.currentUser) {
        await fbUpdateEmail(auth.currentUser, email);
        return true;
      } else {
        throw new Error('No user is logged in');
      }
    },
    [auth]
  );

  return [action, loading, error];
};

export const useUpdatePassword = (auth: Auth): UpdatePasswordHook => {
  const { action, loading, error } = useAction<[string], boolean, AuthError>(
    async (password: string) => {
      if (auth.currentUser) {
        await fbUpdatePassword(auth.currentUser, password);
        return true;
      } else {
        throw new Error('No user is logged in');
      }
    },
    [auth]
  );

  return [action, loading, error];
};

export const useUpdateProfile = (auth: Auth): UpdateProfileHook => {
  const { action, loading, error } = useAction<[Profile], boolean, AuthError>(
    async (profile: Profile) => {
      if (auth.currentUser) {
        await fbUpdateProfile(auth.currentUser, profile);
        return true;
      } else {
        throw new Error('No user is logged in');
      }
    },
    [auth]
  );

  return [action, loading, error];
};

export const useVerifyBeforeUpdateEmail = (
  auth: Auth
): VerifyBeforeUpdateEmailHook => {
  const { action, loading, error } = useAction<
    [string, ActionCodeSettings | null],
    boolean,
    AuthError
  >(
    async (email: string, actionCodeSettings: ActionCodeSettings | null) => {
      if (auth.currentUser) {
        await fbVerifyBeforeUpdateEmail(
          auth.currentUser,
          email,
          actionCodeSettings
        );
        return true;
      } else {
        throw new Error('No user is logged in');
      }
    },
    [auth]
  );

  return [action, loading, error];
};
