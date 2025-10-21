// src/pages/CollectionPage.tsx
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const { getIdToken } = useAuth();

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      const token = await getIdToken();
      if (!token || !id || ignore) return;
      // fetch items for this collection here...
    })();
    return () => { ignore = true; };
  }, [id, getIdToken]);

  return (
    <main className="container">
      <header className="header">
        <div className="row">
          <Link to="/collections" className="btn">← Back</Link>
          <h2 style={{ marginLeft: 12 }}>Collection</h2>
        </div>
      </header>

      <p style={{ color: "var(--color-muted)" }}>
        Collection ID: <code>{id}</code>
      </p>
      {/* render collection items here */}
    </main>
  );
}
