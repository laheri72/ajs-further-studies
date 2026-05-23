import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth, createGoogleProvider, hasFirebaseConfig } from '../services/firebase';
import { getProfile, isWhitelistedAdmin } from '../services/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(hasFirebaseConfig);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasFirebaseConfig) return undefined;

    return onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setError('');
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const [nextProfile, adminStatus] = await Promise.all([
          getProfile(nextUser.uid),
          isWhitelistedAdmin(nextUser.email),
        ]);
        setProfile(nextProfile);
        setIsAdmin(adminStatus);
      } catch (err) {
        setError(err.message || 'Unable to load account details.');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signInWithGoogle = useCallback(async function signInWithGoogle(options = {}) {
    if (!hasFirebaseConfig) {
      setError('Firebase is not configured. Add your VITE_FIREBASE values to .env.');
      return;
    }

    try {
      setError('');
      await signInWithPopup(auth, createGoogleProvider(options));
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed.');
      }
    }
  }, []);

  const signOutUser = useCallback(async function signOutUser() {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const refreshProfile = useCallback(async function refreshProfile() {
    if (!user) return;
    const nextProfile = await getProfile(user.uid);
    setProfile(nextProfile);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      isAdmin,
      loading,
      error,
      hasFirebaseConfig,
      signInWithGoogle,
      signOutUser,
      refreshProfile,
      setError,
    }),
    [user, profile, isAdmin, loading, error, signInWithGoogle, signOutUser, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
