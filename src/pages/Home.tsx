import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const { user, signOutUser } = useAuth();
  return (
    <div style={{ padding: 16 }}>
      <h2>Welcome {user?.displayName}</h2>
      <p>You’re signed in.</p>
      <button onClick={signOutUser}>Sign out</button>
    </div>
  );
}
