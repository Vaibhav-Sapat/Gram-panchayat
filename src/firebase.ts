import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
};

export const isFirebaseConfigured = Boolean(
  firebaseEnv.apiKey &&
  firebaseEnv.authDomain &&
  firebaseEnv.projectId &&
  firebaseEnv.storageBucket &&
  firebaseEnv.messagingSenderId &&
  firebaseEnv.appId,
);

export const ADMIN_EMAIL = 'vaibhavsapat9923@gmail.com';
const app = isFirebaseConfigured
  ? initializeApp(firebaseEnv)
  : null;

export const auth = (app ? getAuth(app) : null) as ReturnType<typeof getAuth>;
export const db = (app ? getFirestore(app) : null) as ReturnType<typeof getFirestore>;