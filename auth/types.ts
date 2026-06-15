import {
  ActionCodeSettings,
  AuthError,
  CustomParameters,
  UserCredential,
} from 'firebase/auth';

/**
 * Base type for auth action hooks that return a result value (e.g. UserCredential).
 * Tuple: [action, result, loading, error]
 */
export type AuthActionHook<M> = [
  M,
  UserCredential | undefined,
  boolean,
  AuthError | undefined
];

/**
 * Base type for simple boolean-returning action hooks (sign out, delete, etc.).
 * Tuple: [action, loading, error]
 */
export type SimpleActionHook<M, E = AuthError> = [M, boolean, E | undefined];

export type CreateUserOptions = {
  emailVerificationOptions?: ActionCodeSettings;
  sendEmailVerification?: boolean;
};

export type EmailAndPasswordActionHook = AuthActionHook<
  (email: string, password: string) => Promise<UserCredential | undefined>
>;

export type SignInWithEmailLinkHook = AuthActionHook<
  (email: string, emailLink?: string) => Promise<UserCredential | undefined>
>;

export type SignInWithPopupHook = AuthActionHook<
  (
    scopes?: string[],
    customOAuthParameters?: CustomParameters
  ) => Promise<UserCredential | undefined>
>;
