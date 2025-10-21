import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

type CollectionItem = {
  id: string;
  productId: number;
  productName: string;
  imageUrl?: string;
  condition?: string;
  lastPrice?: number;
  currency?: string;
};

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const { getIdToken } = useAuth();

  const [items, setItems] = React.useState<CollectionItem[]>([]);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [name, setName] = React.useState<string>("Collection");

  const authHeaders = React.useCallback(async (): Promise<HeadersInit> => {
    const h = new Headers();
    const t = await getIdToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
    return h;
  }, [getIdToken]);

  // TODO: Replace with your real endpoints when you add items to the backend
  async function loadItems() {
    setBusy(true); setErr(null);
    try {
      // placeholder: no real API yet
      // const r = await fetch(`${API}/api/collections/${id}/items`, { headers: await authHeaders() });
      // if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      // const data = await r.json();
      // setItems(data.items); setName(data.collectionName);

      setItems([]); // placeholder
      setName("My Collection");
    } catch (e: any) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  }

  React.useEffect(() => { void loadItems(); }, [id]);

  // —— search (future TCGplayer suggestion) ——
  async function searchProducts(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    // When ready:
    // const r = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`, { headers: await authHeaders() });
    // const results = await r.json();
    // present a modal/list to add selected product to this collection.
    alert(`Search TODO: "${q}"`);
  }

  const total = items.reduce((sum, it) => sum + (it.lastPrice ?? 0), 0);

  return (
    <main className="container">
      <header className="header">
        <div className="row">
          <Link to="/collections" className="btn" style={{ textDecoration:"none" }}>← Back</Link>
          <h2 style={{ margin:"0 0 0 12px" }}>{name}</h2>
        </div>
        <span className="tag">Total value: {total.toLocaleString(undefined, { style:"currency", currency:"USD" })}</span>
      </header>

      <section className="card" style={{ padding:16, marginBottom:18 }}>
        <form className="row" onSubmit={searchProducts}>
          <input className="input" placeholder="Search item to add…" value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="btn btn--primary" type="submit">Search</button>
        </form>
        {err && <p style={{ color:"#f88", marginTop:10 }}>{err}</p>}
      </section>

      {busy && <p>Loading…</p>}

      <section className="grid">
        {items.map(it => (
          <div key={it.id} className="card" style={{ padding:12 }}>
            <div className="row" style={{ gap:12 }}>
              <div style={{ width:72, height:72, borderRadius:12, overflow:"hidden", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)" }}>
                {it.imageUrl
                  ? <img src={it.imageUrl} alt={it.productName} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"grid", placeItems:"center", color:"#90a4b6"}}>Img</div>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700 }}>{it.productName}</div>
                <div style={{ color:"var(--color-muted)", fontSize:13 }}>
                  {it.condition ?? "—"} · {it.productId}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:800 }}>
                  {it.lastPrice != null
                    ? it.lastPrice.toLocaleString(undefined, { style:"currency", currency: it.currency ?? "USD" })
                    : "—"}
                </div>
                <button className="btn btn--danger" style={{ marginTop:8, padding:"8px 12px", fontSize:13 }}
                  onClick={() => alert("Remove item TODO")}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {!busy && items.length === 0 && (
          <div className="tile" style={{ padding:24 }}>
            No items yet. Use the search above to add from TCGplayer (coming soon).
          </div>
        )}
      </section>
    </main>
  );
}
