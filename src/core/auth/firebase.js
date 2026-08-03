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
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getDatabase, ref as dbRef, get, set, update } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

// Gurey Group Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA1rLoGN2Kdh4B16lwydcE4iXZZEO9lnP4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "saas1-e4054.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "saas1-e4054",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "saas1-e4054.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "837424861666",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:837424861666:web:3ad96b6f2b2f81b66169bb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-8YT1KN9F4N",
  // Firebase Realtime Database URL
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://saas1-e4054-default-rtdb.firebaseio.com"
};

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const storage = getStorage(app);
// Firebase Realtime Database (source of truth for user profiles & preferences)
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Ensure persistent local storage auth session
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Firebase persistence error:", err);
});

export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  onAuthStateChanged,
  // Realtime Database helpers
  dbRef,
  get,
  set,
  update,
  // Storage helpers
  storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

export default app;
