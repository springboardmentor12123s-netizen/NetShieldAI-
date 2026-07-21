import { createContext, useContext, useState, useCallback } from "react";
import { Api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => Api.getStoredUser());

  const login = useCallback(async (email, password) => {
    const data = await Api.post("/auth/login", { email, password }, { auth: false });
    Api.setSession(data.access_token, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (full_name, email, password) => {
    const data = await Api.post("/auth/signup", { full_name, email, password }, { auth: false });
    Api.setSession(data.access_token, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    Api.clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
