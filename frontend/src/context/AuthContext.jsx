import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem("netshield_token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await api.get("/users/me");

      setUser(res.data);

      return res.data;
    } catch (error) {
      console.error("LOAD USER ERROR:", error);

      setUser(null);

      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("netshield_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        refreshUser: loadUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}