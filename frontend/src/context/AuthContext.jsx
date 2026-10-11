import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchMe, loginUser, registerUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("rumion_token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem("rumion_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await loginUser({ email, password });
    localStorage.setItem("rumion_token", token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user } = await registerUser(payload);
    localStorage.setItem("rumion_token", token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("rumion_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
