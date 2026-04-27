import type { AxiosError } from 'axios';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';

import { ensureFirebaseAuth, firebaseAuth, googleAuthProvider, isFirebaseClientConfigured, waitForFirebaseAuthReady } from '../lib/firebase';
import type { AppBootstrap } from '../types';
import { authApi, bootstrapApi } from './api';

type SignUpPayload = {
  email: string;
  password: string;
  name: string;
  companyName: string;
};

const firebaseErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Cette adresse email est deja utilisee.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/invalid-email': 'Entre une adresse email valide.',
  'auth/missing-password': 'Entre ton mot de passe.',
  'auth/network-request-failed': 'La connexion reseau a echoue. Reessaie.',
  'auth/too-many-requests': 'Trop de tentatives. Reessaie plus tard.',
  'auth/user-not-found': 'Aucun compte ne correspond a cette adresse email.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caracteres.',
  'auth/wrong-password': 'Email ou mot de passe incorrect.',
};

const apiErrorMessages: Record<string, string> = {
  'Firebase authentication is not configured yet': 'Firebase Auth n est pas configure cote serveur.',
  'Firebase Auth is not configured on this client.': 'Firebase Auth n est pas configure dans le frontend.',
  'Invalid Firebase session token': 'La session Firebase est invalide ou expiree. Reconnecte-toi.',
  'This email address is already linked to another account': 'Cette adresse email est deja rattachee a un autre compte.',
};

const exchangeCurrentFirebaseSession = async (profile?: { name?: string; companyName?: string }) => {
  const auth = ensureFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('Aucun utilisateur Firebase n est connecte actuellement.');
  }

  const idToken = await currentUser.getIdToken(true);

  await authApi.createFirebaseSession({ idToken, profile });

  return bootstrapApi.loadAuthenticatedApp();
};

export const firebaseAuthService = {
  signIn: async (email: string, password: string): Promise<AppBootstrap> => {
    const auth = ensureFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
    return exchangeCurrentFirebaseSession();
  },
  signInWithGoogle: async (): Promise<AppBootstrap> => {
    const auth = ensureFirebaseAuth();
    await signInWithPopup(auth, googleAuthProvider);
    return exchangeCurrentFirebaseSession();
  },
  signUp: async ({ companyName, email, name, password }: SignUpPayload): Promise<AppBootstrap> => {
    const auth = ensureFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(credential.user, { displayName: name });

    return exchangeCurrentFirebaseSession({
      name,
      companyName,
    });
  },
  restoreSession: async (): Promise<AppBootstrap | null> => {
    if (!isFirebaseClientConfigured) {
      return null;
    }

    const auth = await waitForFirebaseAuthReady();

    if (!auth?.currentUser) {
      return null;
    }

    return exchangeCurrentFirebaseSession();
  },
  logout: async () => {
    await Promise.allSettled([
      authApi.logout(),
      firebaseAuth ? signOut(firebaseAuth) : Promise.resolve(),
    ]);
  },
  getErrorMessage: (error: unknown) => {
    if (error instanceof FirebaseError) {
      return firebaseErrorMessages[error.code] ?? 'Impossible de terminer l authentification Firebase.';
    }

    const apiMessage = (error as AxiosError<{ message?: string }>)?.response?.data?.message;

    if (apiMessage) {
      return apiErrorMessages[apiMessage] ?? apiMessage;
    }

    if (error instanceof Error && error.message) {
      return apiErrorMessages[error.message] ?? error.message;
    }

    return 'Une erreur inattendue est survenue pendant l authentification.';
  },
};