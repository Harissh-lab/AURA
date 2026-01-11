import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCC28ppA2Z1RqR5-_qkyxilMZsIiyvVvKU",
  authDomain: "aura-694bb.firebaseapp.com",
  projectId: "aura-694bb",
  storageBucket: "aura-694bb.firebasestorage.app",
  messagingSenderId: "124845248166",
  appId: "1:124845248166:web:733f76f1c721489c3aee67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
