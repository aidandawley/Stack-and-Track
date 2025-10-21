// src/auth/AuthProvider.tsx
import * as React from "react";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  getIdToken as _getIdToken,
  type User,
} from "firebase/auth";
import { app } from "../lib/firebase";

const auth = getAuth(app);

type Ctx = {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signInGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthCtx = React.createContext<Ctx>(null as any);
export const useAuth = () => React.useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        // consume redirect result if a popup was blocked
        try { await getRedirectResult(auth); } catch {}
      } finally {
        const unsub = onAuthStateChanged(auth, (u) => {
          setUser(u ?? null);
          setLoading(false);
        });
        return () => unsub();
      }
    })();
  }, []);

  const signInGoogle = React.useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      const code = e?.code ?? "";
      // Safari / popup-blocked / iframe contexts -> fall back to redirect
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw e;
    }
  }, []);

  const signOutUser = React.useCallback(async () => { await signOut(auth); }, []);
  const getIdToken = React.useCallback(async () => auth.currentUser ? _getIdToken(auth.currentUser, true) : null, []);

  return (
    <AuthCtx.Provider value={{ user, loading, getIdToken, signInGoogle, signOutUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
