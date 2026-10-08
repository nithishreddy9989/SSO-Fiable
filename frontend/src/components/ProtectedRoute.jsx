import React from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Reusable React Protected Route Component.
 * Wrap any page or component in your React project to enforce Microsoft Entra ID authentication
 * and optional Role-Based Access Control (RBAC).
 *
 * Example:
 * `<ProtectedRoute requiredRole="Admin"><AdminDashboard /></ProtectedRoute>`
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
  fallback,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium">
        Checking authentication status...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      fallback || (
        <div className="p-8 text-center text-amber-400 glass-panel border border-amber-500/30">
          <h3 className="text-lg font-bold">Authentication Required</h3>
          <p className="text-xs text-slate-300 mt-1">
            Please sign in with Microsoft Entra ID to access this page.
          </p>
        </div>
      )
    );
  }

  if (requiredRole && !user.roles.includes(requiredRole)) {
    return (
      <div className="p-8 text-center text-red-400 glass-panel border border-red-500/30">
        <h3 className="text-lg font-bold">Access Denied</h3>
        <p className="text-xs text-slate-300 mt-1">
          Your account does not possess the required role: <code className="font-mono text-cyan-300">{requiredRole}</code>
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
