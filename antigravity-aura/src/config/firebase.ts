import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Using environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCC28ppA2Z1RqR5-_qkyxilMZsIiyvVvKU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aura-694bb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aura-694bb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aura-694bb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "124845248166",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:124845248166:web:733f76f1c721489c3aee67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
