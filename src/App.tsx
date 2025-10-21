// src/App.tsx
import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import Login from "./pages/Login";
import Collections from "./pages/Collections";
import CollectionPage from "./pages/CollectionPage";
import "./theme.css";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container"><p>Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Protected><Collections /></Protected>} />
        <Route path="/c/:id" element={<Protected><CollectionPage /></Protected>} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
