'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuthStore } from '../store';
import { UserProfile } from '../types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, setError } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);
        
        if (firebaseUser) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              setProfile(userDocSnap.data() as UserProfile);
            } else {
              // Auto-initialize profile for new OAuth users
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'Anonymous Student',
                email: firebaseUser.email || '',
                avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                role: 'student',
                college: '',
                branch: '',
                semester: 1,
                subjects: [],
                reputation: 0,
                badges: ['Pioneer'],
                createdAt: serverTimestamp() as any,
                updatedAt: serverTimestamp() as any,
              };
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);
            }
          } catch (err) {
            console.error('Error fetching/creating user profile:', err);
            setError(err as Error);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading, setError]);

  return <>{children}</>;
}

