// src/App.tsx
import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Collections from "./pages/Collections";
import CollectionPage from "./pages/CollectionPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import { useAuth } from "./auth/AuthProvider";

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/collections"
        element={
          <ProtectedRoute>
            <Collections />
          </ProtectedRoute>
        }
      />

      <Route
        path="/collections/:id"
        element={
          <ProtectedRoute>
            <CollectionPage />
          </ProtectedRoute>
        }
      />

      {/* Home redirects once loading is done */}
      <Route
        path="/"
        element={
          loading ? (
            <div style={{ padding: 24 }}>Loading…</div>
          ) : user ? (
            <Navigate to="/collections" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 -> Collections (or Login if not authed) */}
      <Route
        path="*"
        element={<Navigate to={user ? "/collections" : "/login"} replace />}
      />
    </Routes>
  );
}
