import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { type ReactNode } from "react";

export default function ProtectedRoute({
  children,
  to = "/login",
}: {
  children: ReactNode;
  to?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!user) return <Navigate to={to} replace />;

  return <>{children}</>;
}
