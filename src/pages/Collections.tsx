import * as React from "react";
import { useAuth } from "../auth/AuthProvider";
import { Link } from "react-router-dom";

type Collection = { id: string; name: string; createdAt: string };

const API = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/+$/, "");

export default function Collections() {
  const { user, signOutUser, getIdToken } = useAuth();
  const [items, setItems] = React.useState<Collection[]>([]);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
    
  const authHeaders = React.useCallback(async (): Promise<HeadersInit> => {
    const h = new Headers();
    const t = await getIdToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
    return h;
  }, [getIdToken]);

  const load = React.useCallback(async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${API}/api/collections`, { headers: await authHeaders() });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      setItems(await r.json());
    } catch (e: any) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  }, [authHeaders]);

  React.useEffect(() => { void load(); }, [load]);

  const createOne = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setErr(null);
    const h = new Headers(await authHeaders());
    h.set("Content-Type","application/json");
    const r = await fetch(`${API}/api/collections`, { method:"POST", headers: h, body: JSON.stringify({ name: trimmed })});
    if (!r.ok) { setErr(await r.text()); return; }
    setName(""); await load();
  };

  return (
    <main className="container">
      <header className="header">
        <div className="row">
          <div className="logo">Stack & Track</div>
          <span className="tag">Collections</span>
        </div>
        <div className="row" style={{ gap:10 }}>
          <span style={{ color:"var(--color-muted)", fontSize:14 }}>
            {user?.email}
          </span>
          <button className="btn btn--danger" onClick={signOutUser}>Sign out</button>
        </div>
      </header>

      <section className="card" style={{ padding:16, marginBottom:18 }}>
        <form className="row" onSubmit={createOne}>
          <input className="input" placeholder="New collection name…" value={name} onChange={e=>setName(e.target.value)} />
          <button className="btn btn--primary" type="submit">Create</button>
        </form>
        {err && <p style={{ color:"#f88", marginTop:10 }}>{err}</p>}
      </section>

      <section className="grid">
      {items.map(c => (
  <Link
    key={c.id}
    to={`/collections/${c.id}`}
    className="card neon"
    style={{ padding:16 }}
  >
    <div className="row" style={{ justifyContent:"space-between" }}>
      <strong style={{ fontSize:18 }}>{c.name}</strong>
      <span className="tag">
        {new Date(c.createdAt).toLocaleString()}
      </span>
    </div>
    <p style={{ color:"var(--color-muted)", marginTop:8, marginBottom:0 }}>
      Open collection →
    </p>
  </Link>
))}

        {!busy && items.length === 0 && (
          <div className="tile" style={{ padding:24 }}>
            No collections yet. Create your first above!
          </div>
        )}
      </section>
    </main>
  );
}
