// src/pages/Login.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { getRedirectResult } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const { signInGoogle } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  // When we land here after Google, complete the redirect
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getRedirectResult(auth);
        if (res?.user && alive) nav("/", { replace: true });
      } catch (e: any) {
        if (alive) setErr(e?.message || "Sign-in failed");
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, [nav]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ padding: 24, border: "1px solid #ddd", borderRadius: 12, minWidth: 320 }}>
        <h1>Stack & Track — Sign in</h1>
        <p style={{ color: "#666", marginTop: 8, marginBottom: 16 }}>
          {busy ? "Checking your session…" : "Continue with your Google account."}
        </p>
        {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
        <button onClick={signInGoogle} disabled={busy} style={{ padding: "8px 12px" }}>
          Continue with Google
        </button>
      </div>
    </main>
  );
}
