import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type Auth } from 'firebase/auth';

const firebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

export const isFirebaseClientConfigured = [
  firebaseClientConfig.apiKey,
  firebaseClientConfig.authDomain,
  firebaseClientConfig.projectId,
  firebaseClientConfig.appId,
].every(Boolean);

const firebaseApp = isFirebaseClientConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseClientConfig)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

export const ensureFirebaseAuth = (): Auth => {
  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not configured on this client.');
  }

  return firebaseAuth;
};

export const waitForFirebaseAuthReady = async () => {
  if (!firebaseAuth) {
    return null;
  }

  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      () => {
        unsubscribe();
        resolve();
      },
      () => {
        unsubscribe();
        resolve();
      },
    );
  });

  return firebaseAuth;
};