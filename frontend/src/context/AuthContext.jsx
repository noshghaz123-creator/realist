import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let token = null;
    try {
      token = localStorage.getItem('token');
    } catch {
      setLoading(false);
      return;
    }
    if (token) {
      api
        .getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          try {
            localStorage.removeItem('token');
          } catch {
            /* ignore */
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    try {
      localStorage.setItem('token', data.token);
    } catch {
      /* ignore */
    }
    setUser(data.user);
    return data.user;
  };

  const register = async (body) => {
    const data = await api.register(body);
    try {
      localStorage.setItem('token', data.token);
    } catch {
      /* ignore */
    }
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await api.getMe();
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
