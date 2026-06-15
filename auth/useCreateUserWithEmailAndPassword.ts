import {
  Auth,
  AuthError,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { useAction } from '../util';
import { CreateUserOptions, EmailAndPasswordActionHook } from './types';

export default (
  auth: Auth,
  options?: CreateUserOptions
): EmailAndPasswordActionHook => {
  const [createUserWithEmailAndPassword, user, loading, error] = useAction<
    [string, string],
    Awaited<ReturnType<typeof firebaseCreateUserWithEmailAndPassword>>,
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

  return [createUserWithEmailAndPassword, user, loading, error];
};
