import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { firebaseUser, role, loading } = useAuth();
  const navigate = useNavigate();

  const unauthorized = !loading && (!firebaseUser || (allowedRoles && !allowedRoles.includes(role)));

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      navigate("/login", { replace: true });
    } else if (allowedRoles && !allowedRoles.includes(role)) {
      navigate("/", { replace: true });
    }
  }, [firebaseUser, role, loading, allowedRoles, navigate]);

  if (loading || unauthorized) {
    return <div className="p-10 text-center text-muted">Loading…</div>;
  }

  return children;
}