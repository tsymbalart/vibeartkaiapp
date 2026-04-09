import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { apiUrl } from "@/lib/api";

export type Role = "member" | "lead" | "director";

export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  role: Role;
  teamId: number | null;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (returnTo?: string) => void;
  logout: () => void;
  devLogin: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/auth/user"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback((returnTo?: string) => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    const rt = returnTo || window.location.pathname;
    const loginUrl = `${base}/api/login?returnTo=${encodeURIComponent(rt)}`;
    if (window.top !== window.self) {
      window.open(loginUrl, "_top");
    } else {
      window.location.href = loginUrl;
    }
  }, []);

  const logout = useCallback(() => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    window.location.href = `${base}/api/logout`;
  }, []);

  const devLogin = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/dev-login"), {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, devLogin, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
