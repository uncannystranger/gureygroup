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
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getDatabase, ref as dbRef, get, set, update } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

// Gurey Group Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
};

let app = null;
let authInstance = null;
let storageInstance = null;
let rtdbInstance = null;
let googleProviderInstance = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } else {
    console.warn("[Gurey Group] Firebase configuration missing VITE_FIREBASE_* environment variables.");
  }
} catch (err) {
  console.error("[Gurey Group] Firebase initialization error:", err);
}

// Fallback / Mock implementations to prevent top-level module load crashes in production
const mockAuth = {
  currentUser: null,
};

if (app) {
  try {
    authInstance = getAuth(app);
    setPersistence(authInstance, browserLocalPersistence).catch((err) => {
      console.warn("[Gurey Group] Firebase persistence error:", err);
    });
  } catch (err) {
    console.warn("[Gurey Group] Firebase Auth setup error:", err);
  }

  try {
    storageInstance = getStorage(app);
  } catch (err) {
    console.warn("[Gurey Group] Firebase Storage setup error:", err);
  }

  try {
    if (firebaseConfig.databaseURL) {
      rtdbInstance = getDatabase(app);
    }
  } catch (err) {
    console.warn("[Gurey Group] Firebase Database setup error:", err);
  }

  try {
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn("[Gurey Group] Google Auth Provider setup error:", err);
  }
}

export const auth = authInstance || mockAuth;
export const storage = storageInstance || null;
export const rtdb = rtdbInstance || null;
export const googleProvider = googleProviderInstance || new GoogleAuthProvider();

export let analytics = null;
if (typeof window !== 'undefined' && app) {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Safe wrapper for onAuthStateChanged to handle uninitialized Firebase auth gracefully
export const onAuthStateChanged = (authObj, nextOrObserver, error, completed) => {
  if (authObj && authInstance && typeof firebaseOnAuthStateChanged === 'function') {
    try {
      return firebaseOnAuthStateChanged(authObj, nextOrObserver, error, completed);
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
  updateEmail,
  dbRef,
  get,
  set,
  update,
  storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

export default app;

