// src/pages/CollectionPage.tsx
import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

type SearchItem = {
  id: string;
  name: string;
  setName: string;
  imageSmall: string;
  priceUSD: number | null;
  priceUpdatedAt: string | null;
};

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIdToken } = useAuth();

  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // --- search state ---
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchItem[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [searchErr, setSearchErr] = React.useState<string | null>(null);

  // --- adding state ---
  const [addingId, setAddingId] = React.useState<string | null>(null);
  const [addedId, setAddedId] = React.useState<string | null>(null);

  // --- delete state ---
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

    //save item state
    type SavedItem = {
        id: string;         
        cardId: string;     
        name: string | null;
        setName: string | null;
        imageSmall: string | null;
        priceUSD: number | null;
        priceUpdatedAt: string | null;
        addedAt: string | null; 
    };
    
    const [items, setItems] = React.useState<SavedItem[]>([]);
    const [itemsLoading, setItemsLoading] = React.useState(true);
    const [itemsErr, setItemsErr] = React.useState<string | null>(null);

  // Helper to build auth headers
  const authHeaders = React.useCallback(async (): Promise<HeadersInit> => {
    const h = new Headers();
    const t = await getIdToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
    return h;
  }, [getIdToken]);

  // (Optional) load collection data here if you want to show name/items later
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      if (!id || ignore) return;
      // TODO: fetch collection details/items if needed
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      if (!id) return;
      setItemsLoading(true);
      setItemsErr(null);
      try {
        const url = `${API}/api/collections/${encodeURIComponent(id)}/items`;
        const r = await fetch(url, { headers: await authHeaders() });
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const data = (await r.json()) as SavedItem[];
        if (!aborted) setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!aborted) setItemsErr(e.message || String(e));
      } finally {
        if (!aborted) setItemsLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [id, API, authHeaders]);

  // Debounced search effect
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchErr(null);
      return;
    }

    let aborted = false;
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        setSearchErr(null);
        const url = `${API}/api/search/catalog?q=${encodeURIComponent(q)}&limit=10`;
        const r = await fetch(url, { headers: await authHeaders() });
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const data = (await r.json()) as SearchItem[];
        if (!aborted) setResults(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!aborted) {
          setSearchErr(e?.message || String(e));
          setResults([]);
        }
      } finally {
        if (!aborted) setSearching(false);
      }
    }, 300); // debounce ~300ms

    return () => {
      aborted = true;
      clearTimeout(t);
    };
  }, [query, API, authHeaders]);

  const handleDelete = React.useCallback(async () => {
    if (!id) return;
    const ok = window.confirm(
      "Delete this collection? This cannot be undone."
    );
    if (!ok) return;

    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`${API}/api/collections/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `${r.status} ${r.statusText}`);
      }
      // Success → go back to list
      navigate("/collections", { replace: true });
    } catch (e: any) {
      setErr(e.message || String(e));
      setBusy(false);
    }
  }, [API, id, authHeaders, navigate]);

  const handleAdd = React.useCallback(async (item: SearchItem) => {
    if (!id) return;
    setAddingId(item.id);
    setErr(null);
    try {
      const url = `${API}/api/collections/${encodeURIComponent(id)}/items`;
  
     
      const headers = new Headers(await authHeaders());
      headers.set("Content-Type", "application/json");
  
      const r = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          setName: item.setName,
          imageSmall: item.imageSmall,
          priceUSD: item.priceUSD,
          priceUpdatedAt: item.priceUpdatedAt,
        }),
      });
  
      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `${r.status} ${r.statusText}`);
      }
      const saved = (await r.json()) as SavedItem;  
    setItems((prev) => [saved, ...prev]);          
      setAddedId(item.id);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setAddingId(null);
      setTimeout(() => setAddedId(null), 1500);
    }
  }, [API, id, authHeaders]);
  
  
  const handleDeleteItem = React.useCallback(async (itemId: string) => {
    if (!id) return;
    setDeletingId(itemId);
    try {
      const url = `${API}/api/collections/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`;
      const r = await fetch(url, { method: "DELETE", headers: await authHeaders() });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setDeletingId(null);
    }
  }, [API, id, authHeaders]);

  return (
    <main className="container">
      <header className="header">
        <div className="row">
          <Link to="/collections" className="btn">
            ← Back
          </Link>
          <h2 style={{ marginLeft: 12 }}>Collection</h2>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={busy || !id}
            title="Delete this collection"
          >
            Delete collection
          </button>
        </div>
      </header>

      {err && (
        <p style={{ color: "#f88", marginTop: 8 }}>
          {err}
        </p>
      )}

      <p style={{ color: "var(--color-muted)" }}>
        Collection ID: <code>{id}</code>
      </p>

      {/* --- Search box + results panel --- */}
      <section style={{ marginTop: 16 }}>
        <label
          htmlFor="card-search"
          style={{ display: "block", marginBottom: 8, color: "var(--color-muted)" }}
        >
          Search cards to add
        </label>

        <input
          id="card-search"
          className="input"
          placeholder="Type at least 2 characters…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />

        {(query.trim().length >= 2) && (
          <div className="card" style={{ marginTop: 10, padding: 10 }}>
            {searching && <div style={{ padding: 12 }}>Searching…</div>}
            {searchErr && (
              <div style={{ padding: 12, color: "#f88" }}>
                Search error: {searchErr}
              </div>
            )}
            {!searching && !searchErr && results.length === 0 && (
              <div style={{ padding: 12, color: "var(--color-muted)" }}>
                No results.
              </div>
            )}
            {!searching && results.length > 0 && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {results.map((r) => (
                  <li
                    key={r.id}
                    className="tile"
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: 8,
                      marginBottom: 6,
                    }}
                  >
                    <img
                      src={r.imageSmall}
                      alt=""
                      width={48}
                      height={68}
                      style={{
                        borderRadius: 8,
                        objectFit: "cover",
                        background: "#111",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontSize: ".9rem", color: "var(--color-muted)" }}>
                        {r.setName}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 80 }}>
                      <div style={{ fontWeight: 700 }}>
                        {r.priceUSD != null ? `$${r.priceUSD.toFixed(2)}` : "—"}
                      </div>
                    </div>
                    {/* We'll wire this “Add” action next */}
                    <button
                        className="btn btn--primary"
                        onClick={() => handleAdd(r)}
                        disabled={!id || addingId === r.id}
                        title={addedId === r.id ? "Added!" : "Add to collection"}
                        >
                        {addedId === r.id ? "Added ✓" : (addingId === r.id ? "Adding…" : "Add")}
                    </button>

                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
  <h3 style={{ margin: "0 0 8px" }}>Items in this collection</h3>

  {itemsLoading && <div className="card" style={{ padding: 12 }}>Loading…</div>}
  {itemsErr && <div style={{ color: "#f88", marginTop: 8 }}>{itemsErr}</div>}

  {!itemsLoading && items.length === 0 && (
    <div className="card" style={{ padding: 12, color: "var(--color-muted)" }}>
      No items yet — try adding one from the search above.
    </div>
  )}

  {items.length > 0 && (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map((it) => (
        <li key={it.id}
            className="tile"
            style={{ display: "flex", gap: 12, alignItems: "center", padding: 8, marginBottom: 6 }}>
          <img
            src={it.imageSmall || ""}
            alt=""
            width={48}
            height={68}
            style={{ borderRadius: 8, objectFit: "cover", background: "#111" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>{it.name ?? "(Unnamed card)"}</div>
            <div style={{ fontSize: ".9rem", color: "var(--color-muted)" }}>
              {it.setName ?? ""}
            </div>
          </div>
          <div style={{ textAlign: "right", minWidth: 80 }}>
            <div style={{ fontWeight: 700 }}>
              {it.priceUSD != null ? `$${it.priceUSD.toFixed(2)}` : "—"}
            </div>
          </div>
          <button
            className="btn btn--danger"
            onClick={() => handleDeleteItem(it.id)}
            disabled={deletingId === it.id}
            title="Remove from collection"
          >
            {deletingId === it.id ? "Removing…" : "×"}
          </button>
        </li>
      ))}
    </ul>
  )}
</section>

    </main>
  );
}
