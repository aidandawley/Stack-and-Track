import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, googleProvider } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";


type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }), []);

  const signInGoogle = async () => { await signInWithPopup(auth, googleProvider); };
  const signOutUser = async () => { await signOut(auth); };
  const getIdToken = async () => (user ? await user.getIdToken() : null);

  return (
    <Ctx.Provider value={{ user, loading, signInGoogle, signOutUser, getIdToken }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
