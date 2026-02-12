'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  UserCredential
} from 'firebase/auth';

/** Initiate anonymous sign-in. Returns a promise for error handling. */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up with optional display name. Returns a promise. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, displayName?: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password)
    .then(async (userCredential) => {
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      return userCredential;
    });
}

/** Initiate email/password sign-in. Returns a promise. */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in. Returns a promise. */
export function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance, provider);
}

/** Initiate sign-out. Returns a promise. */
export function initiateSignOut(authInstance: Auth): Promise<void> {
  return signOut(authInstance);
}

/** Initiate password reset email. Returns a promise. */
export function initiatePasswordReset(authInstance: Auth, email: string): Promise<void> {
  return sendPasswordResetEmail(authInstance, email);
}
