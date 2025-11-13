// src/pages/RequireAuth.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '@/lib/api';
import useAuth from '@/store/auth';

export default function RequireAuth({ children }) {
  const { token, logout } = useAuth();
  const [ok, setOk] = useState(null);

  const isLocalToken =
    token &&
    (token.startsWith("ey") === false || token.includes("localdevsignature"));

  const isDev =
    import.meta.env.DEV ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  useEffect(() => {
    let alive = true;

    async function check() {
      if (!token) {
        setOk(false);
        return;
      }

      // =========================================
      // 🔐 LOGIN LOCAL → não usa /auth/me
      // =========================================
      if (isDev && isLocalToken) {
        setOk(true);
        return;
      }

      // =========================================
      // 🔐 PRODUÇÃO → validar no backend
      // =========================================
      try {
        await api.get('/auth/me');
        if (alive) setOk(true);
      } catch {
        logout();
        if (alive) setOk(false);
      }
    }

    check();
    return () => { alive = false; };
  }, [token, logout, isDev, isLocalToken]);

  if (ok === null) return null;
  if (!ok) return <Navigate to="/login" replace />;
  return children;
}
