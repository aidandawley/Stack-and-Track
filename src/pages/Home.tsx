import React from "react";
import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const { getIdToken, signOutUser } = useAuth();
  const [status, setStatus] = React.useState<"idle"|"loading"|"ok"|"error">("idle");
  const [payload, setPayload] = React.useState<any>(null);

  React.useEffect(() => {
    (async () => {
      setStatus("loading");
      try {
        const t = await getIdToken();
        const res = await fetch("http://localhost:8080/api/me", {
          headers: {
            "Content-Type": "application/json",
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
        });
        const text = await res.text();
        try {
          const json = text ? JSON.parse(text) : null;
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          setPayload(json);
          setStatus("ok");
        } catch (e) {
          setPayload({ status: res.status, statusText: res.statusText, body: text });
          setStatus("error");
        }
      } catch (e: any) {
        setPayload({ message: e?.message || String(e) });
        setStatus("error");
      }
    })();
  }, [getIdToken]);

  return (
    <main style={{ padding: 24 }}>
      <h2>Home</h2>
      <button onClick={signOutUser}>Sign out</button>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <strong>Backend /api/me:</strong>
        {status === "loading" && <div>Loading…</div>}
        {status === "ok" && (
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(payload, null, 2)}</pre>
        )}
        {status === "error" && (
          <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
