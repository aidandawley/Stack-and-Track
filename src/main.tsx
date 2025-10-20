import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";
import "./index.css";

import { auth, googleProvider } from "./lib/firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";

function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Home ✅</h2>
      <p><Link to="/login">Go to Login</Link></p>
      <button onClick={() => signOut(auth)}>Sign out</button>
    </div>
  );
}

function Login() {
  React.useEffect(() => {
    // Resolve the redirect result (if we just came back from Google)
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          console.log("redirect OK, user:", res.user.uid);
          window.location.href = "/"; // go home on success
        }
      })
      .catch((err) => {
        console.error("getRedirectResult error:", err);
        alert(`${err.code ?? "unknown"} — ${err.message ?? err}`);
      });
  }, []);

  const signIn = async () => {
    try {
      // Use redirect (works even when popups/cookies are blocked)
      await signInWithRedirect(auth, googleProvider);
    } catch (e: any) {
      console.error("signInWithRedirect error:", e);
      alert(`${e.code ?? "unknown"} — ${e.message ?? e}`);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Login</h2>
      <button onClick={signIn}>Continue with Google</button>
      <p style={{ marginTop: 12 }}><a href="/">Back home</a></p>
    </div>
  );
}


const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
]);

console.log("MAIN TSX LOADED (firebase sign-in test)");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
