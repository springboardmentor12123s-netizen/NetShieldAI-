import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import axios from "axios";

export type Role =
  | "Administrator"
  | "SOC Analyst"
  | "Security Engineer"
  | "Read Only"
  | "Security Analyst"
  | "Admin";

export interface AuthUser {
  email: string;
  name: string;
  role: Role;
  initials: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  loading: boolean;
}

const KEY = "netshield.user";

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem(KEY);

    if (data) {
      setUser(JSON.parse(data));
    }

    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    try {
      const res = await axios.post(
  "http://localhost:8000/login",
        {
          email,
          password,
        }
      );

      const backendUser = res.data;

      const u: AuthUser = {
        email,
        name: backendUser.name,
        role: backendUser.role,
        initials: backendUser.name
          .split(" ")
          .map((x: string) => x[0])
          .join("")
          .toUpperCase(),
      };

      localStorage.setItem(KEY, JSON.stringify(u));

      setUser(u);

      return u;
    } catch (err: any) {
  console.log("FULL ERROR:", err);
  console.log("RESPONSE:", err.response);
  console.log("DATA:", err.response?.data);

  throw err;
}
  }

  function logout() {
    localStorage.removeItem(KEY);
    setUser(null);
  }

  return (
    <Ctx.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return ctx;
}