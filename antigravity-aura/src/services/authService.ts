import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { saveUserEmergencyData } from './emergencyAlertService';

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
  mobileNumber: string;
  emergencyContact1?: {
    name: string;
    phone: string;
    relationship: string;
  };
  emergencyContact2?: {
    name: string;
    phone: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

// Sign up with email and password
export async function signUpWithEmail(data: SignUpData): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    
    // Update user profile with display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: data.fullName
      });
      
      // Save emergency contact data to Firestore
      await saveUserEmergencyData(userCredential.user.uid, {
        fullName: data.fullName,
        mobileNumber: data.mobileNumber,
        emergencyContact1: data.emergencyContact1,
        emergencyContact2: data.emergencyContact2
      });
    }
    
    console.log('User signed up:', userCredential.user);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

// Sign in with email and password
export async function signInWithEmail(data: LoginData): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    console.log('User signed in:', userCredential.user);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    console.log('User signed in with Google:', userCredential.user);
    return userCredential.user;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

// Sign out
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out');
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Helper function to convert Firebase error codes to user-friendly messages
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred. Please try again.';
  }
}
