// src/pages/Login.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const { signInGoogle } = useAuth();
  const nav = useNavigate();

  const doSignIn = async () => {
    try {
      await signInGoogle();          // popup completes here
      nav("/", { replace: true });   // go to the app
    } catch (e) {
      console.error("Sign-in failed:", e);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ padding: 24, border: "1px solid #ddd", borderRadius: 12 }}>
        <h1>Stack & Track — Sign in</h1>
        <p style={{ color: "#666" }}>Continue with Google.</p>
        <button onClick={doSignIn}>Continue with Google</button>
      </div>
    </main>
  );
}
