import * as React from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";


import logoUrl from "../assets/Logo.png";

export default function Login() {
  const { signInGoogle, loading, user } = useAuth();
  const nav = useNavigate();

  React.useEffect(() => {
    if (!loading && user) nav("/", { replace: true });
  }, [loading, user, nav]);

  return (
    <main className="screen center">
      <div className="card login-card">
      <img
        src={logoUrl}
        alt="Stack & Track logo"
        className="login-logo"
      />
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