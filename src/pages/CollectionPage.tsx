// src/pages/CollectionPage.tsx
import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIdToken } = useAuth();

  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

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

      {/* TODO: render collection items here */}
    </main>
  );
}
