import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const { signInGoogle } = useAuth();
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ padding: 24, border: "1px solid #ddd", borderRadius: 12 }}>
        <h1>Stack & Track — Sign in</h1>
        <button onClick={signInGoogle}>Continue with Google</button>
      </div>
    </main>
  );
}
