import React from "react";
import { useAuth } from "../auth/AuthProvider";

type Collection = { id: number; name: string; createdAt: string };

// ---- sanitize API base (no trailing slash) ----
const RAW = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const API_BASE = RAW.replace(/\/+$/, ""); // <= important

export default function Home() {
  const { user, loading, getIdToken, signOutUser } = useAuth();
  const [items, setItems] = React.useState<Collection[]>([]);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const authHeaders = React.useCallback(async (): Promise<HeadersInit> => {
    const h = new Headers();
    const t = await getIdToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
    return h;
  }, [getIdToken]);

  const load = React.useCallback(async () => {
    if (loading || !user) return;
    setBusy(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/collections`; // <= will be single slash
      const h = await authHeaders();

      // helpful debug (remove later)
      const token = (h as Headers).get("Authorization") ?? "";
      console.log("GET", url, "| token length:", token.length);

      const r = await fetch(url, { headers: h });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new Error(`${r.status} ${r.statusText}${body ? `: ${body}` : ""}`);
      }
      setItems(await r.json());
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }, [authHeaders, loading, user]);

  React.useEffect(() => { void load(); }, [load]);

  const createOne = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || loading || !user) return;

    setError(null);
    try {
      const url = `${API_BASE}/api/collections`;
      const h = new Headers(await authHeaders());
      h.set("Content-Type", "application/json");

      // helpful debug (remove later)
      const token = h.get("Authorization") ?? "";
      console.log("POST", url, "| token length:", token.length);

      const r = await fetch(url, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ name: trimmed }),
      });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new Error(`${r.status} ${r.statusText}${body ? `: ${body}` : ""}`);
      }
      setName("");
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h2>Collections</h2>
      <button onClick={signOutUser}>Sign out</button>

      <form onSubmit={createOne} style={{ marginTop: 16 }}>
        <input
          placeholder="New collection name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, width: 320, marginRight: 8 }}
          disabled={loading || !user}
        />
        <button type="submit" disabled={loading || !user}>
          Create
        </button>
      </form>

      {(busy || loading) && <p style={{ marginTop: 16 }}>Loading…</p>}
      {error && <pre style={{ color: "crimson", marginTop: 16 }}>{error}</pre>}

      <ul style={{ marginTop: 16 }}>
        {items.map((c) => (
          <li key={c.id}>
            <strong>{c.name}</strong>{" "}
            <small>({new Date(c.createdAt).toLocaleString()})</small>
          </li>
        ))}
        {!busy && !loading && items.length === 0 && <li>No collections yet.</li>}
      </ul>
    </main>
  );
}
