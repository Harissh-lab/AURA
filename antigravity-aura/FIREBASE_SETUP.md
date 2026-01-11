# 🔥 Firebase Authentication Setup Guide

## ✅ What's Been Integrated

Firebase authentication has been added to your AURA app with:
- ✅ Email/Password sign up and login
- ✅ Google OAuth sign in
- ✅ Error handling with user-friendly messages
- ✅ Loading states and form validation
- ✅ User profile data (display name)

## 🚀 Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Enter project name: **AURA Mental Health**
4. Click through the setup wizard

### Step 2: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider
4. Enable **Google** provider
   - Add your support email
   - No additional configuration needed for development

### Step 3: Get Your Config

1. Go to **Project Settings** (⚙️ icon)
2. Scroll to "Your apps"
3. Click **Web app** (</> icon)
4. Register app with name: **AURA Web App**
5. Copy the `firebaseConfig` object

### Step 4: Update Firebase Config

Open [src/config/firebase.ts](src/config/firebase.ts) and replace the placeholder config:

```typescript
const firebaseConfig = {
  apiKey: "AIza...",  // Your actual API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 5: Add Authorized Domains (for Google Sign-In)

1. In Firebase Console > **Authentication > Settings**
2. Go to **Authorized domains** tab
3. Add: `localhost` (should already be there)
4. When deploying, add your production domain

### Step 6: Test Authentication

1. Start your app: `npm run dev`
2. Go to http://localhost:5173
3. Try creating an account
4. Try signing in with Google

## 📁 Files Created/Modified

### New Files:
- ✅ [src/config/firebase.ts](src/config/firebase.ts) - Firebase initialization
- ✅ [src/services/authService.ts](src/services/authService.ts) - Authentication functions

### Modified Files:
- ✅ [src/components/LoginPage.tsx](src/components/LoginPage.tsx)
  - Added Firebase email/password login
  - Added Google OAuth login
  - Error handling & loading states

- ✅ [src/components/SignUpPage.tsx](src/components/SignUpPage.tsx)
  - Added Firebase user registration
  - Password validation (min 6 characters)
  - Terms acceptance required
  - Emergency contact data stored

## 🔐 Authentication Features

### Login Page
- **Email/Password Login**: Full validation and error messages
- **Google Sign-In**: One-click authentication
- **Remember Me**: (UI only, implement persistence if needed)
- **Forgot Password**: (Link ready, implement reset flow)
- **Loading States**: Spinner during authentication
- **Error Display**: User-friendly error messages

### Sign Up Page
- **Full Name**: Stored as display name
- **Email/Password**: Firebase authentication
- **Mobile Number**: Ready for Firestore storage
- **Emergency Contacts**: Data collected (store in Firestore)
- **Terms Agreement**: Required checkbox
- **Password Validation**: 
  - Minimum 6 characters
  - Must match confirmation
- **Google Sign-Up**: Alternative registration method

## 🛡️ Error Handling

The app handles all common Firebase auth errors:

| Firebase Error | User-Friendly Message |
|----------------|----------------------|
| `auth/email-already-in-use` | "This email is already registered. Please sign in instead." |
| `auth/invalid-email` | "Invalid email address." |
| `auth/weak-password` | "Password should be at least 6 characters." |
| `auth/user-not-found` | "No account found with this email." |
| `auth/wrong-password` | "Incorrect password." |
| `auth/network-request-failed` | "Network error. Please check your connection." |

## 📊 Next Steps (Optional Enhancements)

### 1. Store User Data in Firestore
```typescript
import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

// After successful signup
await setDoc(doc(db, 'users', user.uid), {
  fullName: data.fullName,
  email: data.email,
  mobileNumber: data.mobileNumber,
  emergencyContacts: {
    contact1: data.emergencyContact1,
    contact2: data.emergencyContact2
  },
  createdAt: new Date()
});
```

### 2. Implement Password Reset
```typescript
import { sendPasswordResetEmail } from 'firebase/auth';

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
```

### 3. Add Email Verification
```typescript
import { sendEmailVerification } from 'firebase/auth';

// After signup
await sendEmailVerification(user);
```

### 4. Persist Auth State
```typescript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log('User:', user);
  } else {
    // User is signed out
  }
});
```

### 5. Protected Routes
Add route protection to prevent unauthorized access:
```typescript
// In App.tsx
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user && currentPage === 'home') {
      setCurrentPage('login');
    }
  });
  return unsubscribe;
}, [currentPage]);
```

## 🧪 Testing Checklist

- [ ] Create account with email/password
- [ ] Login with email/password
- [ ] Sign up with Google
- [ ] Sign in with Google
- [ ] Error message for existing email
- [ ] Error message for wrong password
- [ ] Password validation (too short)
- [ ] Password mismatch error
- [ ] Terms checkbox validation
- [ ] Loading spinners appear
- [ ] Check Firebase Console for new users

## 🔧 Troubleshooting

### "Firebase not initialized"
- Make sure you replaced the config in `firebase.ts`
- Check that apiKey and projectId are correct

### Google Sign-In popup blocked
- Allow popups in browser
- Check Authorized domains in Firebase Console

### "Auth domain is not authorized"
- Go to Firebase Console > Authentication > Settings
- Add your domain to Authorized domains

### User data not saving
- Implement Firestore storage (see Next Steps above)
- Check Firestore security rules

## 📝 Firebase Console Links

- **Authentication**: https://console.firebase.google.com/project/YOUR_PROJECT/authentication/users
- **Firestore**: https://console.firebase.google.com/project/YOUR_PROJECT/firestore
- **Project Settings**: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general

---

## ✨ Ready to Go!

Your Firebase authentication is integrated and ready. Just add your config from Firebase Console to `src/config/firebase.ts` and you're set!

**Important**: Keep your Firebase config apiKey secure. While it's safe to expose in client code, set up proper Firestore security rules to protect user data.
