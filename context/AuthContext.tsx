"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getValidToken, clearAuthData } from "@/utils/tokenUtils";

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  division: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      const validToken = getValidToken();

      if (storedUser && validToken) {
        setUser(JSON.parse(storedUser));
        setToken(validToken);
      } else if (storedUser && !validToken) {
        // Token expired, clear user data
        clearAuthData();
      }
    }
    setLoading(false); // Mark loading as complete after retrieving data
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setToken(token);

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthData();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
