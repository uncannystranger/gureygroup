import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";

/**
 * Firebase Web configuration.
 *
 * Every value comes from the environment. The previous version fell back to a
 * specific project's identifiers baked into the source, which meant any fork,
 * preview deployment or misconfigured environment silently authenticated
 * against that project instead of failing. See .env.example for the full list.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const missingConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
  .filter((key) => !firebaseConfig[key]);

if (missingConfigKeys.length > 0) {
  console.error(
    `[Gurey Group] Firebase is not configured. Missing environment ${
      missingConfigKeys.length === 1 ? 'variable' : 'variables'
    }: ${missingConfigKeys.map((key) => `VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`).join(', ')}. ` +
    'Copy .env.example to .env and fill in the values from Firebase Console → Project settings.'
  );
}

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase is used for identity only. Profile data and image bytes live in
// the application's own database, reached through the API.
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[Gurey Group] Firebase persistence warning:", err);
});

// Analytics is optional and never on the critical path, so it is pulled in
// on demand instead of being bundled into the initial JavaScript payload.
export let analytics = null;
if (typeof window !== 'undefined' && app) {
  import("firebase/analytics")
    .then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) analytics = getAnalytics(app);
    })
    .catch(() => {});
}

// Safe wrapper for onAuthStateChanged
export const onAuthStateChanged = (authObj, nextOrObserver, error, completed) => {
  const targetAuth = authObj || auth;
  if (targetAuth && typeof firebaseOnAuthStateChanged === 'function') {
    try {
      return firebaseOnAuthStateChanged(targetAuth, nextOrObserver, error, completed);
    } catch (e) {
      console.warn('[Gurey Group] onAuthStateChanged failed:', e);
    }
  }
  if (typeof nextOrObserver === 'function') {
    setTimeout(() => nextOrObserver(null), 0);
  }
  return () => {};
};

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail
};

export default app;


