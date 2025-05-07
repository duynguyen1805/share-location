import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider } from '@/services/firebase';
import { User } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      // Thêm resolver để xử lý popup tốt hơn trên mobile
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    } catch (error: unknown) {
      console.error('Error signing in with Google:', error);
      if (error instanceof FirebaseError) {
        // Xử lý các lỗi cụ thể
        if (error.code === 'auth/popup-blocked') {
          setError('Please allow popups for this website to sign in with Google');
        } else if (error.code === 'auth/popup-closed-by-user') {
          setError('Sign in was cancelled. Please try again.');
        } else if (error.code === 'auth/cancelled-popup-request') {
          setError('Multiple popup requests detected. Please try again.');
        } else {
          setError('An error occurred during sign in. Please try again.');
        }
      } else {
        setError('An unexpected error occurred during sign in.');
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Cập nhật displayName cho user
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    } catch (error: unknown) {
      console.error('Error signing up:', error);
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
          setError('Email already in use. Please use a different email.');
        } else if (error.code === 'auth/weak-password') {
          setError('Password is too weak. Please use a stronger password.');
        } else if (error.code === 'auth/invalid-email') {
          setError('Invalid email address.');
        } else {
          setError('An error occurred during sign up. Please try again.');
        }
      } else {
        setError('An unexpected error occurred during sign up.');
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      console.error('Error signing in:', error);
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          setError('Invalid email or password.');
        } else if (error.code === 'auth/invalid-email') {
          setError('Invalid email address.');
        } else {
          setError('An error occurred during sign in. Please try again.');
        }
      } else {
        setError('An unexpected error occurred during sign in.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      setError('An error occurred during sign out. Please try again.');
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}; 