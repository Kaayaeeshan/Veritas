import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { watchAuthState, fetchUserProfile, logOut as firebaseLogOut } from "../firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ firebaseUser: null, profile: null, loading: true });

  useEffect(() => {
    const unsubscribe = watchAuthState(async (user) => {
      if (user) {
        const userProfile = await fetchUserProfile(user.uid);
        setState({ firebaseUser: user, profile: userProfile, loading: false });
      } else {
        setState({ firebaseUser: null, profile: null, loading: false });
      }
    });
    return unsubscribe;
  }, []);

  const { firebaseUser, profile, loading } = state;

  const logout = useCallback(async () => {
    await firebaseLogOut();
    setState({ firebaseUser: null, profile: null, loading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    setState((s) => {
      if (!s.firebaseUser) return s;
      fetchUserProfile(s.firebaseUser.uid).then((userProfile) => {
        setState((prev) => ({ ...prev, profile: userProfile }));
      });
      return s;
    });
  }, []);

 
  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      role: profile?.role || null,
      loading,
      logout,
      refreshProfile,
    }),
    [firebaseUser, profile, loading, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}