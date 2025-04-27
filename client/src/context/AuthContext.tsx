/**
 * Authentication Context
 * This context provides authentication state and methods throughout the application.
 * It handles user authentication, session management, and user profile data.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            ...user,
            displayName: userData.displayName || user.displayName,
            photoURL: userData.photoURL || user.photoURL,
          });
        } else {
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with username
      await updateProfile(result.user, {
        displayName: username
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        displayName: username,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      setUser(result.user);
      toast({
        title: "Account created!",
        description: "You have successfully signed up",
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to logout');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password reset email sent",
        description: "Please check your email for password reset instructions",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update Firebase Auth profile
      await updateProfile(user, data);

      // Update Firestore user document
      await setDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Update local user state
      setUser({
        ...user,
        ...data,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
