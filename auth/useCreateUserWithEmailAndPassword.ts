import {
  Auth,
  AuthError,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  sendEmailVerification,
  UserCredential,
} from 'firebase/auth';
import { useAction } from '../util';
import { CreateUserOptions, EmailAndPasswordActionHook } from './types';

export default (
  auth: Auth,
  options?: CreateUserOptions
): EmailAndPasswordActionHook => {
  const { action, result, loading, error } = useAction<
    [string, string],
    UserCredential,
    AuthError
  >(
    async (email: string, password: string) => {
      const user = await firebaseCreateUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (options && options.sendEmailVerification && user.user) {
        await sendEmailVerification(
          user.user,
          options.emailVerificationOptions
        );
      }
      return user;
    },
    [auth, options]
  );

  return [action, result, loading, error];
};
