import {
  Auth,
  AuthError,
  AuthProvider,
  CustomParameters,
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  TwitterAuthProvider,
  UserCredential,
} from 'firebase/auth';
import { useCallback } from 'react';
import { useAction } from '../util';
import { SignInWithPopupHook } from './types';

export const useSignInWithApple = (auth: Auth): SignInWithPopupHook => {
  return useSignInWithOAuth(auth, 'apple.com');
};

export const useSignInWithFacebook = (auth: Auth): SignInWithPopupHook => {
  const createFacebookAuthProvider = useCallback(
    (scopes?: string[], customOAuthParameters?: CustomParameters) => {
      const provider = new FacebookAuthProvider();
      if (scopes) {
        scopes.forEach((scope) => provider.addScope(scope));
      }
      if (customOAuthParameters) {
        provider.setCustomParameters(customOAuthParameters);
      }
      return provider;
    },
    []
  );
  return useSignInWithPopup(auth, createFacebookAuthProvider);
};

export const useSignInWithGithub = (auth: Auth): SignInWithPopupHook => {
  const createGithubAuthProvider = useCallback(
    (scopes?: string[], customOAuthParameters?: CustomParameters) => {
      const provider = new GithubAuthProvider();
      if (scopes) {
        scopes.forEach((scope) => provider.addScope(scope));
      }
      if (customOAuthParameters) {
        provider.setCustomParameters(customOAuthParameters);
      }
      return provider;
    },
    []
  );
  return useSignInWithPopup(auth, createGithubAuthProvider);
};

export const useSignInWithGoogle = (auth: Auth): SignInWithPopupHook => {
  const createGoogleAuthProvider = useCallback(
    (scopes?: string[], customOAuthParameters?: CustomParameters) => {
      const provider = new GoogleAuthProvider();
      if (scopes) {
        scopes.forEach((scope) => provider.addScope(scope));
      }
      if (customOAuthParameters) {
        provider.setCustomParameters(customOAuthParameters);
      }
      return provider;
    },
    []
  );
  return useSignInWithPopup(auth, createGoogleAuthProvider);
};

export const useSignInWithMicrosoft = (auth: Auth): SignInWithPopupHook => {
  return useSignInWithOAuth(auth, 'microsoft.com');
};

export const useSignInWithTwitter = (auth: Auth): SignInWithPopupHook => {
  const createTwitterAuthProvider = useCallback(
    (scopes?: string[], customOAuthParameters?: CustomParameters) => {
      const provider = new TwitterAuthProvider();
      if (scopes) {
        scopes.forEach((scope) => provider.addScope(scope));
      }
      if (customOAuthParameters) {
        provider.setCustomParameters(customOAuthParameters);
      }
      return provider;
    },
    []
  );
  return useSignInWithPopup(auth, createTwitterAuthProvider);
};

export const useSignInWithYahoo = (auth: Auth): SignInWithPopupHook => {
  return useSignInWithOAuth(auth, 'yahoo.com');
};

const useSignInWithOAuth = (
  auth: Auth,
  providerId: string
): SignInWithPopupHook => {
  const createOAuthProvider = useCallback(
    (scopes?: string[], customOAuthParameters?: CustomParameters) => {
      const provider = new OAuthProvider(providerId);
      if (scopes) {
        scopes.forEach((scope) => provider.addScope(scope));
      }
      if (customOAuthParameters) {
        provider.setCustomParameters(customOAuthParameters);
      }
      return provider;
    },
    [providerId]
  );
  return useSignInWithPopup(auth, createOAuthProvider);
};

const useSignInWithPopup = (
  auth: Auth,
  createProvider: (
    scopes?: string[],
    customOAuthParameters?: CustomParameters
  ) => AuthProvider
): SignInWithPopupHook => {
  const [doSignInWithPopup, user, loading, error] = useAction<
    [string[] | undefined, CustomParameters | undefined],
    UserCredential,
    AuthError
  >(
    async (scopes?: string[], customOAuthParameters?: CustomParameters) => {
      const provider = createProvider(scopes, customOAuthParameters);
      return signInWithPopup(auth, provider);
    },
    [auth, createProvider]
  );

  return [doSignInWithPopup, user, loading, error];
};
