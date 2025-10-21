// src/pages/Login.tsx
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import * as React from "react";

export default function Login() {
  const { signInGoogle, loading, user } = useAuth();
  const nav = useNavigate();

  React.useEffect(() => {
    if (!loading && user) nav("/", { replace: true });
  }, [loading, user, nav]);

  return (
    <main className="screen center">
      <div className="card login-card">
        <div className="logo-box">LOGO</div>
        <h1 className="title">Welcome to Stack &amp; Track</h1>
        <button
          type="button"
          className="btn primary"
          onClick={() => { void signInGoogle(); }}
          disabled={loading}
        >
          {loading ? "Checking session..." : "Sign in with Google"}
        </button>
      </div>
    </main>
  );
}
